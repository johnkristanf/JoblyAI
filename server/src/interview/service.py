import asyncio
import base64
import logging
import time
import wave
from openai import AsyncOpenAI
from deepgram import AsyncDeepgramClient
from deepgram.listen.v2.socket_client import AsyncV2SocketClient
from deepgram.listen.v2 import ListenV2TurnInfo
from elevenlabs import AsyncElevenLabs
from fastapi import WebSocket, WebSocketDisconnect

from src.config.runtime import params
from src.prompt import MockInterviewPrompt

logger = logging.getLogger("interview")

SAMPLE_RATE = 16000  # Hz — must match what the browser sends


class InterviewService:
    """
    Orchestrates a full voice-driven mock interview session over a single
    WebSocket connection.

    Message protocol
    ────────────────
    Client → Server:
        {"type": "audio",        "data": "<base64 raw 16-bit PCM @ 16 kHz mono>"}
        {"type": "playback_done"}   — sent after AI audio finishes + 400 ms tail;
                                      signals server to start accepting Deepgram transcripts
        {"type": "end"}

    Server → Client:
        {"type": "audio",      "data": "<base64 mp3>"}
        {"type": "transcript", "role": "user"|"ai", "text": "..."}
        {"type": "status",     "state": "listening"|"thinking"|"speaking"}
        {"type": "error",      "message": "..."}
    """

    def __init__(self):
        self._prompt = MockInterviewPrompt()
        self._openai = AsyncOpenAI(api_key=params["OPENAI_API_KEY"])
        self._elevenlabs = AsyncElevenLabs(api_key=params["ELEVENLABS_API_KEY"])
        self._dg = AsyncDeepgramClient(api_key=params["DEEPGRAM_API_KEY"])

    # ── public entry point ────────────────────────────────────────────────────

    async def run_session(self, websocket: WebSocket, job_title: str, employer: str):
        """
          Main AI Mock Interview Session Loop.
        """

        history: list[dict] = [
            self._prompt.load_system_prompt(job_title, employer)
        ]

        # 1. Send greeting FIRST — this takes ~4-6 s (LLM + TTS).
        try:
            await self._send_greeting(websocket, history)
        except WebSocketDisconnect:
            logger.info("Client disconnected during greeting — aborting session")
            return

        # 2. Queues for communication between tasks
        transcript_queue: asyncio.Queue[str] = asyncio.Queue()
        user_audio_queue: asyncio.Queue[bytes] = asyncio.Queue()
        stop_event = asyncio.Event()

        # Layer 2 loopback guard ─────────────────────────────────────────────
        # Discards any deepgram transcripts while the AI audio is still playing 
        accept_transcripts = False

        async with self._dg.listen.v2.connect(
            model="flux-general-en",
            encoding="linear16",
            sample_rate=SAMPLE_RATE,
        ) as dg_socket:

            fwd_task = asyncio.create_task(
                self._forward_audio_to_deepgram(dg_socket, user_audio_queue, stop_event)
            )
            rx_task = asyncio.create_task(
                self._receive_transcripts_from_deepgram(dg_socket, transcript_queue, stop_event)
            )

            # 4. Main loop: receive browser messages and process transcripts
            try:
                while True:
                    while not transcript_queue.empty():
                        user_text = await transcript_queue.get()
                        logger.info(f"user_text: {user_text}")

                        if not accept_transcripts:
                            logger.warning(
                                f"[Loopback guard] Discarding transcript '{user_text}' "
                                "received before playback_done — possible AI voice loopback"
                            )
                            continue

                        await self._send_transcript(websocket, "user", user_text)

                        await self._send_status(websocket, "thinking")
                        history.append({"role": "user", "content": user_text})
                        ai_text = await self._llm_reply(history)
                        history.append({"role": "assistant", "content": ai_text})

                        # Close the transcript gate before AI speaks; it re-opens
                        # only when the client sends playback_done.
                        accept_transcripts = False
                        await self._send_status(websocket, "speaking")
                        await self._tts_and_send(websocket, ai_text)
                        await self._send_transcript(websocket, "ai", ai_text)
                        await self._send_status(websocket, "listening")

                    # Non-blocking receive from browser client
                    try:
                        msg = await asyncio.wait_for(websocket.receive_json(), timeout=0.05)
                    except asyncio.TimeoutError:
                        continue

                    if msg.get("type") == "end":
                        break

                    # Client signals that TTS audio has finished playing
                    if msg.get("type") == "playback_done":
                        accept_transcripts = True
                        logger.info("[Loopback guard] playback_done received — Deepgram transcripts now accepted")

                    # Client signals user is done speaking (via VAD timeout)
                    if msg.get("type") == "user_done":
                        logger.info("Received user_done from client (VAD timeout). Relying on Deepgram native EndOfTurn.")

                    if msg.get("type") == "audio":
                        raw = base64.b64decode(msg["data"])
                        await user_audio_queue.put(raw)

            except WebSocketDisconnect:
                logger.info("Client disconnected")
            except Exception as e:
                logger.error(f"Session error: {e}", exc_info=True)
                try:
                    await websocket.send_json({"type": "error", "message": str(e)})
                except Exception:
                    pass
            finally:
                stop_event.set()
                fwd_task.cancel()
                rx_task.cancel()
                await asyncio.gather(fwd_task, rx_task, return_exceptions=True)

    # ── private helpers ───────────────────────────────────────────────────────

    async def _send_greeting(self, websocket, history: list[dict]):
        """
            Generate and send the initial AI greeting.
        """
        greeting_text = await self._llm_reply(history, self._prompt.load_greeting_prompt())
        logger.info(f"greeting_text: {greeting_text}")

        history.append({"role": "assistant", "content": greeting_text})

        # Guard: check the socket is still open before sending anything
        if websocket.client_state.value != 1:  # 1 = CONNECTED
            raise WebSocketDisconnect(code=1000)

        await self._send_status(websocket, "speaking")
        await self._tts_and_send(websocket, greeting_text)
        await self._send_transcript(websocket, "ai", greeting_text)
        await self._send_status(websocket, "listening")

    async def _forward_audio_to_deepgram(self, dg_socket: AsyncV2SocketClient, user_audio_queue: asyncio.Queue, stop_event: asyncio.Event):
        """Task to forward audio bytes from the browser to Deepgram."""
        logger.info(f"user_audio_queue: {user_audio_queue}")
        while not stop_event.is_set():
            try:
                chunk = await asyncio.wait_for(user_audio_queue.get(), timeout=0.1)
                await dg_socket.send_media(chunk)
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.warning(f"Audio forward error: {e}")
                break

    async def _receive_transcripts_from_deepgram(self, dg_socket: AsyncV2SocketClient, transcript_queue: asyncio.Queue, stop_event: asyncio.Event):
        """Task to receive transcripts from Deepgram."""
        current_transcript = ""
        try:
            async for message in dg_socket:
                if stop_event.is_set():
                    break
                if isinstance(message, dict) and message.get('type') == 'TurnInfo':
                    try:
                        text = message.get('transcript', '').strip()
                        event = message.get('event')
                        confidence = message.get('end_of_turn_confidence')
                        logger.info(f"Deepgram transcript: '{text}' | event={event} | confidence={confidence}")
                        if text:
                            current_transcript = text
                        if event == 'EndOfTurn' and current_transcript:
                            logger.info(f"End of turn — queuing: '{current_transcript}'")
                            await transcript_queue.put(current_transcript)
                            current_transcript = ""
                    except Exception as e:
                        logger.warning(f"Transcript parse error: {e}")
        except Exception as e:
            logger.error(f"Deepgram receive task crashed: {e}", exc_info=True)

    async def _llm_reply(self, history: list[dict], extra_message: dict | None = None) -> str:
        """Call OpenAI with the full conversation history and return the reply text."""
        messages = history.copy()
        if extra_message:
            messages.append(extra_message)

        response = await self._openai.responses.create(
            model=params["OPENAI_MODEL"],
            input=messages,
            temperature=0.7,
        )
        return response.output_text.strip()

    async def _tts_and_send(self, websocket, text: str):
        """Convert text to speech via ElevenLabs and send base64-encoded mp3."""
        audio_iter = self._elevenlabs.text_to_speech.convert(
            voice_id="CwhRBWXzGAHq8TQ4Fs17",
            text=text,
            model_id="eleven_turbo_v2",
            output_format="mp3_44100_128",
        )

        chunks: list[bytes] = []
        async for chunk in audio_iter:
            if chunk:
                chunks.append(chunk)

        if chunks:
            audio_bytes = b"".join(chunks)
            encoded = base64.b64encode(audio_bytes).decode("utf-8")
            await websocket.send_json({"type": "audio", "data": encoded})

    async def _send_status(self, websocket, state: str):
        await websocket.send_json({"type": "status", "state": state})

    async def _send_transcript(self, websocket, role: str, text: str):
        await websocket.send_json({"type": "transcript", "role": role, "text": text})

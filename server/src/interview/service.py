import asyncio
import base64
import logging
import time
import wave
from openai import AsyncOpenAI
from deepgram import AsyncDeepgramClient
from deepgram.listen.v1.socket_client import AsyncV1SocketClient
from deepgram.listen.v1.types.listen_v1results import ListenV1Results
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
          Main interview session loop. Blocks until the client sends {"type":"end"} or
          the WebSocket is closed.
        """

        turn_audio_buffer = bytearray()

        history: list[dict] = [
            self._prompt.load_system_prompt(job_title, employer)
        ]

        # 1. Send greeting FIRST — this takes ~4-6 s (LLM + TTS).
        #    The client will start its mic right after receiving the greeting,
        #    so audio will arrive shortly after we open Deepgram below.
        try:
            await self._send_greeting(websocket, history)
        except WebSocketDisconnect:
            logger.info("Client disconnected during greeting — aborting session")
            return

        # 2. Queues for communication between tasks
        transcript_queue: asyncio.Queue[str] = asyncio.Queue()
        audio_queue: asyncio.Queue[bytes] = asyncio.Queue()
        stop_event = asyncio.Event()

        # Layer 2 loopback guard ─────────────────────────────────────────────
        # Start False so that any Deepgram transcripts arriving while the AI
        # greeting is still playing are discarded.  The client sets this True
        # by sending {"type": "playback_done"} after audio finishes + 400 ms tail.
        accept_transcripts = False

        # 3. Open Deepgram AFTER greeting — mic audio should start arriving
        #    within a second, well inside the 10-second NET-0001 window.
        async with self._dg.listen.v1.connect(
            model="nova-2",
            language="en",
            encoding="linear16",
            sample_rate=SAMPLE_RATE,
            channels=1,
            punctuate=True,
            interim_results=True,
            utterance_end_ms=1200,
        ) as dg_socket:

            fwd_task = asyncio.create_task(
                self._forward_audio_to_deepgram(dg_socket, audio_queue, stop_event)
            )
            rx_task = asyncio.create_task(
                self._receive_transcripts_from_deepgram(dg_socket, transcript_queue, stop_event)
            )
            # KeepAlive: ping Deepgram every 5 s so the connection stays open
            # during silent gaps (e.g. while the AI is speaking / thinking).
            ka_task = asyncio.create_task(
                self._deepgram_keepalive(dg_socket, stop_event)
            )

            # 4. Main loop: receive browser messages and process transcripts
            try:
                while True:
                    # Process any pending final transcripts first.
                    # Layer 2 guard: only consume if the client has confirmed its
                    # AI audio playback is done (playback_done message received).
                    while not transcript_queue.empty():
                        user_text = await transcript_queue.get()

                        if not accept_transcripts:
                            logger.warning(
                                f"[Loopback guard] Discarding transcript '{user_text}' "
                                "received before playback_done — possible AI voice loopback"
                            )
                            continue

                        if turn_audio_buffer:
                            debug_wav_filename = f"debug_turn_{int(time.time())}.wav"
                            with wave.open(debug_wav_filename, "wb") as wav_file:
                                wav_file.setnchannels(1)
                                wav_file.setsampwidth(2)
                                wav_file.setframerate(SAMPLE_RATE)
                                wav_file.writeframes(turn_audio_buffer)
                            logger.info(f"Saved turn audio to {debug_wav_filename}")
                            turn_audio_buffer.clear()

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

                    # Layer 2: client signals that TTS audio has finished playing
                    # (including the 400 ms acoustic tail on the client side).
                    # Only after this do we start consuming Deepgram transcripts,
                    # preventing AI loopback audio from being treated as candidate speech.
                    if msg.get("type") == "playback_done":
                        accept_transcripts = True
                        logger.info("[Loopback guard] playback_done received — Deepgram transcripts now accepted")

                    if msg.get("type") == "audio":
                        raw = base64.b64decode(msg["data"])
                        turn_audio_buffer.extend(raw)
                        await audio_queue.put(raw)

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
                ka_task.cancel()
                await asyncio.gather(fwd_task, rx_task, ka_task, return_exceptions=True)

    # ── private helpers ───────────────────────────────────────────────────────

    async def _send_greeting(self, websocket, history: list[dict]):
        """Generate and send the initial AI greeting.

        Raises WebSocketDisconnect if the client has already disconnected
        by the time we try to send (common when the tab is rapidly refreshed).
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

    async def _forward_audio_to_deepgram(self, dg_socket: AsyncV1SocketClient, audio_queue: asyncio.Queue, stop_event: asyncio.Event):
        """Task to forward audio bytes from the browser to Deepgram."""
        logger.info(f"audio_queue: {audio_queue}")
        while not stop_event.is_set():
            try:
                chunk = await asyncio.wait_for(audio_queue.get(), timeout=0.1)
                await dg_socket.send_media(chunk)
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.warning(f"Audio forward error: {e}")
                break

    async def _deepgram_keepalive(self, dg_socket: AsyncV1SocketClient, stop_event: asyncio.Event):
        """
        Send a KeepAlive ping to Deepgram every 5 seconds.

        Deepgram closes the socket (NET-0001) if it receives neither audio nor
        a text message for 10 seconds.  This is especially likely during the
        AI's speaking / thinking turn when no mic audio is being forwarded.
        The KeepAlive JSON message resets that timer without affecting
        transcription.
        """
        import json
        while not stop_event.is_set():
            try:
                await asyncio.sleep(5)
                if not stop_event.is_set():
                    await dg_socket.send_keep_alive()
                    logger.debug("Sent Deepgram KeepAlive")
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.warning(f"KeepAlive error: {e}")
                break

    async def _receive_transcripts_from_deepgram(self, dg_socket: AsyncV1SocketClient, transcript_queue: asyncio.Queue, stop_event: asyncio.Event):
        """Task to receive transcripts from Deepgram."""
        current_transcript = []
        try:
            async for message in dg_socket:
                if stop_event.is_set():
                    break
                logger.info(f"Deepgram message: {type(message).__name__}")
                if isinstance(message, ListenV1Results):
                    try:
                        alt = message.channel.alternatives[0]
                        text = alt.transcript.strip()
                        logger.info(f"Deepgram transcript: '{text}' | is_final={message.is_final} | speech_final={message.speech_final}")
                        if message.is_final and text:
                            current_transcript.append(text)
                        if message.speech_final and current_transcript:
                            full_text = " ".join(current_transcript)
                            logger.info(f"Speech final — queuing: '{full_text}'")
                            await transcript_queue.put(full_text)
                            current_transcript = []
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

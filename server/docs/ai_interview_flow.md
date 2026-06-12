# AI Mock Interview Feature - Technical Flow

This document details the architecture and technical flow of the AI Mock Interview feature. The system orchestrates a full voice-driven mock interview session over a single WebSocket connection between the frontend client and the backend server.

## Overview
The AI interview relies on the following external services:
*   **Deepgram (Listen V2 Flux model):** Real-time conversational speech-to-text (STT) and end-of-turn detection.
*   **OpenAI:** Large Language Model (LLM) to generate interview responses.
*   **ElevenLabs:** High-quality, low-latency Text-to-Speech (TTS).

## Message Protocol (Client <-> Server)

The entire interview is driven over a single WebSocket connection.

**Client to Server:**
*   `{"type": "audio", "data": "<base64 raw 16-bit PCM @ 16 kHz mono>"}`: Streams raw microphone audio from the browser to the server.
*   `{"type": "playback_done"}`: Sent by the client after the AI's TTS audio finishes playing (plus a 400ms tail). This signals the server to start accepting Deepgram transcripts again (Loopback Guard).
*   `{"type": "user_done"}`: Signals the user is done speaking (via browser-side VAD timeout). Currently relies primarily on Deepgram's native `EndOfTurn`.
*   `{"type": "end"}`: Signals the end of the interview session.

**Server to Client:**
*   `{"type": "audio", "data": "<base64 mp3>"}`: Streams TTS audio chunks from ElevenLabs to the browser.
*   `{"type": "transcript", "role": "user"|"ai", "text": "..."}`: Delivers finalized transcripts for both the user and the AI.
*   `{"type": "status", "state": "listening"|"thinking"|"speaking"}`: Updates the client UI state based on what the server is currently doing.
*   `{"type": "error", "message": "..."}`: Sends any connection or processing errors.

## Execution Flow

1.  **Initialization & Greeting:**
    *   The `run_session` method starts when a WebSocket connects.
    *   The server loads the system prompt with the `job_title` and `employer`.
    *   It generates an initial AI greeting (via LLM), converts it to speech (via ElevenLabs TTS), and streams it to the client. This blocks the start of the user's turn until complete.

2.  **Audio Pipelines:**
    *   A WebSocket connection to Deepgram (`flux-general-en`) is established.
    *   Two concurrent background tasks are spawned:
        *   `_forward_audio_to_deepgram`: Reads raw audio bytes from the `user_audio_queue` (populated by incoming WebSocket messages) and streams them to Deepgram.
        *   `_receive_transcripts_from_deepgram`: Listens for `TurnInfo` messages from Deepgram. When it receives an `EndOfTurn` event with a transcript, it places the finalized text into the `transcript_queue`.

3.  **Main Event Loop:**
    The core loop constantly polls for new transcripts and incoming client messages.

    *   **Handling User Speech (Transcripts):**
        *   When a transcript is popped from the `transcript_queue`, it checks the `accept_transcripts` loopback guard.
        *   If the guard is open, the server sends the transcript to the client, updates the status to `thinking`, and queries the LLM with the conversation history.
        *   The guard is immediately closed (`accept_transcripts = False`) to prevent the AI from transcribing its own voice.
        *   The server updates the status to `speaking`, streams the LLM response to ElevenLabs for TTS generation, and forwards the resulting audio to the client.

    *   **Handling Client Messages:**
        *   Incoming raw `audio` is added to the `user_audio_queue`.
        *   When `playback_done` is received, the loopback guard is re-opened (`accept_transcripts = True`), allowing the user to speak again.
        *   When `end` is received, the loop terminates.

## Loopback Guard
A critical component of this flow is the `accept_transcripts` boolean flag. Because the user's microphone might pick up the AI's voice playing through their speakers (loopback), the server ignores any Deepgram transcripts generated while the AI is speaking. The gate only re-opens when the client explicitly sends a `playback_done` event.

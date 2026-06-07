import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, getAccessToken } from '~/lib/supabase/client'

const WS_BASE = import.meta.env.VITE_API_V1_BASE_URL ?? 'ws://localhost:8000'
const SAMPLE_RATE = 16_000 // must match server

export type InterviewStatus =
    | 'connecting'
    | 'listening'
    | 'thinking'
    | 'speaking'
    | 'ended'
    | 'error'

export interface Transcript {
    role: 'user' | 'ai'
    text: string
    id: number
}

export interface UseInterviewWsReturn {
    status: InterviewStatus
    transcripts: Transcript[]
    endSession: () => void
    error: string | null
    isMicMuted: boolean
    muteMic: () => void
    unmuteMic: () => void
    isSpeakerMuted: boolean
    setSpeakerMuted: (v: boolean) => void
}

export function useInterviewWs(jobTitle: string, employer: string): UseInterviewWsReturn {
    const [token, setToken] = useState<string | null>(null)

    // Fetch the JWT once on mount
    useEffect(() => {
        getAccessToken().then((t) => setToken(t))
    }, [])

    const wsRef = useRef<WebSocket | null>(null)
    const audioCtxRef = useRef<AudioContext | null>(null)
    const workletNodeRef = useRef<AudioWorkletNode | null>(null)
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const transcriptIdRef = useRef(0)

    const [status, setStatus] = useState<InterviewStatus>('connecting')
    const [transcripts, setTranscripts] = useState<Transcript[]>([])
    const [error, setError] = useState<string | null>(null)
    const [isMicMuted, setIsMicMuted] = useState(false)
    const [isSpeakerMuted, setIsSpeakerMuted] = useState(false)

    // refs so the onaudioprocess closure always sees the latest value
    const isMicMutedRef = useRef(false)
    const isSpeakerMutedRef = useRef(false)
    const canSendAudioRef   = useRef(false)
    // ── Loopback-prevention refs (Layer 1 + 2) ───────────────────────────────
    // isAiPlayingRef  — true while an AI audio buffer is actively playing back
    // pendingListenRef — true when server sent status:listening but audio is still playing;
    //                    mic is enabled only after onended fires + 400 ms tail
    const isAiPlayingRef   = useRef(false)
    const pendingListenRef = useRef(false)

    // ── play incoming AI audio ────────────────────────────────────────────────
    const playAudio = useCallback(async (base64Mp3: string) => {
        // Respect speaker mute — don't decode/play if muted
        if (isSpeakerMutedRef.current) return

        // ── Layer 1: hard-gate the mic for the entire AI speech duration ──────
        // Force canSendAudioRef off regardless of the current status value.
        // pendingListenRef captures a deferred "listening" signal from the server
        // so we can re-enable the mic once the audio actually finishes.
        isAiPlayingRef.current   = true
        canSendAudioRef.current  = false
        pendingListenRef.current = false // discard any stale deferred flag

        console.debug('[AEC] AI audio starting — mic gated')

        const binary = atob(base64Mp3)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

        const ctx = new AudioContext()
        const buffer = await ctx.decodeAudioData(bytes.buffer)
        const source = ctx.createBufferSource()
        source.buffer = buffer
        source.connect(ctx.destination)
        source.start()

        source.onended = () => {
            ctx.close()
            isAiPlayingRef.current = false

            // 400 ms tail: give the room acoustics / browser AEC time to settle
            // before reopening the mic to the candidate.
            setTimeout(() => {
                if (pendingListenRef.current) {
                    pendingListenRef.current = false
                    canSendAudioRef.current  = true
                    console.debug('[AEC] Tail elapsed — mic re-enabled after AI playback')

                    // ── Layer 2: notify server playback is truly done ─────────
                    // Server will only start accepting Deepgram transcripts after
                    // this signal, blocking any residual loopback that slipped through.
                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                        wsRef.current.send(JSON.stringify({ type: 'playback_done' }))
                        console.debug('[AEC] Sent playback_done to server')
                    }
                }
            }, 400)
        }
    }, [])

    // ── downsample Float32 from nativeSR → 16000 Hz ──────────────────────────
    const downsampleBuffer = useCallback(
        (buffer: Float32Array, inputSampleRate: number, outputSampleRate: number): Float32Array => {
            if (inputSampleRate === outputSampleRate) return buffer
            const ratio = inputSampleRate / outputSampleRate
            const newLength = Math.round(buffer.length / ratio)
            const result = new Float32Array(newLength)
            for (let i = 0; i < newLength; i++) {
                result[i] = buffer[Math.round(i * ratio)]
            }
            return result
        },
        [],
    )

    // ── start mic capture → send PCM chunks to server ─────────────────────────
    const startMic = useCallback(
        async (ws: WebSocket) => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    },
                    video: false,
                })
                streamRef.current = stream

                // Use native sample rate — forcing 16kHz on AudioContext is unreliable across browsers
                const ctx = new AudioContext()
                audioCtxRef.current = ctx

                console.log(`AudioContext native sample rate: ${ctx.sampleRate}`)

                const source = ctx.createMediaStreamSource(stream)
                sourceRef.current = source

                // Load the custom AudioWorklet processor from the public directory
                await ctx.audioWorklet.addModule('/audio-processor.js')
                const workletNode = new AudioWorkletNode(ctx, 'audio-recorder-processor')
                workletNodeRef.current = workletNode

                workletNode.port.onmessage = (e) => {
                    if (ws.readyState !== WebSocket.OPEN) return
                    // Only forward audio after the server enters listening mode.
                    if (!canSendAudioRef.current) return
                    // Respect mic mute — do not send while muted
                    if (isMicMutedRef.current) return

                    const float32Native = e.data

                    // Downsample to 16kHz for Deepgram
                    const float32 = downsampleBuffer(float32Native, ctx.sampleRate, SAMPLE_RATE)

                    // Convert Float32 → Int16 PCM
                    const int16 = new Int16Array(float32.length)
                    for (let i = 0; i < float32.length; i++) {
                        int16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768))
                    }

                    // Base64-encode and send
                    const bytes = new Uint8Array(int16.buffer)
                    let binary = ''
                    bytes.forEach((b) => (binary += String.fromCharCode(b)))
                    try {
                        const payload = JSON.stringify({ type: 'audio', data: btoa(binary) })
                        ws.send(payload)
                        // debug: confirm we sent a chunk
                        console.debug('sent audio chunk bytes=', bytes.length, 'ws.readyState=', ws.readyState)
                    } catch (err) {
                        console.warn('Failed to send audio chunk', err)
                    }
                }

                source.connect(workletNode)
                // Connect workletNode to destination so the audio graph stays active.
                // Our custom processor outputs silence, so no echo will be heard.
                workletNode.connect(ctx.destination)

                // Some browsers require the AudioContext to be resumed after a
                // user gesture. Ensure it's running.
                if (ctx.state === 'suspended') {
                    ctx.resume().catch(() => {})
                }
            } catch (err) {
                console.warn('Mic access denied:', err)
            }
        },
        [downsampleBuffer],
    )

    const stopMic = useCallback(() => {
        workletNodeRef.current?.disconnect()
        sourceRef.current?.disconnect()
        audioCtxRef.current?.close()
        streamRef.current?.getTracks().forEach((t) => t.stop())
        workletNodeRef.current = null
        sourceRef.current = null
        audioCtxRef.current = null
        streamRef.current = null
    }, [])

    // ── connect WebSocket ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!token) return

        const params = new URLSearchParams({
            job_title: jobTitle,
            employer,
            token,
        })
        const ws = new WebSocket(`${WS_BASE}/interview/ws?${params}`)
        wsRef.current = ws
        ws.binaryType = 'arraybuffer'

        ws.onopen = () => {
            setStatus('connecting')
            startMic(ws)
        }

        ws.onmessage = async (event) => {
            const msg = JSON.parse(event.data as string)

            console.log('msg: ', msg)

            switch (msg.type) {
                case 'status':
                    setStatus(msg.state as InterviewStatus)
                    if (msg.state === 'listening') {
                        if (isAiPlayingRef.current) {
                            // AI audio is still playing — defer mic enable to onended + tail.
                            pendingListenRef.current = true
                            console.debug('[AEC] status:listening deferred — AI audio still playing')
                        } else {
                            // Audio already finished (or never started) — enable immediately.
                            canSendAudioRef.current = true
                        }
                    } else {
                        // thinking / speaking / connecting — always close the mic gate
                        canSendAudioRef.current = false
                    }
                    break

                case 'audio':
                    await playAudio(msg.data)
                    break

                case 'transcript':
                    setTranscripts((prev) => [
                        ...prev,
                        { role: msg.role, text: msg.text, id: ++transcriptIdRef.current },
                    ])
                    break

                case 'error':
                    setError(msg.message)
                    setStatus('error')
                    break
            }
        }

        ws.onclose = () => {
            setStatus('ended')
            stopMic()
        }

        ws.onerror = (e) => {
            console.error('WS error', e)
            setError('Connection error')
            setStatus('error')
        }

        return () => {
            ws.close()
            stopMic()
        }
    }, [token, jobTitle, employer, startMic, stopMic, playAudio])

    const muteMic = useCallback(() => {
        isMicMutedRef.current = true
        setIsMicMuted(true)
    }, [])

    const unmuteMic = useCallback(() => {
        isMicMutedRef.current = false
        setIsMicMuted(false)
    }, [])

    const setSpeakerMuted = useCallback((v: boolean) => {
        isSpeakerMutedRef.current = v
        setIsSpeakerMuted(v)
    }, [])

    const endSession = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'end' }))
        }
        wsRef.current?.close()
        stopMic()
        setStatus('ended')
    }, [stopMic])

    return {
        status,
        transcripts,
        endSession,
        error,
        isMicMuted,
        muteMic,
        unmuteMic,
        isSpeakerMuted,
        setSpeakerMuted,
    }
}

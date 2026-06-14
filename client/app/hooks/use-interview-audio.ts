import { useCallback, useRef, useState } from 'react'
import { downsampleBuffer, float32ToInt16Pcm, encodePcmToBase64 } from '~/lib/utils'
import { MicVAD } from '@ricky0123/vad-web'

const SAMPLE_RATE = 16_000 // must match server

interface UseInterviewAudioProps {
    send: (data: string | ArrayBuffer) => void
    wsRef: React.RefObject<WebSocket | null>
    close: () => void
    setStatus: (status: any) => void
}

export function useInterviewAudio({ send, wsRef, close, setStatus }: UseInterviewAudioProps) {
    const audioCtxRef = useRef<AudioContext | null>(null)
    const workletNodeRef = useRef<AudioWorkletNode | null>(null)
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const vadRef = useRef<any>(null)
    const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const [isMicMuted, setIsMicMuted] = useState(false)
    const [isSpeakerMuted, setIsSpeakerMuted] = useState(false)

    const isMicMutedRef = useRef(false)
    const isSpeakerMutedRef = useRef(false)
    const canSendAudioRef = useRef(false)

    const isAiPlayingRef = useRef(false)
    const pendingListenRef = useRef(false)

    const playAudio = useCallback(async (base64Mp3: string) => {
        if (isSpeakerMutedRef.current) return

        isAiPlayingRef.current = true
        canSendAudioRef.current = false
        pendingListenRef.current = false

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

            setTimeout(() => {
                if (pendingListenRef.current) {
                    pendingListenRef.current = false
                    canSendAudioRef.current = true
                    console.debug('[AEC] Tail elapsed — mic re-enabled after AI playback')

                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                        send(JSON.stringify({ type: 'playback_done' }))
                        console.debug('[AEC] Sent playback_done to server')
                    }
                }
            }, 400)
        }
    }, [send, wsRef])

    const startMic = useCallback(async () => {
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

            try {
                const micvad = await MicVAD.new({
                    getStream: async () => stream,
                    onSpeechStart: () => {
                        console.debug('[VAD] Speech started')
                        if (silenceTimeoutRef.current) {
                            clearTimeout(silenceTimeoutRef.current)
                            silenceTimeoutRef.current = null
                        }
                    },
                    onSpeechEnd: () => {
                        console.debug('[VAD] Speech ended, starting 4s timeout...')
                        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current)
                        
                        silenceTimeoutRef.current = setTimeout(() => {
                            console.debug('[VAD] Timeout reached — sending user_done')
                            if (wsRef.current?.readyState === WebSocket.OPEN) {
                                send(JSON.stringify({ type: 'user_done' }))
                            }
                        }, 4000)
                    }
                })
                vadRef.current = micvad
                micvad.start()
            } catch (vadErr) {
                console.warn('Failed to initialize VAD', vadErr)
            }

            const ctx = new AudioContext()
            audioCtxRef.current = ctx

            const source = ctx.createMediaStreamSource(stream)
            sourceRef.current = source

            await ctx.audioWorklet.addModule('/audio-processor.js')
            const workletNode = new AudioWorkletNode(ctx, 'audio-recorder-processor')
            workletNodeRef.current = workletNode

            workletNode.port.onmessage = (e) => {
                if (wsRef.current?.readyState !== WebSocket.OPEN) return
                if (isMicMutedRef.current) return

                // Prevent sending audio if AI is still speaking
                if (!canSendAudioRef.current) return

                const float32Native = e.data
                const float32 = downsampleBuffer(float32Native, ctx.sampleRate, SAMPLE_RATE)
                const int16 = float32ToInt16Pcm(float32)
                const base64Audio = encodePcmToBase64(int16)
                try {
                    const payload = JSON.stringify({ type: 'audio', data: base64Audio })
                    send(payload)
                    console.debug('sent audio chunk bytes=', int16.byteLength, 'ws.readyState=', wsRef.current?.readyState)
                } catch (err) {
                    console.warn('Failed to send audio chunk', err)
                }
            }

            source.connect(workletNode)
            workletNode.connect(ctx.destination)

            if (ctx.state === 'suspended') {
                ctx.resume().catch(() => {})
            }
        } catch (err) {
            console.warn('Mic access denied:', err)
        }
    }, [send, wsRef])

    const stopMic = useCallback(() => {
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current)
        if (vadRef.current) {
            vadRef.current.destroy()
            vadRef.current = null
        }
        workletNodeRef.current?.disconnect()
        sourceRef.current?.disconnect()
        audioCtxRef.current?.close()
        streamRef.current?.getTracks().forEach((t) => t.stop())
        workletNodeRef.current = null
        sourceRef.current = null
        audioCtxRef.current = null
        streamRef.current = null
    }, [])

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
            send(JSON.stringify({ type: 'end' }))
        }
        close()
        stopMic()
        setStatus('ended')
    }, [send, close, stopMic, wsRef, setStatus])

    return {
        playAudio,
        startMic,
        stopMic,
        isMicMuted,
        muteMic,
        unmuteMic,
        isSpeakerMuted,
        setSpeakerMuted,
        isAiPlayingRef,
        pendingListenRef,
        canSendAudioRef,
        endSession,
    }
}

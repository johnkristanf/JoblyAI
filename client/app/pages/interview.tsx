import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import {
    Bot,
    Video,
    VideoOff,
    Volume2,
    VolumeX,
    PhoneOff,
    Briefcase,
    Mic,
    MicOff,
    User,
    Loader2,
    AlertCircle,
    List,
    X,
} from 'lucide-react'

export const meta = () => [
    { title: 'AI Mock Interview – JoblyAI' },
    { name: 'description', content: "Practice your interview with JoblyAI's AI interviewer." },
]

import { useElapsedTimer } from '~/hooks/use-elapsed-timer'
import { useClockTime } from '~/hooks/use-clock-time'
import { useWebSocket } from '~/hooks/use-websocket'
import { useInterviewAudio } from '~/hooks/use-interview-audio'
import { getAccessToken } from '~/lib/supabase/client'
import type { InterviewStatus, Transcript } from '~/types/interview'
import { SpeakingDots } from '~/components/interview/speaking-dots'
import { ControlBtn } from '~/components/interview/control-btn'
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerClose,
} from '~/components/ui/drawer'
import { Button } from '~/components/ui/button'
import { statusLabel } from '~/constants/interview'

// ─── Main page ──────────────────────────────────────────────────────────────────
export default function InterviewPage() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    const jobTitle = searchParams.get('jobTitle') ?? 'Mock Interview'
    const employer = searchParams.get('employer') ?? ''

    const elapsed = useElapsedTimer()
    const clockTime = useClockTime()

    const [token, setToken] = useState<string | null>(null)
    useEffect(() => {
        getAccessToken().then((t) => setToken(t))
    }, [])

    const [status, setStatus] = useState<InterviewStatus>('connecting')
    const [transcripts, setTranscripts] = useState<Transcript[]>([])
    const [error, setError] = useState<string | null>(null)
    const transcriptIdRef = useRef(0)

    const WS_BASE = import.meta.env.VITE_API_V1_BASE_URL ?? 'ws://localhost:8000'
    console.log("WS_BASE: ", WS_BASE);
    const url = token
        ? `${WS_BASE}/interview/ws?${new URLSearchParams({ job_title: jobTitle, employer, token })}`
        : null

    // ── WebSocket / AI session ──────────────────────────────────────────────────
    const { wsRef, send, close } = useWebSocket({
        url,
        onOpen: () => {
            setStatus('connecting')
            startMic()
        },
        onMessage: async (event) => {
            const msg = JSON.parse(event.data as string)
            switch (msg.type) {
                case 'status':
                    setStatus(msg.state as InterviewStatus)
                    if (msg.state === 'listening') {
                        if (isAiPlayingRef.current) {
                            pendingListenRef.current = true
                            console.debug('[AEC] status:listening deferred — AI audio still playing')
                        }
                    } else {
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
        },
        onClose: () => {
            setStatus('ended')
            stopMic()
        },
        onError: (e) => {
            console.error('WS error', e)
            setError('Connection error')
            setStatus('error')
        }
    })

    const {
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
    } = useInterviewAudio({ send, wsRef, close, setStatus })

    const aiSpeaking = status === 'speaking'
    // ── Local camera toggle ─────────────────────────────────────────────────────
    const [cameraOn, setCameraOn] = useState(false)
    const [transcriptDrawerOpen, setTranscriptDrawerOpen] = useState(false)

    const videoRef = useRef<HTMLVideoElement>(null)
    const camStreamRef = useRef<MediaStream | null>(null)

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
            camStreamRef.current = stream
            if (videoRef.current) videoRef.current.srcObject = stream
        } catch {
            setCameraOn(false)
        }
    }, [])

    const stopCamera = useCallback(() => {
        camStreamRef.current?.getTracks().forEach((t) => t.stop())
        camStreamRef.current = null
        if (videoRef.current) videoRef.current.srcObject = null
    }, [])

    useEffect(() => {
        if (cameraOn) startCamera()
        else stopCamera()
    }, [cameraOn, startCamera, stopCamera])

    useEffect(() => () => stopCamera(), [stopCamera])

    // ── Transcript scroll ref ───────────────────────────────────────────────────
    const transcriptEndRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [transcripts])

    const handleEnd = () => {
        stopCamera()
        endSession()
        navigate(-1)
    }



    return (
        <Drawer open={transcriptDrawerOpen} onOpenChange={setTranscriptDrawerOpen}>
            <div className="flex flex-col h-dvh bg-[#202124] overflow-hidden font-sans select-none">

                {/* ── Header ── */}
                <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <Briefcase size={16} className="text-blue-500 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-gray-800 leading-tight truncate max-w-[300px]">
                                {jobTitle}
                            </p>
                            {employer && (
                                <p className="text-xs text-gray-500 truncate max-w-[300px]">{employer}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setTranscriptDrawerOpen(true)}
                            title="Open transcripts"
                            aria-label="Open transcripts"
                        >
                            <List size={16} />
                        </Button>
                        {error && (
                            <span className="flex items-center gap-1 text-xs text-red-500">
                                <AlertCircle size={12} /> {error}
                            </span>
                        )}
                        <span className="text-xs text-gray-500 font-mono tabular-nums px-2.5 py-1 rounded-full bg-gray-100 border border-gray-200">
                            {elapsed}
                        </span>
                    </div>
                </header>

                {/* ── Video area ── */}
                <div className="flex-1 relative flex items-center justify-center p-4 gap-4 overflow-hidden">

                    {/* ── AI tile ── */}
                    <div
                        className="relative w-full max-w-3xl aspect-video rounded-2xl flex flex-col items-center justify-center overflow-hidden transition-all duration-300"
                        style={{
                            background: '#3c4043',
                            outline: aiSpeaking ? '3px solid #3b82f6' : '3px solid transparent',
                            outlineOffset: '2px',
                            transition: 'outline-color 0.3s ease',
                        }}
                    >
                        {/* AI Avatar */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
                                    {status === 'connecting' ? (
                                        <Loader2 size={40} className="text-white animate-spin" strokeWidth={1.5} />
                                    ) : (
                                        <Bot size={48} className="text-white" strokeWidth={1.5} />
                                    )}
                                </div>
                                {/* Listening pulse ring */}
                                {status === 'listening' && (
                                    <span className="absolute inset-0 rounded-full border-2 border-blue-400/50 animate-ping" />
                                )}
                            </div>

                            <div className="text-center">
                                <p className="text-white font-semibold text-base">JoblyAI Interviewer</p>
                                <p className="text-sm mt-1 text-gray-400">
                                    {aiSpeaking ? (
                                        <span className="flex items-center justify-center gap-1.5">
                                            <SpeakingDots />
                                            <span className="text-blue-400">Speaking</span>
                                        </span>
                                    ) : (
                                        <span className="text-gray-500">{statusLabel[status]}</span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Name label bottom-left */}
                        <div className="absolute bottom-3 left-4">
                            <span className="text-xs text-white/80 bg-black/40 px-2 py-0.5 rounded font-medium">
                                AI Interviewer
                            </span>
                        </div>

                        {/* Speaking border bottom bar */}
                        {aiSpeaking && (
                            <div className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-500" />
                        )}
                    </div>

                    {/* ── Self PiP tile (bottom-right) ── */}
                    <div
                        className="absolute bottom-6 right-6 w-44 aspect-video rounded-xl overflow-hidden border-2 shadow-xl"
                        style={{
                            borderColor: cameraOn ? '#3b82f6' : 'rgba(255,255,255,0.15)',
                            background: '#3c4043',
                        }}
                    >
                        {cameraOn ? (
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                className="w-full h-full object-cover scale-x-[-1]"
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                                    <User size={20} className="text-gray-400" />
                                </div>
                                <p className="text-[11px] text-gray-500">Camera off</p>
                            </div>
                        )}

                        {/* Name label */}
                        <div className="absolute bottom-1.5 left-2">
                            <span className="text-[10px] text-white/70 bg-black/40 px-1.5 py-0.5 rounded font-medium">
                                You
                            </span>
                        </div>

                        {/* Muted mic indicator */}
                        {isMicMuted && (
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                                <MicOff size={10} className="text-white" />
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Controls bar — Google Meet dark footer ── */}
                <div className="shrink-0 h-16 bg-[#1e1f20] border-t border-white/5 flex items-center justify-between px-6">

                    {/* Left — current time */}
                    <span className="text-sm font-medium text-white/80 font-mono tabular-nums w-24">
                        {clockTime}
                    </span>

                    {/* Center — controls */}
                    <div className="flex items-center gap-3">

                        {/* Camera */}
                        <ControlBtn
                            active={cameraOn}
                            onToggle={() => setCameraOn((v) => !v)}
                            iconOn={<Video size={20} />}
                            iconOff={<VideoOff size={20} />}
                            label="Camera"
                        />

                        {/* Mic mute — actually mutes audio sent to Deepgram */}
                        <ControlBtn
                            active={!isMicMuted}
                            onToggle={() => isMicMuted ? unmuteMic() : muteMic()}
                            iconOn={<Mic size={20} />}
                            iconOff={<MicOff size={20} />}
                            label="Mic"
                        />

                        {/* Speaker — actually suppresses AI audio playback */}
                        <ControlBtn
                            active={!isSpeakerMuted}
                            onToggle={() => setSpeakerMuted(!isSpeakerMuted)}
                            iconOn={<Volume2 size={20} />}
                            iconOff={<VolumeX size={20} />}
                            label="Speaker"
                        />

                        {/* End Interview */}
                        <button
                            onClick={handleEnd}
                            aria-label="End interview"
                            className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white transition-colors duration-200 active:scale-95 ml-2"
                            title="End Interview"
                        >
                            <PhoneOff size={20} />
                        </button>
                    </div>

                    {/* Right — spacer to keep controls centered */}
                    <div className="w-24" />
                </div>
            </div>

            <DrawerContent data-vaul-drawer-direction="right" className="w-[320px] max-w-[90vw] bg-white text-slate-950 shadow-2xl">
                <DrawerHeader>
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <DrawerTitle>Transcripts</DrawerTitle>
                            <DrawerDescription>Live interview conversation text.</DrawerDescription>
                        </div>
                        <DrawerClose asChild>
                            <Button variant="ghost" size="icon" aria-label="Close transcripts drawer">
                                <X size={18} />
                            </Button>
                        </DrawerClose>
                    </div>
                </DrawerHeader>

                <div className="flex-1 overflow-y-auto space-y-2 px-4 pb-6">
                    {transcripts.length === 0 ? (
                        <p className="text-sm text-slate-600">Waiting for the interview to begin...</p>
                    ) : (
                        transcripts.map((t) => (
                            <div
                                key={t.id}
                                className={`rounded-2xl p-3 text-sm leading-6 ${t.role === 'ai'
                                        ? 'bg-blue-600/10 text-slate-900 border border-blue-200'
                                        : 'bg-slate-100 text-slate-900 border border-slate-200 self-end'
                                    }`}
                            >
                                <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                                    {t.role === 'ai' ? 'Interviewer' : 'You'}
                                </div>
                                <p>{t.text}</p>
                            </div>
                        ))
                    )}
                    <div ref={transcriptEndRef} />
                </div>
            </DrawerContent>
        </Drawer>
    )
}

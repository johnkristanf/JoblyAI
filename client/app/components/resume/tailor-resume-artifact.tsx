import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { X, FileText, Loader2, AlertCircle, ExternalLink, Wand2, Sparkles, Download } from 'lucide-react'
import type { JobMatch } from '~/types/job_search'
import { getResumePresignedUrl } from '~/lib/api/get'
import { tailorResume } from '~/lib/api/post'

const PdfViewer = lazy(() => import('../pdf-viewer'))

interface TailorResumeArtifactProps {
    job: JobMatch
    resumeObjectKey: string
    onClose: () => void
}

export function TailorResumeArtifact({ job, resumeObjectKey, onClose }: TailorResumeArtifactProps) {
    const [visible, setVisible] = useState(false)
    const [isClient, setIsClient] = useState(false)
    const panelRef = useRef<HTMLDivElement>(null)

    const [tailorStatus, setTailorStatus] = useState<'idle' | 'streaming' | 'done' | 'error'>('idle')
    const [streamedText, setStreamedText] = useState('')
    const [tailoredPresignedUrl, setTailoredPresignedUrl] = useState<string | null>(null)
    const [errorMsg, setErrorMsg] = useState('')

    // Animate in on mount and set isClient
    useEffect(() => {
        setIsClient(true)
        requestAnimationFrame(() => setVisible(true))
    }, [])

    const handleClose = () => {
        setVisible(false)
        setTimeout(onClose, 300)
    }

    // Click outside to close
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                handleClose()
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const {
        data: presignedUrl,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['resume-presigned-url', resumeObjectKey],
        queryFn: () => getResumePresignedUrl(resumeObjectKey),
        staleTime: 1000 * 60 * 25, // 25 min — slightly less than the 30-min S3 presign TTL
    })

    const tailorMutation = useMutation({
        mutationFn: async () => {
            setTailorStatus('streaming')
            setStreamedText('')
            setErrorMsg('')
            setTailoredPresignedUrl(null)

            const response = await tailorResume({
                object_key: resumeObjectKey,
                job_title: job.job_title ?? '',
                job_description: job.job_description ?? '',
                employer_name: job.employer_name,
            })

            const reader = response.body?.getReader()
            const decoder = new TextDecoder('utf-8')
            let buffer = ''

            if (!reader) throw new Error('No response stream')

            while (true) {
                const { value, done } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() || ''

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6)
                        if (!dataStr.trim()) continue
                        
                        try {
                            const data = JSON.parse(dataStr)
                            if (data.type === 'token') {
                                setStreamedText(prev => prev + data.content)
                            } else if (data.type === 'done') {
                                setTailoredPresignedUrl(data.presigned_url)
                                setTailorStatus('done')
                            } else if (data.type === 'error') {
                                setErrorMsg(data.message)
                                setTailorStatus('error')
                            }
                        } catch (e) {
                            console.error('Failed to parse SSE data:', dataStr)
                        }
                    }
                }
            }
        },
        onError: (error: any) => {
            setErrorMsg(error.message || 'Failed to tailor resume')
            setTailorStatus('error')
        }
    })

    const handleTailor = () => tailorMutation.mutate()

    const currentPdfUrl = tailoredPresignedUrl || presignedUrl

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300"
                style={{ opacity: visible ? 1 : 0 }}
            />

            {/* Side panel */}
            <div
                ref={panelRef}
                className="fixed top-0 right-0 z-50 h-full w-full max-w-2xl flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-out"
                style={{ transform: visible ? 'translateX(0)' : 'translateX(100%)' }}
            >
                {/* ── Header ── */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-blue-600 text-white">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-blue-200 uppercase tracking-wide">
                                Tailor Resume
                            </p>
                            <h2 className="text-sm font-semibold truncate leading-tight">
                                {job.job_title}
                                {job.employer_name && (
                                    <span className="font-normal text-blue-200"> · {job.employer_name}</span>
                                )}
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {presignedUrl && (
                            <a
                                href={presignedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open in new tab"
                                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                            >
                                <ExternalLink className="w-4 h-4 text-white" />
                            </a>
                        )}
                        <button
                            onClick={handleClose}
                            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                            aria-label="Close panel"
                        >
                            <X className="w-4 h-4 text-white" />
                        </button>
                    </div>
                </div>

                {/* ── Job context badge ── */}
                <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-blue-700 font-medium">
                        Review your resume below and tailor it for this role.
                    </span>
                    {job.job_apply_link && (
                        <a
                            href={job.job_apply_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                        >
                            View Job Posting <ExternalLink className="w-3 h-3" />
                        </a>
                    )}
                </div>

                {/* ── PDF Viewer area ── */}
                <div className="flex-1 overflow-hidden bg-gray-100 relative">
                    {isLoading && tailorStatus === 'idle' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-500">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                            <p className="text-sm font-medium">Loading resume…</p>
                        </div>
                    )}

                    {isError && tailorStatus === 'idle' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-red-500 px-8">
                            <AlertCircle className="w-10 h-10" />
                            <p className="text-sm font-medium text-center">
                                Failed to load your resume. The link may have expired — please try again.
                            </p>
                        </div>
                    )}

                    {tailorStatus === 'streaming' && (
                        <div className="absolute inset-0 flex flex-col bg-white overflow-hidden">
                            <div className="p-4 border-b flex items-center justify-between bg-blue-50">
                                <div className="flex items-center gap-2 text-blue-700 font-medium">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm">Generating your tailored resume…</span>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 font-mono text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {streamedText}
                            </div>
                        </div>
                    )}

                    {tailorStatus === 'error' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-red-500 px-8">
                            <AlertCircle className="w-10 h-10" />
                            <p className="text-sm font-medium text-center">
                                {errorMsg}
                            </p>
                        </div>
                    )}

                    {currentPdfUrl && tailorStatus !== 'streaming' && tailorStatus !== 'error' && isClient && (
                        <Suspense fallback={
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-500">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                <p className="text-sm font-medium">Loading PDF viewer…</p>
                            </div>
                        }>
                            <PdfViewer url={currentPdfUrl} />
                        </Suspense>
                    )}
                </div>

                {/* ── Footer tip ── */}
                <div className="px-5 py-3 border-t border-gray-100 bg-white flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-1">
                        <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                        <p className="text-xs text-gray-500 leading-tight">
                            Compare your resume against the job description above and adjust your skills, experience, and keywords to maximise your match rate.
                        </p>
                    </div>
                    {tailorStatus === 'idle' && (
                        <button
                            onClick={handleTailor}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
                        >
                            Tailor for this role
                        </button>
                    )}
                    {tailorStatus === 'done' && tailoredPresignedUrl && (
                        <a
                            href={tailoredPresignedUrl}
                            download="Tailored_Resume.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
                        >
                            <Download className="w-4 h-4" />
                            Download PDF
                        </a>
                    )}
                </div>
            </div>
        </>
    )
}

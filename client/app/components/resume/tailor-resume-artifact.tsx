import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { X, FileText, Loader2, AlertCircle, ExternalLink, Wand2, Sparkles, Download } from 'lucide-react'
import type { JobMatch } from '~/types/resume_matching'
import { getResumePresignedUrl } from '~/lib/api/get'
import { tailorResume } from '~/lib/api/post'
import { isDocxFile } from '~/lib/utils'

import { parse } from 'partial-json'
import { ResumePreview } from './resume-preview'
import type { TailoredResumeData, TemplateId } from '~/types/resume'
import { ResumeDownloadBtn } from './resume-download-btn'
import { TemplateSelector } from './template-selector'

const PdfViewer = lazy(() => import('../pdf-viewer'))
const DocxViewer = lazy(() => import('../docx-viewer'))

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
    const [partialResumeJson, setPartialResumeJson] = useState<Partial<TailoredResumeData> | null>(null)
    const [resumeJson, setResumeJson] = useState<TailoredResumeData | null>(null)
    const [errorMsg, setErrorMsg] = useState('')
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('modern')

    const previewRef = useRef<HTMLDivElement>(null)

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
            setPartialResumeJson({})
            setResumeJson(null)
            setErrorMsg('')

            const response = await tailorResume({
                object_key: resumeObjectKey,
                job_title: job.job_title ?? '',
                job_description: job.job_description ?? '',
                employer_name: job.employer_name,
            })

            const reader = response.body?.getReader()
            const decoder = new TextDecoder('utf-8')
            let buffer = ''
            let accumulatedJsonStr = ''

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
                                accumulatedJsonStr += data.content
                                console.log("accumulatedJsonStr: ", accumulatedJsonStr);
                                
                                try {
                                    const parsed = parse(accumulatedJsonStr)
                                    // Make sure it doesn't return string if JSON happens to be a string
                                    if (parsed && typeof parsed === 'object') {
                                        setPartialResumeJson(parsed)
                                    }
                                } catch (e) {
                                    // Ignore partial parse errors
                                }
                            } else if (data.type === 'done') {
                                setResumeJson(data.resume_json)
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
                className="fixed top-0 right-0 z-50 h-full w-[90vw] max-w-6xl flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-out"
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

                {/* ── Main Content Area ── */}
                <div className="flex-1 overflow-hidden bg-gray-100 flex flex-row">

                    {/* Sidebar for Template Selection */}
                    {tailorStatus === 'idle' && presignedUrl && (
                        <div className="w-64 bg-white border-r border-gray-200 p-4 shrink-0 overflow-hidden shadow-sm z-10 flex flex-col">
                            <TemplateSelector value={selectedTemplate} onChange={setSelectedTemplate} layout="vertical" />
                        </div>
                    )}

                    {/* Document Viewer Area */}
                    <div className="flex-1 relative overflow-hidden">
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

                        {tailorStatus === 'idle' && presignedUrl && isClient && (() => {
                            return (
                                <Suspense fallback={
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-500">
                                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                        <p className="text-sm font-medium">Loading document…</p>
                                    </div>
                                }>
                                    {isDocxFile(resumeObjectKey)
                                        ? <DocxViewer url={presignedUrl} />
                                        : <PdfViewer url={presignedUrl} />
                                    }
                                </Suspense>
                            )
                        })()}

                        {tailorStatus === 'streaming' && (
                            <div className="absolute inset-0 flex flex-col bg-white overflow-hidden">
                                <div className="p-4 border-b flex items-center justify-between bg-blue-50 z-10 shadow-sm relative">
                                    <div className="flex items-center gap-2 text-blue-700 font-medium">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-sm">Generating your tailored resume…</span>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    <ResumePreview data={partialResumeJson || {}} template={selectedTemplate} />
                                </div>
                            </div>
                        )}

                        {tailorStatus === 'done' && resumeJson && (
                            <div className="absolute inset-0 flex flex-col bg-white overflow-hidden">
                                <div className="flex-1 overflow-y-auto">
                                    <ResumePreview data={resumeJson} ref={previewRef} template={selectedTemplate} />
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
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="px-5 py-3 border-t border-gray-100 bg-white flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-1">
                        <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                        <p className="text-xs text-gray-500 leading-tight">
                            {tailorStatus === 'idle' ? 'Pick a template, then tailor your resume for this role.' : 'Compare your resume against the job description to maximise your match rate.'}
                        </p>
                    </div>
                    {tailorStatus === 'idle' && (
                        <button
                            onClick={handleTailor}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
                        >
                            Tailor for this role
                        </button>
                    )}
                    {tailorStatus === 'done' && resumeJson && (
                        <ResumeDownloadBtn previewRef={previewRef} name={job.job_title || 'Tailored_Resume'} />
                    )}
                </div>
            </div>
        </>
    )
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, FileText, Calendar } from 'lucide-react'
import React, { useRef, useState } from 'react'
import { toast } from 'sonner'
import FullScreenLoader from '~/components/full-screen-loader'
import { ResumeCard } from '~/components/resume-card'
import { UploadNewResumeCard } from '~/components/upload-new-resume-card'
import { getAllResumes } from '~/lib/api/get'
import { uploadResume } from '~/lib/api/post'
import type { ResumeData, ResumeFile } from '~/types/resume'

export default function ResumeCardsPage() {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [previewName, setPreviewName] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const queryClient = useQueryClient()

    const {
        data: resumesData,
        isLoading: resumesLoading,
        error: resumesError,
        refetch: refetchResumes,
    } = useQuery<ResumeData[]>({
        queryKey: ['resumes', 'all'],
        queryFn: getAllResumes,
    })

    const mutation = useMutation({
        mutationFn: uploadResume,
        onSuccess: (response) => {
            toast.success('Resume(s) uploaded successfully!')
            queryClient.invalidateQueries({ queryKey: ['resumes', 'all'] })
        },
        onError: (err: any) => {
            toast.error('Error uploading resume, please try again later')
        },
    })

    const handleFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])

        if (files.length === 0) return

        const mapped: ResumeFile[] = files.map((file, idx) => ({
            id: Date.now() + Math.random() + idx,
            fileName: file.name,
            file,
            previewUrl: '', // No in
        }))

        mutation.mutate(mapped)

        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handlePreview = (url: string, name: string) => {
        setPreviewUrl(url)
        setPreviewName(name)
    }

    const handleClosePreview = () => {
        setPreviewUrl(null)
        setPreviewName(null)
    }

    const triggerFileInput = () => {
        if (fileInputRef.current) fileInputRef.current.click()
    }

    if (resumesLoading) {
        return <FullScreenLoader message="Loading resume(s)..." />
    }

    if (resumesError) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">Error loading resumes</p>
                    <button
                        onClick={() => refetchResumes()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    const resumes = resumesData || []

    return (
        <div className="w-full min-h-screen flex flex-col p-10">
            <div className="mb-10">
                <h1 className="text-2xl font-bold text-gray-900">Resume</h1>
                <h3 className="text-md text-blue-600 font-normal">
                    Upload and manage your resumes below.
                </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {/* Render resume cards */}
                {resumes && resumes.map((resume) => (
                    <ResumeCard key={resume.id} resume={resume} onPreview={handlePreview} />
                ))}

                {/* Upload card - always visible */}
                <UploadNewResumeCard
                    onClick={triggerFileInput}
                    inputRef={fileInputRef}
                    onChange={handleFilesUpload}
                />
            </div>

            {/* Empty state when no resumes */}
            {resumes.length === 0 && !mutation.isPending && (
                <div className="text-center mt-8 text-gray-500">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg mb-2">No resumes yet</p>
                    <p className="text-sm">Upload your first resume to get started</p>
                </div>
            )}

            {/* Loading state during upload */}
            {mutation.isPending && <FullScreenLoader message="Uploading resume(s)..." />}

            {/* Preview Modal */}
            {previewUrl && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    onClick={handleClosePreview}
                >
                    <div
                        className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-800 truncate">
                                {previewName}
                            </h2>
                            <button
                                className="bg-red-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-700 transition-colors"
                                onClick={handleClosePreview}
                            >
                                Close
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-4 bg-gray-50">
                            {previewUrl.toLowerCase().endsWith('.pdf') ? (
                                <iframe
                                    src={previewUrl}
                                    title={previewName ?? 'Resume preview'}
                                    className="w-full h-full min-h-[600px] border-0 rounded-lg bg-white"
                                />
                            ) : (
                                <iframe
                                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewUrl)}&embedded=true`}
                                    title={previewName ?? 'Resume preview'}
                                    className="w-full h-full min-h-[600px] border-0 rounded-lg bg-white"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

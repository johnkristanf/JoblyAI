import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, FileText, Calendar } from 'lucide-react'
import React, { useRef, useState } from 'react'
import { toast } from 'sonner'
import FullScreenLoader from '~/components/full-screen-loader'
import { ResumeCard } from '~/components/resume/resume-card'
import { UploadNewResumeCard } from '~/components/resume/upload-new-resume-card'
import { getAllResumes } from '~/lib/api/get'
import { uploadResume } from '~/lib/api/post'
import type { ResumeData, ResumeFile } from '~/types/resume'
import { PageHeader } from '~/components/ui/page-header'

export default function ResumeCardsPage() {
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

        // Only accept PDFs: validate before proceeding
        const invalidFiles = files.filter(
            (file) => file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf'),
        )
        if (invalidFiles.length > 0) {
            toast.error('Only PDF files are allowed.')
            if (fileInputRef.current) fileInputRef.current.value = ''
            return
        }

        const mapped: ResumeFile[] = files.map((file, idx) => ({
            id: Date.now() + Math.random() + idx,
            fileName: file.name,
            file,
            previewUrl: '', // No in
        }))

        mutation.mutate(mapped)

        if (fileInputRef.current) fileInputRef.current.value = ''
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
            <PageHeader
                title="Resume"
                subtitle="Upload and manage your resumes below."
                className="mb-10 shrink-0"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                {/* Render resume cards */}
                {resumes &&
                    resumes.map((resume) => (
                        <ResumeCard key={resume.id} resume={resume} />
                    ))}

                {/* Upload card - always visible */}
                <UploadNewResumeCard
                    onClick={triggerFileInput}
                    inputRef={fileInputRef}
                    onChange={handleFilesUpload}
                />
            </div>

            {/* Empty state when no resumes */}
            {/* {resumes.length === 0 && !mutation.isPending && (
                <div className="text-center mt-8 text-gray-500">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg mb-2">No resumes yet</p>
                    <p className="text-sm">Upload your first resume to get started</p>
                </div>
            )} */}

            {/* Loading state during upload */}
            {mutation.isPending && <FullScreenLoader message="Uploading resume(s)..." />}
        </div>
    )
}

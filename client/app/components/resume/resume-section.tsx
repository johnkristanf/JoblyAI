import { Upload, FileText, Check } from 'lucide-react'
import type { ResumeData, SelectedResume } from '~/types/resume'
import { formatDate } from '~/lib/utils'
import { ResumeViewerDrawer } from './resume-viewer-drawer'

interface ResumeSectionProps {
    isPending: boolean
    selectedResumeMode: 'upload' | 'select'
    setSelectedResumeMode: (mode: 'upload' | 'select') => void
    triggerFileInput: () => void
    handleDrop: (e: React.DragEvent<HTMLDivElement>) => void
    fileInputRef: React.RefObject<HTMLInputElement | null>
    register: any
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    resumeName: string | null
    resumesLoading: boolean
    resumesError: any
    resumesData: ResumeData[] | undefined
    selectedExistingResume: SelectedResume | null
    handleExistingResumeSelect: (resumeId: string, objectKey: string) => void
}

export function ResumeSection({
    isPending,
    selectedResumeMode,
    setSelectedResumeMode,
    triggerFileInput,
    handleDrop,
    fileInputRef,
    register,
    handleFileChange,
    resumeName,
    resumesLoading,
    resumesError,
    resumesData,
    selectedExistingResume,
    handleExistingResumeSelect
}: ResumeSectionProps) {
    return (
        <div className="flex flex-col">
            <label className="mb-1 text-gray-700 font-medium">Resume</label>
            <p className="text-blue-600 text-xs mb-4">
                Must include relevant professional summary, skills, and experience.
                Our AI will analyze your background to find and match you with the
                best job opportunities.
            </p>

            {/* Toggle Buttons */}
            <div className="flex gap-2 mb-4">
                <button
                    type="button"
                    onClick={() => setSelectedResumeMode('upload')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${selectedResumeMode === 'upload'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    disabled={isPending}
                >
                    <Upload className="inline-block w-4 h-4 mr-2" />
                    Upload New Resume
                </button>
                <button
                    type="button"
                    onClick={() => setSelectedResumeMode('select')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${selectedResumeMode === 'select'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    disabled={isPending}
                >
                    <FileText className="inline-block w-4 h-4 mr-2" />
                    Select Existing Resume
                </button>
            </div>

            {/* Upload Mode */}
            {selectedResumeMode === 'upload' && (
                <div
                    className={`relative flex flex-col items-center justify-center border-2 border-dashed border-blue-400 rounded-lg bg-white px-6 py-8 transition ${isPending ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-blue-50 cursor-pointer'}`}
                    onClick={
                        isPending ? undefined : triggerFileInput
                    }
                    onDragOver={
                        isPending
                            ? undefined
                            : (e) => e.preventDefault()
                    }
                    onDrop={isPending ? undefined : handleDrop}
                    style={
                        isPending
                            ? { pointerEvents: 'none', opacity: 0.7 }
                            : {}
                    }
                >
                    <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        id="resume-upload"
                        className="hidden"
                        // @ts-ignore
                        {...register('resume' as any)}
                        ref={fileInputRef}
                        onClick={
                            isPending
                                ? (e) => e.preventDefault()
                                : (e) => e.stopPropagation()
                        }
                        onChange={
                            isPending
                                ? undefined
                                : handleFileChange
                        }
                        disabled={isPending}
                    />
                    <div className="flex flex-col items-center pointer-events-none select-none">
                        <svg
                            className="w-12 h-12 text-blue-400 mb-3"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12"
                            />
                        </svg>
                        <span className="text-blue-600 font-semibold text-lg">
                            Click to Upload or Drag &amp; Drop
                        </span>
                        <span className="text-gray-500 text-sm mt-1">
                            PDF, DOC, or DOCX (Max 5MB)
                        </span>
                    </div>
                    {resumeName && (
                        <div className="mt-4 flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-md max-w-full">
                            <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                            <span className="text-gray-700 text-sm font-medium truncate">
                                {resumeName}
                            </span>
                            <Check className="w-5 h-5 text-green-600 shrink-0" />
                        </div>
                    )}
                </div>
            )}

            {/* Select Mode */}
            {selectedResumeMode === 'select' && (
                <div
                    className={`border border-gray-300 rounded-lg bg-gray-50 p-4 ${isPending ? 'opacity-70 pointer-events-none' : ''}`}
                >
                    {resumesLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="flex flex-col items-center gap-2">
                                <svg
                                    className="animate-spin h-8 w-8 text-blue-500"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                    ></path>
                                </svg>
                                <span className="text-sm text-gray-500">
                                    Loading resumes...
                                </span>
                            </div>
                        </div>
                    ) : resumesError ? (
                        <div className="text-center py-8 text-red-500">
                            Failed to load resumes. Please try again.
                        </div>
                    ) : resumesData && resumesData.length > 0 ? (
                        <div className="flex flex-col min-h-0">
                            <p className="text-sm text-gray-600 mb-3 shrink-0">
                                Select from your previously uploaded resumes:
                            </p>
                            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                                {resumesData.map((resume) => {
                                    const isSelected = selectedExistingResume?.resume_id === resume.id;
                                    return (
                                        <div
                                            key={resume.id}
                                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border transition-all ${isSelected
                                                ? 'bg-blue-50/50 border-blue-400 ring-1 ring-blue-400'
                                                : 'bg-white border-gray-200'
                                                } ${isPending ? 'pointer-events-none opacity-70' : ''}`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0 pr-3 mb-3 sm:mb-0">
                                                <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className={`text-sm font-medium truncate ${isSelected ? 'text-blue-900' : 'text-gray-800'}`} title={resume.name}>
                                                        {resume.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        Uploaded:{' '}
                                                        {resume.upload_date
                                                            ? formatDate(resume.upload_date)
                                                            : 'Unknown'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                                <ResumeViewerDrawer
                                                    objectKey={resume.objectKey}
                                                    resumeName={resume.name}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleExistingResumeSelect(resume.id, resume.objectKey)}
                                                    disabled={isPending}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${isSelected
                                                        ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                                                        : 'bg-white border border-gray-200 text-gray-700 hover:cursor-pointer hover:bg-gray-50 hover:text-blue-600 hover:border-blue-300'
                                                        }`}
                                                >
                                                    {isSelected && <Check className="w-3.5 h-3.5" />}
                                                    {isSelected ? 'Selected' : 'Select'}
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">
                                No existing resumes found. Upload a new one to get
                                started.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

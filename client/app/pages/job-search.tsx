import { useForm, type SubmitHandler } from 'react-hook-form'
import type { JobSearchResponse, JobSearchForm } from '~/types/job_search'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { ArrowRight, Upload, FileText, Check } from 'lucide-react'
import { JobMatchedCard } from '~/components/job-matched-card'
import NoJobsFound from '~/components/ui/no-jobs-found'
import { jobSearch } from '~/lib/api/post'
import { toast } from 'sonner'
import FullScreenLoader from '~/components/full-screen-loader'
import { getAllResumes } from '~/lib/api/get'
import type { ResumeData } from '~/types/resume'

const JobSearchPage = () => {
    const [jobSearchResponse, setJobSearchResponse] = useState<JobSearchResponse>()
    const [resumeName, setResumeName] = useState<string | null>(null)
    const [selectedResumeMode, setSelectedResumeMode] = useState<'upload' | 'select'>('upload')
    const [selectedExistingResume, setSelectedExistingResume] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Mock data - replace with actual API call to fetch user's uploaded resumes
    const existingResumes = [
        { id: '1', name: 'Software_Engineer_Resume_2024.pdf', uploadDate: '2024-12-01' },
        { id: '2', name: 'Full_Stack_Developer_CV.docx', uploadDate: '2024-11-15' },
        { id: '3', name: 'Senior_Developer_Resume.pdf', uploadDate: '2024-10-20' },
    ]

    const {
        data: resumesData,
        isLoading: resumesLoading,
        error: resumesError,
    } = useQuery<ResumeData[]>({
        queryKey: ['resumes', 'all'],
        queryFn: getAllResumes,
    })

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<JobSearchForm>()

    const mutation = useMutation({
        mutationFn: jobSearch,
        onSuccess: (response: JobSearchResponse) => {
            const undefinedValueCatcher = {
                job_listings: [],
                jobs_matched: [],
            }

            setJobSearchResponse(response ?? undefinedValueCatcher)
        },
        onError: (err: any) => {
            toast.error('Error in searching job, please try again later')
        },
    })

    const handleSearchAnother = () => setJobSearchResponse(undefined)

    const onSubmit: SubmitHandler<JobSearchForm> = (data) => {
        const formData = new FormData()

        // Append all primitive fields (except file input)
        Object.entries(data).forEach(([key, value]) => {
            if (key !== 'resume' && value !== undefined && value !== null) {
                formData.append(key, value as string)
            }
        })

        // Handle resume based on selected mode
        if (selectedResumeMode === 'upload') {
            // Validate file input to only accept pdf and docs
            if (
                fileInputRef.current &&
                fileInputRef.current.files &&
                fileInputRef.current.files.length > 0
            ) {
                const file = fileInputRef.current.files[0]
                const allowedTypes = [
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                ]
                const allowedExtensions = ['pdf', 'doc', 'docx']
                const fileTypeValid = allowedTypes.includes(file.type)
                const ext = file.name.split('.').pop()?.toLowerCase()
                const extValid = ext ? allowedExtensions.includes(ext) : false

                if (!fileTypeValid && !extValid) {
                    toast.error('Invalid file type. Only PDF and DOC/DOCX files are allowed.')
                    return
                }

                formData.append('resume', file)
            }
        } else if (selectedResumeMode === 'select' && selectedExistingResume) {
            // Append the selected existing resume ID
            formData.append('existing_resume_id', selectedExistingResume)
        }

        mutation.mutate(formData)
    }

    // Handler for file drop and click
    const triggerFileInput = () => {
        if (fileInputRef.current) fileInputRef.current.click()
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            setResumeName(e.target.files[0].name)
            setSelectedExistingResume(null) // Clear existing resume selection
        } else {
            setResumeName(null)
        }
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        const files = e.dataTransfer.files
        if (fileInputRef.current && files.length) {
            const dt = new DataTransfer()
            Array.from(files).forEach((file) => dt.items.add(file))
            fileInputRef.current.files = dt.files

            const event = new Event('change', { bubbles: true })
            fileInputRef.current.dispatchEvent(event)

            setResumeName(files[0].name)
            setSelectedExistingResume(null) // Clear existing resume selection
        }
    }

    const handleExistingResumeSelect = (resumeId: string) => {
        setSelectedExistingResume(resumeId)
        setResumeName(null) // Clear uploaded file
        if (fileInputRef.current) {
            fileInputRef.current.value = '' // Clear file input
        }
    }

    // Add fullscreen loader when mutation is in progress
    if (mutation.isPending) {
        return <FullScreenLoader message="Searching might take a few minutes" />
    }

    return (
        <div className="w-full min-h-screen flex flex-col p-10">
            {/* DYNAMIC PAGE TITLE */}
            {jobSearchResponse &&
            ((jobSearchResponse.jobs_matched && jobSearchResponse.jobs_matched.length > 0) ||
                (jobSearchResponse.job_listings && jobSearchResponse.job_listings.length > 0)) ? (
                <>
                    <h1 className="text-2xl font-bold text-gray-900">Job Results</h1>
                    <h3 className="text-md text-blue-600 font-normal">
                        Review the jobs matching your search criteria
                    </h3>
                </>
            ) : (
                <>
                    <h1 className="text-2xl font-bold text-gray-900">Search for Jobs</h1>
                    <h3 className="text-md text-blue-600 font-normal">
                        Specify the job specification you're searching for
                    </h3>
                </>
            )}

            {/* NO JOB LISTING RETRIEVED */}
            {jobSearchResponse && jobSearchResponse.job_listings.length == 0 && (
                <NoJobsFound searchAnotherHandler={handleSearchAnother} />
            )}

            {jobSearchResponse &&
            ((jobSearchResponse.jobs_matched && jobSearchResponse.jobs_matched.length > 0) ||
                (jobSearchResponse.job_listings && jobSearchResponse.job_listings.length > 0)) ? (
                <div className="space-y-10 mt-6">
                    {/* SEARCH ANOTHER */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleSearchAnother}
                            className="text-gray-500 hover:opacity-75 hover:cursor-pointer flex items-center gap-1"
                        >
                            Search another
                            <ArrowRight className="size-5" />
                        </button>
                    </div>

                    {/* Matched Jobs */}
                    {jobSearchResponse.jobs_matched && (
                        <JobMatchedCard jobSearchResponse={jobSearchResponse} />
                    )}
                </div>
            ) : (
                // JOB SEARCH FORM
                !jobSearchResponse && (
                    <form
                        className="mb-8 bg-white rounded-lg shadow p-6 space-y-6"
                        onSubmit={handleSubmit(onSubmit)}
                    >
                        <div className="grid grid-cols-1 gap-6">
                            {/* Job Title */}
                            <div className="flex flex-col">
                                <label className="mb-1 text-gray-700 font-medium">Job Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Software Engineer"
                                    className="rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    {...register('job_title')}
                                />
                            </div>

                            {/* Date Posted */}
                            <div className="flex flex-col">
                                <label className="mb-1 text-gray-700 font-medium">
                                    Date Posted
                                </label>
                                <select
                                    className="rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    defaultValue=""
                                    {...register('date_posted')}
                                >
                                    <option value="" disabled>
                                        Select date posted
                                    </option>
                                    <option value="all">Anytime</option>
                                    <option value="today">Last 24 hours</option>
                                    <option value="3days">Last 3 days</option>
                                    <option value="week">A week ago</option>
                                    <option value="month">A month ago</option>
                                </select>
                            </div>

                            {/* Country */}
                            <div className="flex flex-col">
                                <label className="mb-1 text-gray-700 font-medium">Country</label>
                                <select
                                    className="rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    defaultValue=""
                                    {...register('country')}
                                >
                                    <option value="" disabled>
                                        Select country
                                    </option>
                                    <option value="us">United States</option>
                                    <option value="gb">United Kingdom</option>
                                    <option value="ca">Canada</option>
                                    <option value="de">Germany</option>
                                    <option value="ph">Philippines</option>
                                    <option value="sg">Singapore</option>
                                    <option value="au">Australia</option>
                                </select>
                            </div>
                        </div>

                        {/* ENHANCED RESUME SECTION */}
                        <div className="flex flex-col">
                            <label className="mb-1 text-gray-700 font-medium">Resume</label>
                            <p className="text-blue-600 text-xs mb-4">
                                Resume includes relevant professional summary, skills, and
                                experience. Our AI will analyze your background to find and match
                                you with the best job opportunities.
                            </p>

                            {/* Toggle Buttons */}
                            <div className="flex gap-2 mb-4">
                                <button
                                    type="button"
                                    onClick={() => setSelectedResumeMode('upload')}
                                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                                        selectedResumeMode === 'upload'
                                            ? 'bg-indigo-600 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    <Upload className="inline-block w-4 h-4 mr-2" />
                                    Upload New Resume
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedResumeMode('select')}
                                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                                        selectedResumeMode === 'select'
                                            ? 'bg-indigo-600 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    <FileText className="inline-block w-4 h-4 mr-2" />
                                    Select Existing Resume
                                </button>
                            </div>

                            {/* Upload Mode */}
                            {selectedResumeMode === 'upload' && (
                                <div
                                    className="relative flex flex-col items-center justify-center border-2 border-dashed border-indigo-400 rounded-lg bg-white px-6 py-8 transition hover:bg-indigo-50 cursor-pointer"
                                    onClick={triggerFileInput}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={handleDrop}
                                >
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        id="resume-upload"
                                        className="hidden"
                                        // @ts-ignore
                                        {...register('resume' as any)}
                                        ref={fileInputRef}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={handleFileChange}
                                    />
                                    <div className="flex flex-col items-center pointer-events-none select-none">
                                        <svg
                                            className="w-12 h-12 text-indigo-400 mb-3"
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
                                        <div className="mt-4 flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-md">
                                            <FileText className="w-5 h-5 text-indigo-600" />
                                            <span className="text-gray-700 text-sm font-medium truncate max-w-xs">
                                                {resumeName}
                                            </span>
                                            <Check className="w-5 h-5 text-green-600" />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Select Mode */}
                            {selectedResumeMode === 'select' && (
                                <div className="border border-gray-300 rounded-lg bg-gray-50 p-4">
                                    {resumesData && resumesData.length > 0 ? (
                                        <div className="space-y-2">
                                            <p className="text-sm text-gray-600 mb-3">
                                                Select from your previously uploaded resumes:
                                            </p>
                                            {resumesData.map((resume) => (
                                                <div
                                                    key={resume.id}
                                                    onClick={() =>
                                                        handleExistingResumeSelect(resume.id)
                                                    }
                                                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                                                        selectedExistingResume === resume.id
                                                            ? 'bg-indigo-100 border-2 border-indigo-500'
                                                            : 'bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-sm'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <FileText
                                                            className={`w-5 h-5 ${
                                                                selectedExistingResume === resume.id
                                                                    ? 'text-indigo-600'
                                                                    : 'text-gray-400'
                                                            }`}
                                                        />
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-800">
                                                                {resume.name}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                Uploaded: {resume.uploadDate}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {selectedExistingResume === resume.id && (
                                                        <Check className="w-5 h-5 text-indigo-600" />
                                                    )}
                                                </div>
                                            ))}
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

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="bg-blue-600 hover:cursor-pointer hover:opacity-75 text-white rounded px-6 py-2 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            >
                                Search Jobs
                            </button>
                        </div>
                    </form>
                )
            )}
        </div>
    )
}

export default JobSearchPage

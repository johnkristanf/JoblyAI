import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { JobMatch } from '~/types/resume_matching'
import type { InterviewType } from '~/types/interview'
import { createInterview } from '~/lib/api/post'
import { SaveJobBtn } from './ui/save-job-btn'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { JobLocationTooltip } from './job-location-tooltip'
import { Wand2, BrainCircuit, Loader2, Code2, Users, Briefcase } from 'lucide-react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { INTERVIEW_TYPES } from '~/constants/interview'

export function JobPublisherAndApply({
    job,
    resumeObjectKey,
    onTailorResume
}: {
    job: JobMatch
    resumeObjectKey?: string | null
    onTailorResume?: () => void
}) {
    return (
        <>
            <div
                className={`flex items-center mt-3 ${job.job_publisher ? 'justify-between' : 'justify-end'}`}
            >
                {job.job_publisher && (
                    <div className="w-[15%] text-center bg-blue-200 border-2 border-blue-500 text-sm text-blue-900 mb-2 px-2 py-0.5 rounded z-10">
                        {job.job_publisher}
                    </div>
                )}

                {/* ACTIONS */}
                <div className="flex items-center justify-end gap-3">
                    {/* AI Mock Interview Button */}
                    <MockInterviewBtn job={job} resumeObjectKey={resumeObjectKey} />

                    {/* Tailor Resume Button */}
                    {resumeObjectKey && onTailorResume && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={onTailorResume}
                                    className="text-indigo-500 hover:cursor-pointer hover:opacity-75"
                                    aria-label="Tailor resume for this job"
                                >
                                    <Wand2 className="size-5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                <p>Tailor resume to this job</p>
                            </TooltipContent>
                        </Tooltip>
                    )}

                    {/* Location Tooltip */}
                    {job.job_latitude && job.job_longitude && (
                        <JobLocationTooltip
                            job_latitude={job.job_latitude}
                            job_longitude={job.job_longitude}
                            job_title={job.job_title}
                            employer_name={job.employer_name}
                        />
                    )}

                    {/* Save Job (Bookmark) */}
                    <SaveJobBtn job={job} />

                    {/* MANUAL APPLY */}
                    <a
                        href={job.job_apply_link ?? '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-disabled={!job.job_apply_link}
                        className={`inline-flex items-center gap-1.5 text-white text-sm rounded px-4 py-2 font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${!job.job_apply_link
                            ? 'bg-gray-400 cursor-not-allowed opacity-70'
                            : 'bg-blue-600 hover:cursor-pointer hover:opacity-75'
                            }`}
                    >
                        Apply
                    </a>
                </div>
            </div>

        </>
    )
}

// ─── Mock Interview icon button ──────────────────────────────────────────────

function MockInterviewBtn({ job, resumeObjectKey }: { job: JobMatch, resumeObjectKey?: string | null }) {
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const [selectedType, setSelectedType] = useState<InterviewType | null>(null)

    const { mutate: startInterview, isPending } = useMutation({
        mutationFn: createInterview,
        onSuccess: (res) => {
            setOpen(false)
            const params = new URLSearchParams()
            if (job.job_title) params.set('jobTitle', job.job_title)
            if (job.employer_name) params.set('employer', job.employer_name)
            if (selectedType) params.set('interviewType', selectedType)
            params.set('interviewId', res.interview_id)
            navigate(`/job/mock/interview?${params.toString()}`)
        },
        onError: () => {
            toast.error('Failed to start the interview session. Please try again.')
        },
    })

    const handleStart = () => {
        if (!selectedType) return
        startInterview({
            type: selectedType,
            job_title: job.job_title,
            employer: job.employer_name,
            resume_object_key: resumeObjectKey ?? null,
        })
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                        <button
                            className="text-violet-500 hover:cursor-pointer hover:opacity-75 transition-opacity"
                            aria-label="Start AI mock interview for this job"
                        >
                            <BrainCircuit className="size-5" />
                        </button>
                    </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="top">
                    <p>AI Mock Interview</p>
                </TooltipContent>
            </Tooltip>

            <PopoverContent className="w-64 p-4 bg-white border border-gray-200 rounded-xl shadow-lg" align="end">
                <p className="text-sm font-semibold mb-3 text-gray-800">Choose Interview Type</p>
                <div className="flex flex-col gap-2 mb-4">
                    {INTERVIEW_TYPES.map((type) => {
                        const Icon = type.icon
                        const isSelected = selectedType === type.id
                        return (
                            <button
                                key={type.id}
                                onClick={() => setSelectedType(type.id)}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all border ${isSelected
                                        ? 'bg-blue-50 border-blue-500 text-blue-600 font-medium'
                                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                                    }`}
                            >
                                <Icon size={15} />
                                {type.title}
                            </button>
                        )
                    })}
                </div>
                <button
                    onClick={handleStart}
                    disabled={!selectedType || isPending}
                    className="w-full px-4 py-2 rounded-lg font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                    {isPending ? (
                        <>
                            <Loader2 size={15} className="animate-spin" />
                            Starting...
                        </>
                    ) : (
                        'Start Interview'
                    )}
                </button>
            </PopoverContent>
        </Popover>
    )
}

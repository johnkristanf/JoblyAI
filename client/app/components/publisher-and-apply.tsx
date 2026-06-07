import type { JobMatch } from '~/types/resume_matching'
import { SaveJobBtn } from './ui/save-job-btn'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import { JobLocationTooltip } from './job-location-tooltip'
import { Wand2, BrainCircuit } from 'lucide-react'
import { useNavigate } from 'react-router'

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
                    <MockInterviewBtn job={job} />

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
function MockInterviewBtn({ job }: { job: JobMatch }) {
    const navigate = useNavigate()

    const handleClick = () => {
        const params = new URLSearchParams()
        if (job.job_title)    params.set('jobTitle', job.job_title)
        if (job.employer_name) params.set('employer', job.employer_name)
        navigate(`/job/mock/interview?${params.toString()}`)
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    onClick={handleClick}
                    className="text-violet-500 hover:cursor-pointer hover:opacity-75 transition-opacity"
                    aria-label="Start AI mock interview for this job"
                >
                    <BrainCircuit className="size-5" />
                </button>
            </TooltipTrigger>
            <TooltipContent side="top">
                <p>AI Mock Interview</p>
            </TooltipContent>
        </Tooltip>
    )
}

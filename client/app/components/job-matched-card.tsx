import { useState } from 'react'
import type { JobMatch, JobSearchResponse } from '~/types/job_search'
import { SalarySection } from './salary-section'
import { DescriptionSection } from './description-section'
import { JobPublisherAndApply } from './publisher-and-apply'
import { OtherJobListingsDialog } from './other-job-listings-dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import { JobLocationTooltip } from './job-location-tooltip'
import { EmployerInsightsBtn } from './employer-insights-btn'
import { TailorResumeArtifact } from './resume/tailor-resume-artifact'
import { Wand2 } from 'lucide-react'

interface JobMatchedCardProps {
    jobSearchResponse: JobSearchResponse
    resumeObjectKey?: string | null
}

export function JobMatchedCard({ jobSearchResponse, resumeObjectKey }: JobMatchedCardProps) {
    const [tailorTarget, setTailorTarget] = useState<JobMatch | null>(null)
    console.log("resumeObjectKey: ", resumeObjectKey);

    const sortedJobsByMatchScore = [...jobSearchResponse.jobs_matched].sort(
        (a, b) => (b.match_score || 0) - (a.match_score || 0)
    )

    return (
        <>
            <div>
                <div className="flex justify-between mb-3">
                    <h2 className="text-2xl font-semibold text-green-600 mb-2">Matched Job Postings ({sortedJobsByMatchScore.length})</h2>

                    <OtherJobListingsDialog jobSearchResponse={jobSearchResponse} />
                </div>
                {jobSearchResponse.jobs_matched.length > 0 ? (
                    <div className="max-h-[500px] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                        {sortedJobsByMatchScore.map((job, idx) => (
                            <div
                                key={idx}
                                className="bg-white rounded-lg shadow p-5 flex flex-col gap-4 relative"
                            >
                                <div className="flex justify-end items-center gap-2">
                                    

                                    {/* Tailor Resume button — only visible when an objectKey is available */}
                                    {resumeObjectKey && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    id={`tailor-resume-btn-${idx}`}
                                                    onClick={() => setTailorTarget(job)}
                                                    className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                                                    aria-label="Tailor resume for this job"
                                                >
                                                    <Wand2 className="w-4 h-4" />
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                                <p>Tailor resume for this job</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    )}

                                    {job.job_latitude && job.job_longitude && (
                                        <JobLocationTooltip
                                            job_latitude={job.job_latitude}
                                            job_longitude={job.job_longitude}
                                        />
                                    )}


                                </div>

                                {/* COMPANY INFORMATION SECTION */}
                                <div className="flex items-center mb-2">
                                    {job.employer_logo ? (
                                        <img
                                            src={job.employer_logo}
                                            alt={job.employer_name ?? 'Company Logo'}
                                            className="h-10 w-10 object-contain rounded mr-3 border"
                                        />
                                    ) : (
                                        <div className="h-10 w-10 mr-3 rounded bg-gray-200 flex items-center justify-center text-center text-gray-400">
                                            <span className="material-icons">business logo</span>
                                        </div>
                                    )}
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="font-bold text-indigo-700 text-lg">
                                                {job.job_title}
                                            </div>
                                            {job.match_score !== undefined && (
                                                <span className="bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded text-xs whitespace-nowrap">
                                                    Match: {job.match_score}/100
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-gray-700 text-sm">{job.employer_name}</div>
                                        {job.employer_website && (
                                            <div className="flex items-center">
                                                <a
                                                    href={job.employer_website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-500 underline text-xs"
                                                >
                                                    {job.employer_website}
                                                </a>
                                                <EmployerInsightsBtn
                                                    employerName={job.employer_name}
                                                    employerWebsite={job.employer_website}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Description Section — shows AI match reasoning */}
                                <DescriptionSection
                                    description={job.match_reasoning}
                                    label="Why This Matches You:"
                                />

                                {/* Salary Section */}
                                <SalarySection
                                    jobCountry={job.job_country}
                                    minSalary={job.job_min_salary}
                                    maxSalary={job.job_max_salary}
                                    salaryPeriod={job.job_salary_period}
                                />

                                {/* JOB INFORMATION CARDS */}
                                <div className="mb-2 flex flex-wrap gap-3">
                                    {job.job_employment_type && (
                                        <span className="inline-block bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs">
                                            {job.job_employment_type}
                                        </span>
                                    )}

                                    {job.job_is_remote !== null && (
                                        <span
                                            className={`inline-block px-2 py-0.5 rounded text-xs ${job.job_is_remote
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                                }`}
                                        >
                                            {job.job_is_remote ? 'Remote' : 'On-site'}
                                        </span>
                                    )}

                                    <span className="inline-block bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs">
                                        {job.job_posted_at}
                                    </span>
                                </div>

                                <JobPublisherAndApply job={job} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-6">
                        <p className="text-blue-800 font-medium">
                            No matched jobs were found for your search criteria.
                        </p>

                        <p className="text-blue-700 text-sm mt-2">
                            However, you can still explore other available job postings that may
                            interest you.
                        </p>
                    </div>
                )}
            </div>

            {/* Tailor Resume Side Artifact — rendered at the end to stack above everything */}
            {tailorTarget && resumeObjectKey && (
                <TailorResumeArtifact
                    job={tailorTarget}
                    resumeObjectKey={resumeObjectKey}
                    onClose={() => setTailorTarget(null)}
                />
            )}
        </>
    )
}

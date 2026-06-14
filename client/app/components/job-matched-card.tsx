import { useState } from 'react'
import type { JobMatch, ResumeMatchingResponse } from '~/types/resume_matching'
import { SalarySection } from './salary-section'
import { DescriptionSection } from './description-section'
import { JobPublisherAndApply } from './publisher-and-apply'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import { EmployerInsightsBtn } from './employer-insights-btn'
import { TailorResumeArtifact } from './resume/tailor-resume-artifact'
import { MatchScoreRing } from './match-score-ring'
import { INSIGHT_SECTIONS } from '~/constants/job-matching'

interface JobMatchedCardProps {
    resumeMatchingResponse: ResumeMatchingResponse
    resumeObjectKey?: string | null
}

export function JobMatchedCard({ resumeMatchingResponse, resumeObjectKey }: JobMatchedCardProps) {
    const [tailorTarget, setTailorTarget] = useState<JobMatch | null>(null)

    const sortedJobsByMatchScore = [...resumeMatchingResponse.jobs_matched].sort(
        (a, b) => (b.overall_score || 0) - (a.overall_score || 0)
    )

    return (
        <>
            <div>
                <div className="flex justify-between mb-3">
                    <h2 className="text-2xl font-semibold text-green-600 mb-2">
                        Matched Jobs ({sortedJobsByMatchScore.length})
                    </h2>
                </div>

                {resumeMatchingResponse.jobs_matched.length > 0 ? (
                    <div className="max-h-[600px] overflow-y-auto flex flex-col gap-4 pr-1">
                        {sortedJobsByMatchScore.map((job, idx) => (
                            <div
                                key={idx}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4"
                            >
                                {/* TOP ROW: Logo + Info + Match Score Ring */}
                                <div className="flex items-start gap-4">
                                    {/* Logo */}
                                    <div className="shrink-0">
                                        {job.employer_logo ? (
                                            <img
                                                src={job.employer_logo}
                                                alt={job.employer_name ?? 'Company Logo'}
                                                className="h-12 w-12 object-contain rounded-lg border border-gray-200"
                                            />
                                        ) : (
                                            <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs text-center leading-tight border border-gray-200">
                                                No Logo
                                            </div>
                                        )}
                                    </div>

                                    {/* Title + Company + Website */}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-indigo-700 text-base leading-snug">
                                            {job.job_title}
                                        </div>
                                        <div className="text-gray-600 text-sm mt-0.5">{job.employer_name}</div>
                                        {job.employer_website && (
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <a
                                                    href={job.employer_website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-500 underline text-xs truncate max-w-[200px]"
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

                                    {/* Score Rings: Skills / Experience / Overall */}
                                    <div className="flex items-center gap-3 shrink-0">
                                        {job.skills_score !== undefined && (
                                            <MatchScoreRing score={job.skills_score} label="Skills" labelClassName="text-blue-500" />
                                        )}
                                        {job.experience_score !== undefined && (
                                            <MatchScoreRing score={job.experience_score} label="Experience" labelClassName="text-amber-500" />
                                        )}
                                        {job.overall_score !== undefined && (
                                            <MatchScoreRing score={job.overall_score} label="Overall" size={64} strokeWidth={6} labelClassName="text-indigo-600 font-bold" />
                                        )}
                                    </div>
                                </div>

                                {/* Badges */}
                                <div className="flex flex-wrap gap-2">
                                    {job.job_employment_type && (
                                        <span className="inline-block bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-medium">
                                            {job.job_employment_type}
                                        </span>
                                    )}
                                    {job.job_is_remote !== null && (
                                        <span
                                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${job.job_is_remote
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                                }`}
                                        >
                                            {job.job_is_remote ? 'Remote' : 'On-site'}
                                        </span>
                                    )}
                                    <span className="inline-block bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
                                        {job.job_posted_at}
                                    </span>
                                </div>

                                {/* Salary Section */}
                                <SalarySection
                                    jobCountry={job.job_country}
                                    minSalary={job.job_min_salary}
                                    maxSalary={job.job_max_salary}
                                    salaryPeriod={job.job_salary_period}
                                />

                                {/* Match Insights — per-section reasoning */}
                                {job.match_insights && (
                                    <div className="flex flex-col gap-2">
                                        {INSIGHT_SECTIONS.map(({ key, label, icon }) => {
                                            const text = job.match_insights?.[key as keyof typeof job.match_insights]
                                            if (!text) return null
                                            return (
                                                <DescriptionSection
                                                    key={key}
                                                    description={text}
                                                    label={`${icon} ${label}:`}
                                                />
                                            )
                                        })}
                                    </div>
                                )}

                                <JobPublisherAndApply
                                    job={job}
                                    resumeObjectKey={resumeObjectKey}
                                    onTailorResume={() => setTailorTarget(job)}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-lg">
                        <p className="text-blue-800 font-medium">
                            No matched jobs were found for your search criteria.
                        </p>
                        <p className="text-blue-700 text-sm mt-2">
                            However, you can still explore other available job postings that may interest you.
                        </p>
                    </div>
                )}
            </div>

            {/* Tailor Resume Side Artifact */}
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

import type { JobMatch, JobSearchResponse } from '~/types/job_search'
import { SaveJobBtn } from './ui/save-job-btn'
import { SalarySection } from './salary-section'
import { DescriptionSection } from './description-section'
import { JobPublisherHeader } from './job-publisher-header'
import { OtherJobListingsDialog } from './other-job-listings-dialog'
import { Globe } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import { JobLocationTooltip } from './job-location-tooltip'

export function JobMatchedCard({ jobSearchResponse }: { jobSearchResponse: JobSearchResponse }) {
    return (
        <div>
            <div className="flex justify-between mb-3">
                <h2 className="text-2xl font-semibold text-green-600 mb-2">Matched Job Postings</h2>

                <OtherJobListingsDialog jobSearchResponse={jobSearchResponse} />
            </div>
            {jobSearchResponse.jobs_matched.length > 0 ? (
                <div className="max-h-[500px] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                    {jobSearchResponse.jobs_matched.map((job, idx) => (
                        <div
                            key={idx}
                            className="bg-white rounded-lg shadow p-5 flex flex-col gap-4 relative"
                        >
                            {job.job_latitude && job.job_longitude && (
                                <div className="flex justify-end">
                                    <JobLocationTooltip
                                        job_latitude={job.job_latitude}
                                        job_longitude={job.job_longitude}
                                    />
                                </div>
                            )}

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
                                    <div className="font-bold text-indigo-700 text-lg">
                                        {job.job_title}
                                    </div>
                                    <div className="text-gray-700 text-sm">{job.employer_name}</div>
                                    {job.employer_website && (
                                        <a
                                            href={job.employer_website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 underline text-xs"
                                        >
                                            {job.employer_website}
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Description Section */}
                            <DescriptionSection description={job.job_description} />

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
                                        className={`inline-block px-2 py-0.5 rounded text-xs ${
                                            job.job_is_remote
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

                            {/* NOTE WHY THE JOB MATACHES */}
                            {/* <div className="mt-3 mb-4 text-xs text-gray-600">
                                <span className="font-semibold text-green-600 ">
                                    Why this position is a good fit:
                                </span>{' '}
                                {job.extraction_note}
                            </div> */}
                            {/* <div className="grow"></div> */}

                            <JobPublisherHeader job={job} />
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
    )
}

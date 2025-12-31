import type { JobMatch, JobSearchResponse } from '~/types/job_search'
import { SaveJobBtn } from './ui/save-job-btn'
import { SalarySection } from './salary-section'
import { JobPublisherAndApply } from './publisher-and-apply'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import { Globe } from 'lucide-react'
import { JobLocationTooltip } from './job-location-tooltip'
import { DescriptionSection } from './description-section'

export function OtherJobListCard({ jobSearchResponse }: { jobSearchResponse: JobSearchResponse }) {
    const matchedJobs = Array.isArray(jobSearchResponse.jobs_matched)
        ? jobSearchResponse.jobs_matched
        : []

    const matchedJobTitles = matchedJobs.map((j) => (j?.job_title ? j.job_title.toLowerCase() : ''))

    return (
        <div>
            <h2 className="text-2xl font-semibold text-gray-700 mt-5 mb-2">Other Job Postings</h2>
            {/* ONLY DISPLAY JOBS THAT IS NOT IN THE MATCHED JOB LISTINGS */}
            <div className="max-h-[500px] grid grid-cols-1 md:grid-cols-2 gap-6 opacity-90 ">
                {(() => {
                    return jobSearchResponse.job_listings
                        .filter(
                            (job) =>
                                job?.job_title &&
                                !matchedJobTitles.includes(job.job_title.toLowerCase()),
                        )
                        .map((job, idx) => (
                            <div
                                key={idx}
                                className="bg-gray-50 rounded-lg shadow p-5 flex flex-col gap-4 border border-gray-200"
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
                                        <div className="font-bold text-gray-700 text-lg">
                                            {job.job_title}
                                        </div>
                                        <div className="text-gray-700 text-sm">
                                            {job.employer_name}
                                        </div>
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
                                <div className="grow"></div>
                                <JobPublisherAndApply job={job} />
                            </div>
                        ))
                })()}
            </div>
        </div>
    )
}

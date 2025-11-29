import type { JobMatch, JobSearchResponse } from '~/types/job_search'
import { SaveJobBtn } from './ui/save-job-btn'

export function OtherJobListCard({ jobSearchResponse }: { jobSearchResponse: JobSearchResponse }) {
    return (
        <div>
            <h2 className="text-xl font-semibold text-gray-700 mt-5 mb-2">Other Job Postings</h2>
            <div className="max-h-[500px] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 opacity-90 ">
                {(() => {
                    const matchedJobs = Array.isArray(jobSearchResponse.jobs_matched)
                        ? jobSearchResponse.jobs_matched
                        : []

                    const matchedJobTitles = matchedJobs.map((j) =>
                        j?.job_title ? j.job_title.toLowerCase() : '',
                    )
                    return jobSearchResponse.job_listings
                        .filter(
                            (job) =>
                                job?.job_title &&
                                !matchedJobTitles.includes(job.job_title.toLowerCase()),
                        )
                        .map((job, idx) => (
                            <div
                                key={idx}
                                className="bg-gray-50 rounded-lg shadow p-5 flex flex-col border border-gray-200"
                            >
                                <div className="flex items-center mb-2">
                                    {job.employer_logo ? (
                                        <img
                                            src={job.employer_logo}
                                            alt={job.employer_name ?? 'Company Logo'}
                                            className="h-10 w-10 object-contain rounded mr-3 border"
                                        />
                                    ) : (
                                        <div className="h-10 w-10 mr-3 rounded bg-gray-200 flex items-center justify-center text-gray-400">
                                            <span className="material-icons">business</span>
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
                                <div className="mb-2">
                                    <span className="font-semibold text-gray-800">
                                        Description:
                                    </span>
                                    <div className="text-gray-700 text-sm line-clamp-5">
                                        {job.job_description}
                                    </div>
                                </div>

                                {/* Salary Section */}
                                <div className="mb-4">
                                    <span className="font-semibold text-gray-800">Salary:</span>{' '}
                                    <span className="text-gray-700 text-sm">
                                        {job.job_min_salary && job.job_max_salary
                                            ? `$${job.job_min_salary} - $${job.job_max_salary}`
                                            : job.job_min_salary
                                              ? `$${job.job_min_salary}`
                                              : job.job_max_salary
                                                ? `$${job.job_max_salary}`
                                                : 'Amount not specified'}
                                    </span>
                                    {job.job_salary_period && (
                                        <span className="ml-2 text-xs inline-block bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                                            {job.job_salary_period === 'YEAR' && 'Yearly'}
                                            {job.job_salary_period === 'MONTH' && 'Monthly'}
                                            {job.job_salary_period === 'HOUR' && 'Hourly'}
                                            {job.job_salary_period !== 'YEAR' &&
                                                job.job_salary_period !== 'MONTH' &&
                                                job.job_salary_period !== 'HOUR' &&
                                                job.job_salary_period}
                                        </span>
                                    )}
                                </div>

                                <div className="mb-2 flex flex-wrap gap-3">
                                    {job.job_employment_type && (
                                        <span className="inline-block bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs">
                                            {job.job_employment_type}
                                        </span>
                                    )}

                                    {job.job_is_remote && (
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
                                <div className="flex items-center justify-end gap-4">
                                    <SaveJobBtn job={job} />

                                    <a
                                        href={job.job_apply_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-blue-600 hover:cursor-pointer hover:opacity-75 text-white text-sm rounded px-4 py-2 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                                    >
                                        Apply
                                    </a>
                                </div>
                            </div>
                        ))
                })()}
            </div>
        </div>
    )
}

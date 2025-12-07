import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { DescriptionSection } from '~/components/description-section'
import { JobLocationTooltip } from '~/components/job-location-tooltip'
import { SalarySection } from '~/components/salary-section'
import { getSavedJobs } from '~/lib/api/get'
import type { SavedJobs } from '~/types/job_search'

function SavedJobsPage() {
    const {
        data: savedJobs = [],
        isLoading,
        error,
    } = useQuery<SavedJobs[]>({
        queryKey: ['saved_jobs'],
        queryFn: getSavedJobs,
    })

    if (isLoading) {
        return (
            <div className="w-full min-h-screen flex flex-col items-center justify-center">
                <div className="text-gray-500">Loading saved jobs...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="w-full min-h-screen flex flex-col items-center justify-center">
                <div className="text-red-500">Error loading saved jobs</div>
            </div>
        )
    }

    return (
        <div className="w-full min-h-screen flex flex-col p-10">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Saved Jobs</h1>
                <h3 className="text-md text-blue-600 font-normal">
                    Jobs you've saved for later review
                </h3>
            </div>

            {savedJobs.length === 0 ? (
                <div className="text-gray-500 mt-8">You have no saved jobs yet.</div>
            ) : (
                <div>
                    <div className="max-h-[500px] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
                        {savedJobs.map((job, idx) => (
                            <div
                                key={idx}
                                className={`rounded-lg shadow p-5 flex flex-col gap-4 ${
                                    job.extraction_note
                                        ? 'bg-green-50 border-2 border-green-400'
                                        : 'bg-white'
                                }`}
                            >
                                {/* JOB LOCATION MAP TOOLTIP */}
                                <div className="flex justify-end">
                                    <JobLocationTooltip
                                        job_latitude={job.job_latitude}
                                        job_longitude={job.job_longitude}
                                    />
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
                                        <div className="font-bold text-indigo-700 text-lg">
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
                                </div>

                                {/* NOTE WHY THE JOB MATACHES */}
                                {job.extraction_note && (
                                    <div className="mt-3 text-xs text-gray-600">
                                        <span className="font-semibold text-green-600 ">
                                            Why this position is a good fit:
                                        </span>{' '}
                                        {job.extraction_note}
                                    </div>
                                )}

                                <div className="grow"></div>

                                <div
                                    className={`flex items-center gap-4 ${job.job_publisher ? 'justify-between' : 'justify-end'}`}
                                >
                                    {job.job_publisher && (
                                        <div className="w-[30%] text-center bg-blue-200 border-2 border-blue-500 text-sm text-blue-900 mb-2 px-2 py-0.5 rounded z-10">
                                            {job.job_publisher}
                                        </div>
                                    )}

                                    <a
                                        href={job.job_apply_link ?? ''}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-blue-600 hover:cursor-pointer hover:opacity-75 text-white text-sm rounded px-4 py-2 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                                    >
                                        Apply
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default SavedJobsPage

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DescriptionSection } from '~/components/description-section'
import { JobLocationTooltip } from '~/components/job-location-tooltip'
import { SalarySection } from '~/components/salary-section'
import { getSavedJobs } from '~/lib/api/get'
import type { SavedJobs } from '~/types/resume_matching'
import { Trash2 } from 'lucide-react'
import { deleteSavedJobs } from '~/lib/api/delete'
import FullScreenLoader from '~/components/full-screen-loader'
import { PageHeader } from '~/components/ui/page-header'
import { EmployerInsightsBtn } from '~/components/employer-insights-btn'

function SavedJobsPage() {
    const queryClient = useQueryClient()
    const {
        data: savedJobs = [],
        isLoading,
        error,
    } = useQuery<SavedJobs[]>({
        queryKey: ['saved_jobs'],
        queryFn: getSavedJobs,
    })

    const removeJobMutation = useMutation({
        mutationFn: (jobId: number) => deleteSavedJobs(jobId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['saved_jobs'] })
        },
    })

    if (removeJobMutation.isPending) {
        return (
           <FullScreenLoader message='Deleting saved job...' />
        )
    }

    if (isLoading) {
        return (
           <FullScreenLoader message='Loading saved jobs...' />
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
            <PageHeader
                title="Saved Jobs"
                subtitle="Jobs you've saved for later review"
                className="mb-6 shrink-0"
            />

            {savedJobs.length === 0 ? (
                <div className="text-gray-500 mt-8">You have no saved jobs yet.</div>
            ) : (
                <div>
                    <div className="max-h-[600px] overflow-y-auto flex flex-col gap-4 mt-5 pr-1">
                        {savedJobs.map((job, idx) => (
                            <div
                                key={job.id ?? idx}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4 group"
                            >
                                {/* TOP ROW: Logo + Info */}
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

                                    {/* Title + Company + Website + Actions */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
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
                                                        {job.employer_name && (
                                                            <EmployerInsightsBtn
                                                                employerName={job.employer_name}
                                                                employerWebsite={job.employer_website}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-3 shrink-0">
                                                {job.job_latitude && job.job_longitude && (
                                                    <JobLocationTooltip
                                                        job_latitude={job.job_latitude}
                                                        job_longitude={job.job_longitude}
                                                    />
                                                )}
                                                <button
                                                    title="Delete saved job"
                                                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors cursor-pointer"
                                                    onClick={() => removeJobMutation.mutate(job.id)}
                                                    disabled={removeJobMutation.isPending}
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
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
                                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                                job.job_is_remote
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                            }`}
                                        >
                                            {job.job_is_remote ? 'Remote' : 'On-site'}
                                        </span>
                                    )}
                                </div>

                                {/* Salary Section */}
                                <SalarySection
                                    jobCountry={job.job_country}
                                    minSalary={job.job_min_salary}
                                    maxSalary={job.job_max_salary}
                                    salaryPeriod={job.job_salary_period}
                                />

                                {/* Description Section */}
                                {job.job_description && <DescriptionSection description={job.job_description} />}

                                {/* Match Insights — Extraction Note */}
                                {job.extraction_note && (
                                    <div className="flex flex-col gap-2 mt-2">
                                        <DescriptionSection
                                            description={job.extraction_note}
                                            label="✨ Why this position is a good fit:"
                                        />
                                    </div>
                                )}

                                {/* Publisher & Apply Button */}
                                <div className={`flex items-center mt-3 ${job.job_publisher ? 'justify-between' : 'justify-end'}`}>
                                    {job.job_publisher && (
                                        <div className="w-[15%] text-center bg-blue-200 border-2 border-blue-500 text-sm text-blue-900 px-2 py-0.5 rounded z-10">
                                            {job.job_publisher}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-end gap-3">
                                        <a
                                            href={job.job_apply_link ?? '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-disabled={!job.job_apply_link}
                                            className={`inline-flex items-center gap-1.5 text-white text-sm rounded px-4 py-2 font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                                                !job.job_apply_link
                                                    ? 'bg-gray-400 cursor-not-allowed opacity-70'
                                                    : 'bg-blue-600 hover:cursor-pointer hover:opacity-75'
                                            }`}
                                        >
                                            Apply
                                        </a>
                                    </div>
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

import { useForm, type SubmitHandler } from 'react-hook-form'
import type { JobSearchResponse, JobSearchForm } from '~/types/job_search'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { useState } from 'react'
import { ArrowRight } from 'lucide-react'

const JobSearchPage = () => {
    const [jobSearchResponse, setJobSearchResponse] = useState<JobSearchResponse>()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<JobSearchForm>()

    const mutation = useMutation({
        mutationFn: async (payload: JobSearchForm) => {
            const response = await axios.post(`http://127.0.0.1:8000/api/v1/job/search`, payload)
            console.log('response.data: ', response.data)

            const undefinedValueCatcher = {
                job_listings: [],
                jobs_matched: [],
            }

            setJobSearchResponse(response.data ?? undefinedValueCatcher)
            return response.data
        },
    })

    const handleSearchAnother = () => setJobSearchResponse(undefined)

    const onSubmit: SubmitHandler<JobSearchForm> = (data) => {
        mutation.mutate(data)
    }

    // Add fullscreen loader when mutation is in progress
    if (mutation.isPending) {
        return (
            <div className="fixed inset-0 bg-white bg-opacity-75 flex flex-col items-center justify-center z-50">
                <svg
                    className="animate-spin h-16 w-16 text-blue-600 mb-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                </svg>
                <div className="text-lg text-blue-700 font-medium">Searching for jobs...</div>
            </div>
        )
    }

    return (
        <div className="w-full  min-h-screen flex flex-col p-10">
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
                    <h1 className="text-2xl font-bold  text-gray-900">Search for Jobs</h1>
                    <h3 className="text-md text-blue-600 font-normal">
                        Specify the job specification you're searching for
                    </h3>
                </>
            )}

            {/* NO JOB LISTING RETRIEVED */}
            {jobSearchResponse && jobSearchResponse.job_listings.length <= 0 && (
                <div className="mt-8 flex flex-col items-center">
                    <div className="text-gray-500 text-lg font-medium">No jobs found.</div>
                    <div className="text-gray-400 text-sm">
                        Try adjusting your search criteria above.
                    </div>

                    {/* SEARCH ANOTHER */}
                    <div className="mt-3">
                        <button
                            onClick={handleSearchAnother}
                            className="bg-blue-600 hover:cursor-pointer hover:opacity-75 text-white rounded px-6 py-2 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        >
                            Search another
                        </button>
                    </div>
                </div>
            )}

            {jobSearchResponse &&
            ((jobSearchResponse.jobs_matched && jobSearchResponse.jobs_matched.length > 0) ||
                (jobSearchResponse.job_listings && jobSearchResponse.job_listings.length > 0)) ? (
                <div className="space-y-10 mt-6">
                    {/* SEARCH ANOTHER */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleSearchAnother}
                            className="text-gray-400 hover:opacity-75 hover:cursor-pointer flex items-center gap-1"
                        >
                            Search another
                            <ArrowRight className="size-5" />
                        </button>
                    </div>

                    {/* Matched Jobs */}
                    {jobSearchResponse.jobs_matched &&
                        jobSearchResponse.jobs_matched.length > 0 && (
                            <div>
                                <h2 className="text-xl font-semibold text-green-600 mb-2">
                                    Matched Job Postings
                                </h2>
                                <div className="max-h-[500px] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {jobSearchResponse.jobs_matched.map((job, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-white rounded-lg shadow p-5 flex flex-col"
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
                                                        <span className="material-icons">
                                                            business
                                                        </span>
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
                                            <div className="mb-2">
                                                <span className="font-semibold text-gray-800 ">
                                                    Description:
                                                </span>
                                                <div className="text-gray-700 text-sm line-clamp-5">
                                                    {job.job_description}
                                                </div>
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

                                                {job.job_salary_period && (
                                                    <span className="inline-block bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs">
                                                        {job.job_salary_period}
                                                    </span>
                                                )}
                                                {job.job_min_salary !== null &&
                                                    job.job_max_salary !== null && (
                                                        <span className="inline-block bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs">
                                                            {`$${job.job_min_salary} - $${job.job_max_salary}`}
                                                        </span>
                                                    )}
                                                <span className="inline-block bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs">
                                                    {job.job_posted_at}
                                                </span>
                                            </div>
                                            <div className="mt-3 mb-4 text-xs text-gray-600">
                                                <span className="font-semibold text-gray-700 ">
                                                    Skills matched:
                                                </span>{' '}
                                                {job.extraction_note}
                                            </div>
                                            <div className="grow"></div>
                                            <div className="flex items-center justify-end gap-4">
                                                <button className="text-blue-600 text-sm hover:cursor-pointer hover:opacity-75">
                                                    Save Job
                                                </button>
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
                                    ))}
                                </div>
                            </div>
                        )}

                    {/* Non-Matched Jobs */}
                    {jobSearchResponse.job_listings &&
                        jobSearchResponse.job_listings.length > 0 && (
                            <div>
                                <h2 className="text-xl font-semibold text-gray-700 mt-5 mb-2">
                                    Other Job Postings
                                </h2>
                                <div className="max-h-[500px] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 opacity-90 ">
                                    {(() => {
                                        // Gather job_title from matched jobs (case-insensitive)
                                        const matchedJobTitles = (
                                            jobSearchResponse.jobs_matched || []
                                        ).map((j) =>
                                            j?.job_title ? j.job_title.toLowerCase() : '',
                                        )
                                        return jobSearchResponse.job_listings
                                            .filter(
                                                (job) =>
                                                    job?.job_title &&
                                                    !matchedJobTitles.includes(
                                                        job.job_title.toLowerCase(),
                                                    ),
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
                                                                alt={
                                                                    job.employer_name ??
                                                                    'Company Logo'
                                                                }
                                                                className="h-10 w-10 object-contain rounded mr-3 border"
                                                            />
                                                        ) : (
                                                            <div className="h-10 w-10 mr-3 rounded bg-gray-200 flex items-center justify-center text-gray-400">
                                                                <span className="material-icons">
                                                                    business
                                                                </span>
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
                                                                {job.job_is_remote
                                                                    ? 'Remote'
                                                                    : 'On-site'}
                                                            </span>
                                                        )}
                                                        {job.job_salary_period &&
                                                            job.job_min_salary &&
                                                            job.job_max_salary && (
                                                                <span className="inline-block bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs">
                                                                    {job.job_salary_period}
                                                                </span>
                                                            )}
                                                        {job.job_min_salary &&
                                                            job.job_max_salary && (
                                                                <span className="inline-block bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs">
                                                                    {`$${job.job_min_salary} - $${job.job_max_salary}`}
                                                                </span>
                                                            )}
                                                        <span className="inline-block bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs">
                                                            {job.job_posted_at}
                                                        </span>
                                                    </div>
                                                    <div className="grow"></div>
                                                    <div className="flex items-center justify-end gap-4">
                                                        <button className="text-blue-600 text-sm hover:cursor-pointer hover:opacity-75">
                                                            Save Job
                                                        </button>
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
                        )}
                </div>
            ) : (

                // JOB SEARCH FORM
                !jobSearchResponse && (
                    <form
                        className="mb-8 bg-white rounded-lg shadow p-6 space-y-6"
                        onSubmit={handleSubmit(onSubmit)}
                    >
                        <div className="grid grid-cols-1  gap-6">
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
                                    {/* Add more as needed */}
                                </select>
                            </div>
                        </div>

                        {/* Experience Level */}
                        <div className="flex flex-col">
                            <label className="mb-1 text-gray-700 font-medium">
                                Your Experience Level
                            </label>
                            <select
                                className="rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                defaultValue=""
                                {...register('experience_level')}
                            >
                                <option value="" disabled>
                                    Select experience level
                                </option>
                                <option value="Less than 1 year">Less than 1 year</option>
                                <option value="1 - 3 years">1 - 3 years</option>
                                <option value="3 - 5 years">3 - 5 years</option>
                                <option value="More than 5 years">More than 5 years</option>
                            </select>
                        </div>

                        {/* Professional Summary */}
                        <div className="flex flex-col">
                            <label className="mb-1 text-gray-700 font-medium">
                                Your Professional Summary
                            </label>
                            <textarea
                                rows={4}
                                placeholder="Briefly describe your background and skills that would match to the job your searching..."
                                className="rounded border border-gray-300 px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                {...register('professional_summary')}
                            />
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

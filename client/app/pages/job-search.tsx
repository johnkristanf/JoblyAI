import { useForm, type SubmitHandler } from 'react-hook-form'
import type { JobSearchResponse, JobSearchForm } from '~/types/job_search'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { JobMatchedCard } from '~/components/job-matched-card'
import { OtherJobListCard } from '~/components/other-job-list-card'
import NoJobsFound from '~/components/ui/no-jobs-found'

const JobSearchPage = () => {
    const [jobSearchResponse, setJobSearchResponse] = useState<JobSearchResponse>()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<JobSearchForm>()

    const mutation = useMutation({
        mutationFn: async (payload: JobSearchForm) => {
            const response = await axios.post(`${import.meta.env.VITE_API_V1_BASE_URL}/job/search`, payload)
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
                <NoJobsFound searchAnotherHandler={handleSearchAnother} />
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
                            <JobMatchedCard jobsMatched={jobSearchResponse.jobs_matched} />
                        )}

                    {/* Non-Matched Jobs */}
                    {jobSearchResponse.job_listings &&
                        jobSearchResponse.job_listings.length > 0 && (
                            <OtherJobListCard jobSearchResponse={jobSearchResponse} />
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

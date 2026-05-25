import type { JobSearchResponse } from '~/types/job_search'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { JobMatchedCard } from '~/components/job-matched-card'
import NoJobsFound from '~/components/ui/no-jobs-found'
import { jobSearch } from '~/lib/api/post'
import { toast } from 'sonner'
import FullScreenLoader from '~/components/full-screen-loader'
import { getAllResumes, getTaskStatus } from '~/lib/api/get'
import type { ResumeData } from '~/types/resume'
import { Statuses } from '~/types/enum'
import { JobSearchForm } from '~/components/job/job-search-form'
import InlineLoader from '~/components/ui/inline-loader'
import { PageHeader } from '~/components/ui/page-header'

const ResumeMatchingPage = () => {
    const [jobSearchTaskID, setJobSearchTaskID] = useState<string>()
    const [resumeUploadState, setResumeUploadState] = useState<{
        taskID?: string
        objectKey: string | null
    }>({ objectKey: null })
    const [jobSearchResponse, setJobSearchResponse] = useState<JobSearchResponse>()
    const [isJobSearchPolling, setIsJobSearchPolling] = useState<boolean>(false)

    const {
        data: resumesData,
        isLoading: resumesLoading,
        error: resumesError,
        refetch: refetchResumes,
    } = useQuery<ResumeData[]>({
        queryKey: ['resumes', 'all'],
        queryFn: getAllResumes,
    })
    const jobSearchMutation = useMutation({
        mutationFn: jobSearch,
        onSuccess: (response) => {
            setIsJobSearchPolling(true)
            setJobSearchTaskID(response.job_matching_task_id)
            if (response.resume_upload_task_id) {
                setResumeUploadState((prev) => ({ ...prev, taskID: response.resume_upload_task_id }))
            }
            if (response.existing_resume_object_key) {
                setResumeUploadState((prev) => ({ ...prev, objectKey: response.existing_resume_object_key }))
            }
        },
        onError: (err: any) => {
            toast.error('Error in matching job, please try again later')
        },
    })

    const { data: jobSearchStatus } = useQuery({
        queryKey: ['task_status', jobSearchTaskID],
        queryFn: getTaskStatus,
        enabled: !!jobSearchTaskID,
        refetchInterval: (query) => {
            const status = query.state.data?.status
            return status === 'SUCCESS' || status === 'FAILURE' ? false : 2000
        },
    })

    const { data: resumeUploadStatus } = useQuery({
        queryKey: ['task_status', resumeUploadState.taskID],
        queryFn: getTaskStatus,
        enabled: !!resumeUploadState.taskID,
        refetchInterval: (query) => {
            const status = query.state.data?.status
            return status === 'SUCCESS' || status === 'FAILURE' ? false : 2000
        },
    })

    useEffect(() => {
        if (jobSearchStatus?.status === Statuses.SUCCESS) {
            console.log("jobSearchStatus: ", jobSearchStatus);
            
            setJobSearchResponse({
                job_listings: jobSearchStatus.job_listings ?? [],
                jobs_matched: jobSearchStatus.jobs_matched ?? [],
            })

            setIsJobSearchPolling(false)
        }

        if (jobSearchStatus?.status === Statuses.FAILURE) {
            setIsJobSearchPolling(false)
            toast.error('Job search failed.')
        }
    }, [jobSearchStatus])

    useEffect(() => {
        if (resumeUploadStatus?.status === Statuses.SUCCESS) {
            setResumeUploadState((prev) => ({
                taskID: undefined,
                objectKey: resumeUploadStatus.object_key || prev.objectKey,
            }))
            refetchResumes()
        }

        if (resumeUploadStatus?.status === Statuses.FAILURE) {
            setResumeUploadState((prev) => ({ ...prev, taskID: undefined }))
            toast.error('Failed to save resume in background.')
        }
    }, [resumeUploadStatus, refetchResumes])

    const handleSearchAnother = () => setJobSearchResponse(undefined)

    return (
        <div className="w-full min-h-screen flex flex-col p-10">
            {/* DYNAMIC PAGE TITLE */}
            {jobSearchResponse &&
                ((jobSearchResponse.jobs_matched && jobSearchResponse.jobs_matched.length > 0) ||
                    (jobSearchResponse.job_listings && jobSearchResponse.job_listings.length > 0)) ? (
                <PageHeader
                    title="Job Results"
                    subtitle="Here are the best job matches found based on your resume and search criteria."
                    className="mb-6 shrink-0"
                />
            ) : (
                !isJobSearchPolling && (
                    <PageHeader
                        title="Resume Job Matching"
                        subtitle="Upload your resume and specify a role — our AI will find the best-matching jobs for your background."
                        className="mb-6 shrink-0"
                    />
                )
            )}

            {/* NO JOB LISTING RETRIEVED */}
            {jobSearchResponse && jobSearchResponse.job_listings.length == 0 && (
                <NoJobsFound searchAnotherHandler={handleSearchAnother} />
            )}

            {/* JOB SEARCH POLLING LOADER */}
            {!jobSearchResponse && isJobSearchPolling && (
                <InlineLoader message='Searching may take a few moments...' />
            )}

            {jobSearchResponse &&
                ((jobSearchResponse.jobs_matched && jobSearchResponse.jobs_matched.length > 0) ||
                    (jobSearchResponse.job_listings && jobSearchResponse.job_listings.length > 0)) ? (
                <div className="space-y-10 mt-6">
                    {/* SEARCH ANOTHER */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleSearchAnother}
                            className="text-gray-500 hover:opacity-75 hover:cursor-pointer flex items-center gap-1"
                        >
                            Search another
                            <ArrowRight className="size-5" />
                        </button>
                    </div>

                    {/* Matched Jobs */}
                    {jobSearchResponse.jobs_matched && (
                        <JobMatchedCard
                            jobSearchResponse={jobSearchResponse}
                            resumeObjectKey={resumeUploadState.objectKey}
                        />
                    )}
                </div>
            ) : (
                // JOB SEARCH FORM
                !jobSearchResponse &&
                !isJobSearchPolling && (
                    <JobSearchForm
                        onSubmitForm={jobSearchMutation.mutate}
                        isPending={jobSearchMutation.isPending}
                        resumesData={resumesData}
                        resumesLoading={resumesLoading}
                        resumesError={resumesError}
                        onSetResumeObjectKey={(objectKey) => setResumeUploadState((prev) => ({ ...prev, objectKey }))}
                    />
                )
            )}
        </div>
    )
}

export default ResumeMatchingPage

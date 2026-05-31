import type { ResumeMatchingResponse } from '~/types/resume_matching'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { JobMatchedCard } from '~/components/job-matched-card'
import NoJobsFound from '~/components/ui/no-jobs-found'
import { resumeMatching } from '~/lib/api/post'
import { toast } from 'sonner'
import FullScreenLoader from '~/components/full-screen-loader'
import { getAllResumes, getTaskStatus } from '~/lib/api/get'
import type { ResumeData } from '~/types/resume'
import { Statuses } from '~/types/enum'
import { JobSearchForm } from '~/components/job/job-search-form'
import InlineLoader from '~/components/ui/inline-loader'
import { PageHeader } from '~/components/ui/page-header'

const ResumeMatchingPage = () => {
    const [resumeMatchingTaskID, setResumeMatchingTaskID] = useState<string>()
    const [resumeUploadState, setResumeUploadState] = useState<{
        taskID?: string
        objectKey: string | null
    }>({ objectKey: null })
    const [resumeMatchingResponse, setResumeMatchingResponse] = useState<ResumeMatchingResponse>()
    const [isResumeMatchingPolling, setIsResumeMatchingPolling] = useState<boolean>(false)

    const {
        data: resumesData,
        isLoading: resumesLoading,
        error: resumesError,
        refetch: refetchResumes,
    } = useQuery<ResumeData[]>({
        queryKey: ['resumes', 'all'],
        queryFn: getAllResumes,
    })
    const resumeMatchingMutation = useMutation({
        mutationFn: resumeMatching,
        onSuccess: (response) => {
            setIsResumeMatchingPolling(true)
            setResumeMatchingTaskID(response.job_matching_task_id)
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

    const { data: resumeMatchingStatus } = useQuery({
        queryKey: ['task_status', resumeMatchingTaskID],
        queryFn: getTaskStatus,
        enabled: !!resumeMatchingTaskID,
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
        if (resumeMatchingStatus?.status === Statuses.SUCCESS) {
            console.log("resumeMatchingStatus: ", resumeMatchingStatus);
            
            setResumeMatchingResponse({
                jobs_matched: resumeMatchingStatus.jobs_matched ?? [],
            })

            setIsResumeMatchingPolling(false)
        }

        if (resumeMatchingStatus?.status === Statuses.FAILURE) {
            setIsResumeMatchingPolling(false)
            toast.error('Job search failed.')
        }
    }, [resumeMatchingStatus])

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

    const handleSearchAnother = () => setResumeMatchingResponse(undefined)

    return (
        <div className="w-full min-h-screen flex flex-col p-10">
            {/* DYNAMIC PAGE TITLE */}
            {resumeMatchingResponse && resumeMatchingResponse.jobs_matched && resumeMatchingResponse.jobs_matched.length > 0 ? (
                <PageHeader
                    title="Match Results"
                    subtitle="Here are the best job matches found based on your resume and search criteria."
                    className="mb-6 shrink-0"
                />
            ) : (
                !isResumeMatchingPolling && (
                    <PageHeader
                        title="Resume Job Matching"
                        subtitle="Upload your resume and specify a role — our AI will find the best-matching jobs for your background."
                        className="mb-6 shrink-0"
                    />
                )
            )}

            {/* NO JOB LISTING RETRIEVED */}
            {resumeMatchingResponse && resumeMatchingResponse.jobs_matched.length == 0 && (
                <NoJobsFound searchAnotherHandler={handleSearchAnother} />
            )}

            {/* JOB SEARCH POLLING LOADER */}
            {!resumeMatchingResponse && isResumeMatchingPolling && (
                <InlineLoader message='Searching may take a few moments...' />
            )}

            {resumeMatchingResponse && resumeMatchingResponse.jobs_matched && resumeMatchingResponse.jobs_matched.length > 0 ? (
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
                    {resumeMatchingResponse.jobs_matched && (
                        <JobMatchedCard
                            resumeMatchingResponse={resumeMatchingResponse}
                            resumeObjectKey={resumeUploadState.objectKey}
                        />
                    )}
                </div>
            ) : (
                // JOB SEARCH FORM
                !resumeMatchingResponse &&
                !isResumeMatchingPolling && (
                    <JobSearchForm
                        onSubmitForm={resumeMatchingMutation.mutate}
                        isPending={resumeMatchingMutation.isPending}
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

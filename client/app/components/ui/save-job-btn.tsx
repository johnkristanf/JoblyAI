import { useState } from 'react'
import type { JobMatch } from '~/types/job_search'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'

type SaveJobBtnProps = {
    job: JobMatch
}

export function SaveJobBtn({ job }: SaveJobBtnProps) {
    const saveJobMutation = useMutation({
        mutationFn: async (jobToSave: JobMatch) => {
            // Using axios instead of fetch
            try {
                const response = await axios.post(
                    'http://127.0.0.1:8000/api/v1/job/save',
                    jobToSave,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    },
                )
                return response.data
            } catch (error: any) {
                throw new Error(error.response?.data?.message || 'Failed to save job')
            }
        },
        onSuccess: () => {
            toast.success('Job saved successfully!')
        },
        onError: (err: any) => {
            toast.success('Error in saving job, please try again later')
        },
    })

    function handleSaveJob() {
        saveJobMutation.mutate(job)
    }

    return (
        <button
            onClick={handleSaveJob}
            className="text-blue-600 text-sm hover:cursor-pointer hover:opacity-75 flex items-center gap-1"
            disabled={saveJobMutation.isPending}
        >
            {saveJobMutation.isPending ? (
                <svg className="animate-spin h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="none">
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
            ) : (
                <p>Save Job</p>
            )}
        </button>
    )
}

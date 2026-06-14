import axios from 'axios'
import type { QueryKey } from '@tanstack/react-query'
import { getAccessToken } from '../supabase/client'

export const getSavedJobs = async () => {
    const accessToken = await getAccessToken()

    const response = await axios.get(`${import.meta.env.VITE_API_V1_BASE_URL}/job/saved`, {
        headers: {
            Authorization: accessToken ? `Bearer ${accessToken}` : '',
        },
    })
    return response.data
}

export const getAllResumes = async () => {
    const accessToken = await getAccessToken()
    const response = await axios.get(`${import.meta.env.VITE_API_V1_BASE_URL}/resume/get/all`, {
        headers: {
            Authorization: accessToken ? `Bearer ${accessToken}` : '',
        },
    })
    return response.data
}


export const getTaskStatus = async ({ queryKey }: { queryKey: QueryKey }) => {
    // Extract taskID from the queryKey, which should have the format: ['task_status', taskID]
    const [_key, taskID] = queryKey as [string, string | undefined];

    if (!taskID) {
        throw new Error('No taskID provided for task status request.');
    }

    const accessToken = await getAccessToken()

    const response = await axios.get(
        `${import.meta.env.VITE_API_V1_BASE_URL}/celery/task/${taskID}/status`,
        {
            headers: {
                Authorization: accessToken ? `Bearer ${accessToken}` : '',
            },
        }
    )

    return response.data
}

export const getResumePresignedUrl = async (objectKey: string): Promise<string> => {
    const accessToken = await getAccessToken()
    const response = await axios.get(`${import.meta.env.VITE_API_V1_BASE_URL}/resume/presigned-url`, {
        headers: {
            Authorization: accessToken ? `Bearer ${accessToken}` : '',
        },
        params: { object_key: objectKey },
    })
    return response.data.url
}

export const getInterviews = async () => {
    const accessToken = await getAccessToken()
    const response = await axios.get(`${import.meta.env.VITE_API_V1_BASE_URL}/interview/all`, {
        headers: {
            Authorization: accessToken ? `Bearer ${accessToken}` : '',
        },
    })
    return response.data
}

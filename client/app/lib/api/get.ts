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


export const getJobSearchResponse = async ({ queryKey }: { queryKey: QueryKey }) => {
    // Extract taskID from the queryKey, which should have the format: ['job_search_response', taskID]
    const [_key, taskID] = queryKey as [string, string | undefined];

    console.log("taskID inside polling: ", taskID);
    

    if (!taskID) {
        throw new Error('No taskID provided for job search response request.');
    }

    const accessToken = await getAccessToken()

    const response = await axios.get(
        `${import.meta.env.VITE_API_V1_BASE_URL}/job/search/response/${taskID}`,
        {
            headers: {
                Authorization: accessToken ? `Bearer ${accessToken}` : '',
            },
        }
    )

    console.log("response data sa polling: ", response.data);
    

    return response.data
}

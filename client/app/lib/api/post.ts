import axios from 'axios'
import type { Dispatch, SetStateAction } from 'react'
import type { JobMatch, JobSearchForm, JobSearchResponse } from '~/types/job_search'
import { getAccessToken, supabase } from '../supabase/client'

export const jobSearch = async (formData: FormData) => {
    const accessToken = await getAccessToken()

    const response = await axios.post(
        `${import.meta.env.VITE_API_V1_BASE_URL}/job/search`,
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: accessToken ? `Bearer ${accessToken}` : '',
            },
        },
    )

    return response.data
}

export const saveJob = async (jobToSave: JobMatch) => {
    try {
        const accessToken = await getAccessToken()

        const response = await axios.post(
            `${import.meta.env.VITE_API_V1_BASE_URL}/job/save`,
            jobToSave,
            {
                headers: {
                    Authorization: accessToken ? `Bearer ${accessToken}` : '',
                    'Content-Type': 'application/json',
                },
            },
        )
        return response.data
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to save job')
    }
}

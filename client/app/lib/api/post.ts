import axios from 'axios'
import type { Dispatch, SetStateAction } from 'react'
import type { JobMatch, JobSearchForm, JobSearchResponse } from '~/types/job_search'
import { supabase } from '../supabase/client'

export const jobSearch = async ({
    payload,
    setJobSearchResponse,
}: {
    payload: JobSearchForm
    setJobSearchResponse: Dispatch<SetStateAction<JobSearchResponse | undefined>>
}) => {
    const {
        data: { session },
    } = await supabase.auth.getSession()

    const response = await axios.post(
        `${import.meta.env.VITE_API_V1_BASE_URL}/job/search`,
        payload,
        {
            headers: {
                Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
                'Content-Type': 'application/json',
            },
        },
    )
    const undefinedValueCatcher = {
        job_listings: [],
        jobs_matched: [],
    }

    setJobSearchResponse(response.data ?? undefinedValueCatcher)
    return response.data
}

export const saveJob = async (jobToSave: JobMatch) => {
    try {
        const {
            data: { session },
        } = await supabase.auth.getSession()

        const response = await axios.post(
            `${import.meta.env.VITE_API_V1_BASE_URL}/job/save`,
            jobToSave,
            {
                headers: {
                    Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
                    'Content-Type': 'application/json',
                },
            },
        )
        return response.data
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to save job')
    }
}

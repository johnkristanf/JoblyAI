import axios from 'axios'
import type { JobMatch } from '~/types/job_search'
import { getAccessToken } from '../supabase/client'
import type { RemoveResumeData, ResumeFile } from '~/types/resume'

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

export const uploadResume = async (files: ResumeFile[]) => {
    const accessToken = await getAccessToken()
    const formData = new FormData()

    files.forEach((file, idx) => {
        formData.append('resume', file.file)
    })

    const response = await axios.post(
        `${import.meta.env.VITE_API_V1_BASE_URL}/resume/upload`,
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

export const removeResume = async (remove_resume_data: RemoveResumeData) => {
    try {
        const accessToken = await getAccessToken()

        const response = await axios.post(
            `${import.meta.env.VITE_API_V1_BASE_URL}/resume/remove`,
            remove_resume_data,
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

export const generateInterviewProcess = async (jobData: JobMatch): Promise<{ process: string }> => {
    try {
        const accessToken = await getAccessToken()

        const response = await axios.post(
            `${import.meta.env.VITE_API_V1_BASE_URL}/job/interview-process`,
            jobData,
            {
                headers: {
                    Authorization: accessToken ? `Bearer ${accessToken}` : '',
                    'Content-Type': 'application/json',
                },
            },
        )
        return response.data
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to generate interview process')
    }
}

export const generateEmployerInsights = async (
    employerWebsite: string,
): Promise<{ insights: string }> => {
    try {
        const accessToken = await getAccessToken()

        const response = await axios.post(
            `${import.meta.env.VITE_API_V1_BASE_URL}/job/employer-insights`,
            { employer_website: employerWebsite },
            {
                headers: {
                    Authorization: accessToken ? `Bearer ${accessToken}` : '',
                    'Content-Type': 'application/json',
                },
            },
        )
        return response.data
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to generate employer insights')
    }
}

export const jobQuery = async (query: string): Promise<{ response: string }> => {
    try {
        const accessToken = await getAccessToken()

        const response = await axios.post(
            `${import.meta.env.VITE_API_V1_BASE_URL}/job/query`,
            { query },
            {
                headers: {
                    Authorization: accessToken ? `Bearer ${accessToken}` : '',
                    'Content-Type': 'application/json',
                },
            },
        )
        return response.data
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to query jobs')
    }
}

export interface TailorResumePayload {
    object_key: string
    job_title: string
    job_description: string
    employer_name?: string | null
}

export const tailorResume = async (payload: TailorResumePayload): Promise<Response> => {
    const accessToken = await getAccessToken()

    const response = await fetch(`${import.meta.env.VITE_API_V1_BASE_URL}/resume/tailor`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: accessToken ? `Bearer ${accessToken}` : '',
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        throw new Error('Failed to tailor resume')
    }

    return response
}

import axios from 'axios'
import type { JobMatch } from '~/types/resume_matching'
import { getAccessToken } from '../supabase/client'
import type { RemoveResumeData, ResumeFile } from '~/types/resume'
import type { CreateInterviewPayload } from '~/types/interview'

export const resumeMatching = async (formData: FormData) => {
    const accessToken = await getAccessToken()

    const response = await axios.post(
        `${import.meta.env.VITE_API_V1_BASE_URL}/job/match-resume`,
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

export const createInterview = async (payload: CreateInterviewPayload): Promise<{ interview_id: string }> => {
    const accessToken = await getAccessToken()

    const response = await axios.post(
        `${import.meta.env.VITE_API_V1_BASE_URL}/interview/create`,
        payload,
        {
            headers: {
                Authorization: accessToken ? `Bearer ${accessToken}` : '',
                'Content-Type': 'application/json',
            },
        },
    )

    return response.data
}


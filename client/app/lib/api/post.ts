import axios from 'axios'
import type { JobMatch } from '~/types/job_search'
import { getAccessToken, supabase } from '../supabase/client'
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

        console.log("remove_resume_data: ", remove_resume_data);
        

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

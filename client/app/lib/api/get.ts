import axios from 'axios'
import { getAccessToken, supabase } from '../supabase/client'

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
    console.log("response.data: ", response.data);
    return response.data
}

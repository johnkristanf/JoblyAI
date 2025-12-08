import axios from 'axios'
import { getAccessToken } from '../supabase/client'

export const uploadAvatar = async (formData: FormData) => {
    const accessToken = await getAccessToken()

    const response = await axios.patch(
        `${import.meta.env.VITE_API_V1_BASE_URL}/user/profile`,
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
        },
    )

    return response.data
}

export const updateUserBasicInformation = async (formData: FormData) => {
    const accessToken = await getAccessToken()

    const response = await axios.patch(
        `${import.meta.env.VITE_API_V1_BASE_URL}/user/profile`,
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
        },
    )

    return response.data
}

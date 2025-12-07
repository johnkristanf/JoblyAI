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

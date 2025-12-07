import axios from 'axios'
import { supabase } from '../supabase/client'

export const getSavedJobs = async () => {
    const {
        data: { session },
    } = await supabase.auth.getSession()

    const response = await axios.get(`${import.meta.env.VITE_API_V1_BASE_URL}/job/saved`, {
        headers: {
            Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
        },
    })
    return response.data
}

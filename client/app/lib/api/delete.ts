import axios from "axios"
import { getAccessToken } from "../supabase/client"

export const deleteSavedJobs = async (jobId: number) => {
    const accessToken = await getAccessToken()

    const response = await axios.delete(`${import.meta.env.VITE_API_V1_BASE_URL}/job/saved/${jobId}`, {
        headers: {
            Authorization: accessToken ? `Bearer ${accessToken}` : '',
        },
    })
    return response.data
}

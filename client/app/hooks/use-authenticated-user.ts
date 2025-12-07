import { useEffect, useState } from 'react'
import { supabase } from '~/lib/supabase/client'
import axios from 'axios'

interface AuthenticatedUser {
    user_id: string
    full_name: string
    email: string
    avatar_url?: string | null
}

export function useAuthenticatedUser() {
    const [user, setUser] = useState<AuthenticatedUser | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchUser = async () => {
            setLoading(true)
            setError(null)
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession()

                const response = await axios.get(`${import.meta.env.VITE_API_V1_BASE_URL}/user`, {
                    headers: {
                        Authorization: `Bearer ${session?.access_token}`,
                        'Content-Type': 'application/json',
                    },
                })

                setUser(response.data)
            } catch (err: any) {
                if (axios.isAxiosError(err) && err.response) {
                    if (err.response.status === 401) {
                        window.location.href = '/'
                    } else {
                        setError(`Error: ${err.response.status} ${err.response.statusText}`)
                    }
                } else {
                    setError(err?.message ?? 'Failed to load user')
                }

                setError(err?.message ?? 'Failed to load user')
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        fetchUser()
    }, [])

    return { user, loading, error }
}

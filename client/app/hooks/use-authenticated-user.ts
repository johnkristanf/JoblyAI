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

        if (!session) {
          setUser(null)
          setLoading(false)
          return
        }

        const response = await axios.get('http://localhost:8000/api/v1/user', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        })

        console.log("response sa hook: ", response);
        

        setUser(response.data)
      } catch (err: any) {
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

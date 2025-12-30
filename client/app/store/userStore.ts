import axios from 'axios'
import { create } from 'zustand'
import { getAccessToken } from '~/lib/supabase/client'
import type { User } from '~/types/user'

interface UserStoreState {
    user: User | null
    loading: boolean
    error: string | null
    setUser: (user: User | null) => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    fetchUser: () => Promise<void>
    updateProfile: (payload: Partial<User>) => Promise<User>
}

export const useUserStore = create<UserStoreState>((set, get) => ({
    user: null,
    loading: false,
    error: null,

    setUser: (user) => set({ user }),

    setLoading: (loading) => set({ loading }),

    setError: (error) => set({ error }),

    fetchUser: async () => {
        const state = get()
        if (state.loading) {
            console.log('Fetch already in progress, skipping...')
            return
        }

        set({ loading: true, error: null })

        const accessToken = await getAccessToken()

        try {
            const res = await axios.get(`${import.meta.env.VITE_API_V1_BASE_URL}/user/profile`, {
                headers: {
                    Authorization: accessToken ? `Bearer ${accessToken}` : '',
                },
            })
            set({ user: res.data })
        } catch (err: any) {
            if (axios.isAxiosError(err) && err.response) {
                if (err.response.status === 401) {
                    window.location.href = '/'
                } else {
                    set({ error: `Error: ${err.response.status} ${err.response.statusText}` })
                }
            } else {
                set({ error: err?.message ?? 'Failed to load user' })
            }
            set({ user: null })
        } finally {
            set({ loading: false })
        }
    },

    updateProfile: async (payload) => {
        set({ loading: true })
        try {
            const accessToken = await getAccessToken() // Add auth header for PATCH as well
            const res = await axios.patch(
                `${import.meta.env.VITE_API_V1_BASE_URL}/user/profile`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    },
                },
            )

            // Update UI instantly -- Typescript fix for set shape
            set((state) => ({
                user: state.user ? { ...state.user, ...payload } : null,
            }))

            return res.data
        } finally {
            set({ loading: false })
        }
    },
}))

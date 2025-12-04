import axios from 'axios';
import { create } from 'zustand';
import type { User } from '~/types/user';

interface UserStoreState {
    user: User | null,
    loading: boolean,
    setUser: (user: User | null) => void,
    setLoading: (loading: boolean) => void,
    refreshUser: () => Promise<void>,
    updateProfile: (payload: Partial<User>) => Promise<User>
}

export const useUserStore = create<UserStoreState>((set) => ({
    user: null,
    loading: false,

    setUser: (user) => set({ user }),

    setLoading: (loading) => set({ loading }),

    refreshUser: async () => {
        set({ loading: true });
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user`, {
                withCredentials: true,
            });
            set({ user: res.data });
        } finally {
            set({ loading: false });
        }
    },

    updateProfile: async (payload) => {
        set({ loading: true });
        try {
            const res = await axios.patch("/users/me", payload);

            // Update UI instantly
            set((state) => ({
                user: { ...state.user, ...payload }
            }));

            return res.data;
        } finally {
            set({ loading: false });
        }
    }
}));
import { Outlet } from 'react-router'
import { AppSidebar } from '~/components/app-sidebar'
import { SidebarProvider, SidebarTrigger } from '~/components/ui/sidebar'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthenticatedUser } from '~/hooks/use-authenticated-user'
import { useUserStore } from '~/store/userStore'
import { useEffect, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { supabase } from '~/lib/supabase/client'

const queryClient = new QueryClient()

export const meta = () => {
    return [{ title: 'JoblyAI' }]
}

export default function AuthenticatedLayout() {
    const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false)
    const { user, fetchUser, setLoading } = useUserStore()

    const handleLogout = async () => {
        setIsLoggingOut(true)
        try {
            await supabase.auth.signOut()
            window.location.href = '/'
        } finally {
            setLoading(false)
        }
    }

    if (isLoggingOut) {
        return (
            <div className="fixed inset-0 bg-white bg-opacity-75 flex flex-col items-center justify-center z-50">
                <svg
                    className="animate-spin h-16 w-16 text-blue-600 mb-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                </svg>
                <div className="text-lg text-blue-700 font-medium">Logging out...</div>
            </div>
        )
    }

    useEffect(() => {
        if (!user) {
            fetchUser()
        }
    }, [user, fetchUser])

    return (
        <QueryClientProvider client={queryClient}>
            <SidebarProvider>
                <AppSidebar />
                <main className="w-full ">
                    <div className="flex justify-between items-center px-5 pt-3">
                        <SidebarTrigger className="mt-2 pl-3 hover:cursor-pointer hover:opacity-75" />

                        {/* Avatar Popover */}
                        <Popover>
                            <PopoverTrigger asChild>
                                {user ? (
                                    user.avatar_url ? (
                                        <img
                                            src={user.avatar_url}
                                            alt={user.full_name}
                                            className="w-9 h-9 rounded-full object-cover border cursor-pointer"
                                        />
                                    ) : (
                                        <div className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-600 text-white font-bold text-lg border cursor-pointer">
                                            {user.full_name?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                    )
                                ) : null}
                            </PopoverTrigger>
                            <PopoverContent
                                sideOffset={8}
                                align="end"
                                className="min-w-[32px] w-54"
                            >
                                <div className="py-2 px-3 border-b mb-2">
                                    <div className="font-medium truncate">{user?.full_name}</div>
                                    <div className="text-xs text-muted-foreground break-all truncate">
                                        {user?.email}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <a
                                        href="/profile"
                                        className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 hover:cursor-pointer rounded transition text-sm flex items-center gap-2"
                                    >
                                        Profile
                                    </a>
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 hover:cursor-pointer rounded transition text-sm flex items-center gap-2 text-left"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <Outlet />
                </main>
            </SidebarProvider>
        </QueryClientProvider>
    )
}

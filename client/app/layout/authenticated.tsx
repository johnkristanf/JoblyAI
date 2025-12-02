import { Outlet } from 'react-router'
import { AppSidebar } from '~/components/app-sidebar'
import { SidebarProvider, SidebarTrigger } from '~/components/ui/sidebar'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '~/lib/supabase/client'
import axios from 'axios'

const queryClient = new QueryClient()

export const meta = () => {
    return [{ title: 'JoblyAI' }]
}

export default function AuthenticatedLayout() {
    const callProtectedAPI = async () => {
        // Get current session token
        const {
            data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
            return
        }

        supabase.auth.updateUser

        console.log('session: ', session)

        try {
            const response = await axios.get('http://localhost:8000/api/v1/user', {
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
            })

            console.log('response user: ', response)

            // You can use response.data to access the response payload
        } catch (error) {
            // You can handle axios errors here, e.g.
            // if (axios.isAxiosError(error)) { ... }
        }
    }

    callProtectedAPI()
    return (
        <QueryClientProvider client={queryClient}>
            <SidebarProvider>
                <AppSidebar />
                <main className="w-full ">
                    <SidebarTrigger className="mt-2 pl-3 hover:cursor-pointer hover:opacity-75" />
                    <Outlet />
                </main>
            </SidebarProvider>
        </QueryClientProvider>
    )
}

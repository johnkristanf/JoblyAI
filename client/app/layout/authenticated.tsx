import { Outlet } from 'react-router'
import { AppSidebar } from '~/components/app-sidebar'
import { SidebarProvider, SidebarTrigger } from '~/components/ui/sidebar'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '~/lib/supabase/client'
import axios from 'axios'
import { useAuthenticatedUser } from '~/hooks/use-authenticated-user'

const queryClient = new QueryClient()

export const meta = () => {
    return [{ title: 'JoblyAI' }]
}

export default function AuthenticatedLayout() {
  const { user, loading, error } = useAuthenticatedUser();

  console.log("user na hooked: ", user);
  

    return (
        <QueryClientProvider client={queryClient}>
            <SidebarProvider>
                <AppSidebar />
                <main className="w-full ">

                    <div className="flex justify-between items-center px-5 ">
                        <SidebarTrigger className="mt-2 pl-3 hover:cursor-pointer hover:opacity-75" />
                        <h1>sdfsdf</h1>
                    </div>
                    
                    <Outlet />
                </main>
            </SidebarProvider>
        </QueryClientProvider>
    )
}

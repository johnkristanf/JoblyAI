import { Outlet } from 'react-router'
import { AppSidebar } from '~/components/app-sidebar'
import { SidebarProvider, SidebarTrigger } from '~/components/ui/sidebar'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

export const meta = () => {
    return [{ title: 'JoblyAI' }]
}

export default function AuthenticatedLayout() {
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

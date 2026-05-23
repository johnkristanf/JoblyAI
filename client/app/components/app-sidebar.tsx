import { BookmarkCheck, BriefcaseBusiness, FileUser, MapPin } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
} from '~/components/ui/sidebar'

export function AppSidebar() {
    const { pathname } = useLocation()

    return (
        <Sidebar>
            <SidebarHeader>
                <div className="flex items-center ">
                    <div className=" flex aspect-square size-8 items-center justify-center rounded-lg">
                        <MapPin className="text-blue-600" size={25} />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium text-blue-600">JoblyAI</span>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Projects</SidebarGroupLabel>

                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton className="font-semibold text-sidebar-foreground/70 mb-1 cursor-default pointer-events-none">
                                <BriefcaseBusiness className="size-4" />{' '}
                                <span className="text-sm">Job Search</span>
                            </SidebarMenuButton>
                            <SidebarMenuSub>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild isActive={pathname === '/job/search/query'} className="cursor-pointer">
                                        <Link to="/job/search/query">
                                            <span className="text-xs">Query</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild isActive={pathname === '/job/search/resume-matching'} className="cursor-pointer">
                                        <Link to="/job/search/resume-matching">
                                            <span className="text-xs">Resume Matching</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            </SidebarMenuSub>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname === '/saved/jobs'} className="cursor-pointer">
                                <Link to="/saved/jobs">
                                    <BookmarkCheck className="size-4" />{' '}
                                    <span className="text-xs">Saved Jobs</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname === '/resume'} className="cursor-pointer">
                                <Link to="/resume">
                                    <FileUser className="size-4" />{' '}
                                    <span className="text-xs">Resume</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter />
        </Sidebar>
    )
}

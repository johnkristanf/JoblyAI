import { BookmarkCheck, BriefcaseBusiness, FileUser, MapPin, Sparkles } from 'lucide-react'
import { NavLink } from 'react-router'
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
                                    <NavLink to="/job/search/query">
                                        {({ isActive }) => (
                                            <SidebarMenuSubButton isActive={isActive} className="cursor-pointer">
                                                <span className="text-xs">Query</span>
                                            </SidebarMenuSubButton>
                                        )}
                                    </NavLink>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                    <NavLink to="/job/search/resume-matching">
                                        {({ isActive }) => (
                                            <SidebarMenuSubButton isActive={isActive} className="cursor-pointer">
                                                <span className="text-xs">Resume Matching</span>
                                            </SidebarMenuSubButton>
                                        )}
                                    </NavLink>
                                </SidebarMenuSubItem>
                            </SidebarMenuSub>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <NavLink to="/saved/jobs">
                                {({ isActive }) => (
                                    <SidebarMenuButton isActive={isActive} className="cursor-pointer">
                                        <BookmarkCheck className="size-4" />{' '}
                                        <span className="text-xs">Saved Jobs</span>
                                    </SidebarMenuButton>
                                )}
                            </NavLink>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <NavLink to="/resume">
                                {({ isActive }) => (
                                    <SidebarMenuButton isActive={isActive} className="cursor-pointer">
                                        <FileUser className="size-4" />{' '}
                                        <span className="text-xs">Resume</span>
                                    </SidebarMenuButton>
                                )}
                            </NavLink>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter />
        </Sidebar>
    )
}

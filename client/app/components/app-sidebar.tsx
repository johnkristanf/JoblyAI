import { BookmarkCheck, BriefcaseBusiness, FileUser, MapPin } from 'lucide-react'
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
                            <SidebarMenuButton>
                                <NavLink to="/job/search" className="flex items-center gap-1 ">
                                    <BriefcaseBusiness className="size-4" />{' '}
                                    <span className="text-xs">Job Search</span>
                                </NavLink>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <SidebarMenuButton>
                                <NavLink to="/saved/jobs" className="flex items-center gap-1">
                                    <BookmarkCheck className="size-4" />{' '}
                                    <span className="text-xs">Saved Jobs</span>
                                </NavLink>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter />
        </Sidebar>
    )
}

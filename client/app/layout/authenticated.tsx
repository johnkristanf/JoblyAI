import { Outlet } from "react-router";
import { AppSidebar } from "~/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";

export default function AuthenticatedLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarTrigger className="mt-2 pl-3" />
      <main>
        <Outlet />
      </main>
    </SidebarProvider>
  );
}

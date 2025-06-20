"use client";

import { HardDrive } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { APP_CONFIG } from "@/config/app-config";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";

import { NavMain } from "./nav-main";
import { AuthNavUser } from "./auth-nav-user";

// Placeholder for the TimezoneSelector component
function TimezoneSelector() {
  return <div>Timezone Selector (To be implemented)</div>;
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="/dashboard/drive">
                <HardDrive className="h-5 w-5" />
                <span className="text-base font-semibold truncate">{APP_CONFIG.name}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarItems} />
      </SidebarContent>
      <SidebarFooter>
        <div className="px-3 py-2 border-t">
          <TimezoneSelector />
        </div>
        <AuthNavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
'use client'

import { HardDrive } from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { APP_CONFIG } from '@/shared/constants/app-constants'
import { sidebarItems } from '@/features/navigation/components/sidebar/sidebar-items'

import { NavMain } from './nav-main'
import { AuthNavUser } from './auth-nav-user'

// Timezone is now auto-detected in the background via TimezoneProvider

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard/drive">
                <HardDrive className="h-5 w-5" />
                <span className="truncate text-base font-semibold">
                  {APP_CONFIG.name}
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarItems} />
      </SidebarContent>
      <SidebarFooter>
        <AuthNavUser />
      </SidebarFooter>
    </Sidebar>
  )
}

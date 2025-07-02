'use client'

import { ReactNode } from 'react'

import { AuthWrapper } from '@/components/auth/auth-wrapper'
import { AppSidebar } from '@/app/(main)/dashboard/_components/sidebar/AppSidebar'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

import { ThemeSwitcher } from './_components/sidebar/ThemeSwitcher'

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <AuthWrapper
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-semibold">Authentication Required</h1>
            <p className="text-muted-foreground mb-4">Please sign in to access the dashboard</p>
            <a href="/auth/v1/login" className="text-primary hover:underline">
              Go to Login
            </a>
          </div>
        </div>
      }
    >
      <SidebarProvider defaultOpen={true}>
        <AppSidebar variant="sidebar" collapsible="icon" />
        <SidebarInset className="!mx-auto max-w-screen-2xl">
          <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 flex h-14 shrink-0 items-center gap-2 border-b backdrop-blur">
            <div className="flex w-full items-center justify-between px-4 lg:px-6">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mx-2 h-4" />
                <h1 className="text-foreground text-lg font-semibold">Google Drive Manager</h1>
              </div>
              <div className="flex items-center gap-2">
                <ThemeSwitcher />
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-auto p-4 md:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </AuthWrapper>
  )
}

"use client"

import { BarChart3, FileText, FolderOpen, Settings, Share2, Trash2 } from "lucide-react"

export interface SidebarItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  isActive?: boolean
  items?: SidebarItem[]
}

export const sidebarItems: SidebarItem[] = [
  {
    title: "Drive Manager",
    url: "/dashboard/drive",
    icon: FolderOpen,
  },
  {
    title: "Analytics",
    url: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Shared Files",
    url: "/dashboard/shared",
    icon: Share2,
  },
  {
    title: "Trash",
    url: "/dashboard/trash",
    icon: Trash2,
  },
  {
    title: "Reports",
    url: "/dashboard/reports",
    icon: FileText,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
]
/**
 * Type definitions and data for sidebar navigation items
 */
import { LucideIcon } from 'lucide-react'
import { Home, FolderOpen, Search, Upload, Share2, Trash2, Settings, BarChart3, Users, Archive, Cloud, Download } from 'lucide-react'

export interface NavMainItem {
  title: string
  url: string
  icon?: LucideIcon
  comingSoon?: boolean
  newTab?: boolean
  subItems?: NavMainItem[]
}

export interface NavGroup {
  id: string
  label?: string
  items?: NavMainItem[]
}

export interface SidebarData {
  navMain: NavGroup[]
}

export const sidebarItems: SidebarData = {
  navMain: [
    {
      id: 'main',
      label: 'Main',
      items: [
        {
          title: 'Dashboard',
          url: '/dashboard',
          icon: Home,
        },
        {
          title: 'Drive Manager',
          url: '/dashboard/drive',
          icon: FolderOpen,
        },
        {
          title: 'Search',
          url: '/dashboard/search',
          icon: Search,
          comingSoon: true,
        },
      ],
    },
    {
      id: 'operations',
      label: 'Operations',
      items: [
        {
          title: 'Upload',
          url: '/dashboard/upload',
          icon: Upload,
          comingSoon: true,
        },
        {
          title: 'Share & Export',
          url: '/dashboard/share',
          icon: Share2,
          comingSoon: true,
        },
        {
          title: 'Trash',
          url: '/dashboard/trash',
          icon: Trash2,
          comingSoon: true,
        },
        {
          title: 'Archive',
          url: '/dashboard/archive',
          icon: Archive,
          comingSoon: true,
        },
      ],
    },
    {
      id: 'analytics',
      label: 'Analytics',
      items: [
        {
          title: 'Storage Analytics',
          url: '/dashboard/analytics',
          icon: BarChart3,
          comingSoon: true,
        },
        {
          title: 'Activity',
          url: '/dashboard/activity',
          icon: Cloud,
          comingSoon: true,
        },
        {
          title: 'Downloads',
          url: '/dashboard/downloads',
          icon: Download,
          comingSoon: true,
        },
      ],
    },
    {
      id: 'management',
      label: 'Management',
      items: [
        {
          title: 'Team',
          url: '/dashboard/team',
          icon: Users,
          comingSoon: true,
        },
        {
          title: 'Settings',
          url: '/dashboard/settings',
          icon: Settings,
          comingSoon: true,
        },
      ],
    },
  ],
}

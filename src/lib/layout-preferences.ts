export type SidebarVariant = 'default' | 'floating' | 'inset';
export type SidebarCollapsible = 'offcanvas' | 'icon' | 'none';
export type ContentLayout = 'sidebar' | 'navbar';

export interface LayoutPreferences {
  sidebarVariant: SidebarVariant;
  sidebarCollapsible: SidebarCollapsible;
  contentLayout: ContentLayout;
}

export const defaultLayoutPreferences: LayoutPreferences = {
  sidebarVariant: 'default',
  sidebarCollapsible: 'icon',
  contentLayout: 'sidebar'
};
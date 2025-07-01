import { ReactNode } from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { CustomThemeProvider } from '@/components/providers/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/components/providers/auth-provider'
import { TimezoneProvider } from '@/components/timezone-provider'
import { ErrorBoundary } from '@/components/error-boundary'
import { APP_CONFIG } from '@/config/app-config'

import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Google Drive Pro - Professional Drive Management',
  description: 'Advanced Google Drive management application with enterprise features',
  keywords: [
    'Professional Google Drive',
    'Enterprise File Management',
    'Document Management',
    'Cloud Storage',
    'Business Solutions',
    'Next.js',
    'React',
  ],
  authors: [{ name: 'Professional Google Drive Management Team' }],
  creator: 'Professional Google Drive Management',
  publisher: 'Professional Google Drive Management',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://professional-drive-manager.replit.app',
    title: 'Google Drive Pro',
    description: 'Professional Google Drive Management',
    siteName: APP_CONFIG.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Google Drive Pro',
    description: 'Professional Google Drive Management',
  },
  icons: {
    icon: [
      {
        url: '/favicon.png',
        type: 'image/png',
        sizes: '32x32',
      },
      {
        url: '/icon.png',
        type: 'image/png',
        sizes: '192x192',
      },
    ],
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`${inter.className} min-h-screen overflow-x-hidden antialiased`}>
        <ErrorBoundary>
          <AuthProvider>
            <CustomThemeProvider>
              <TimezoneProvider>
                <div className="relative min-h-screen w-full">{children}</div>
                <Toaster />
              </TimezoneProvider>
            </CustomThemeProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}

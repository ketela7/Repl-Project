import { ReactNode } from "react";

import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/providers/auth-provider";
import { TimezoneProvider } from "@/components/timezone-provider";
import { APP_CONFIG } from "@/config/app-config";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: APP_CONFIG.meta.title,
  description: APP_CONFIG.meta.description,
  keywords: ["Professional Google Drive", "Enterprise File Management", "Document Management", "Cloud Storage", "Business Solutions", "Next.js", "React"],
  authors: [{ name: "Professional Google Drive Management Team" }],
  creator: "Professional Google Drive Management",
  publisher: "Professional Google Drive Management",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://professional-drive-manager.replit.app",
    title: APP_CONFIG.meta.title,
    description: APP_CONFIG.meta.description,
    siteName: APP_CONFIG.name,
  },
  twitter: {
    card: "summary_large_image",
    title: APP_CONFIG.meta.title,
    description: APP_CONFIG.meta.description,
  },
  icons: {
    icon: [
      {
        url: "/favicon.png",
        type: "image/png",
        sizes: "32x32",
      },
      {
        url: "/icon.png",
        type: "image/png",
        sizes: "192x192",
      },
    ],
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },

};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`${inter.className} min-h-screen antialiased overflow-x-hidden`}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange enableSystem={false}>
            <TimezoneProvider>
              <div className="relative min-h-screen w-full">
                {children}
              </div>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    border: '1px solid hsl(var(--border))',
                  },
                }}
              />
            </TimezoneProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
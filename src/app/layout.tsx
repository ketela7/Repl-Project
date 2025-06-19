import { ReactNode } from "react";

import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/sonner";
import { ConfigProvider } from "@/components/providers/config-provider";
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
  const config = {
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY!,
  };

  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange enableSystem={false}>
          <ConfigProvider config={config}>
            {children}
          </ConfigProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

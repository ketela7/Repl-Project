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
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const config = {
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY!,
    turnstileSiteKey: process.env.TURNSTILE_SITE_KEY!,
    appEnv: process.env.NODE_ENV || 'development',
    baseUrl: process.env.REPLIT_DOMAINS?.split(',')[0] ? 
      `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 
      `http://localhost:${process.env.PORT || '3000'}`,
    isDevelopment: process.env.NODE_ENV === 'development',
    version: process.env.npm_package_version || '1.0.0',
  };

  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen antialiased bg-background text-foreground`}>
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

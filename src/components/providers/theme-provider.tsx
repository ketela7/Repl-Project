'use client'

import { ThemeProvider } from 'next-themes'
import { ReactNode } from 'react'

interface ThemeProviderProps {
  children: ReactNode
}

export function CustomThemeProvider({ children }: ThemeProviderProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  )
}

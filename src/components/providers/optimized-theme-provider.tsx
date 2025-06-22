"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";

interface OptimizedThemeProviderProps {
  children: ReactNode;
}

export function OptimizedThemeProvider({ children }: OptimizedThemeProviderProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
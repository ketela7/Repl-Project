"use client";

import { SessionProviderWrapper } from "@/components/optimized-session-provider";
import { ReactNode } from "react";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return <SessionProviderWrapper>{children}</SessionProviderWrapper>;
}
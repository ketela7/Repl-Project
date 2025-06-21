"use client";

import { useSession } from "next-auth/react";
import { ReactNode } from "react";

interface AuthWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthWrapper({ children, fallback }: AuthWrapperProps) {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (status === "unauthenticated" && fallback) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
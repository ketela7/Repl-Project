"use client";

import { useSession } from "next-auth/react";
import { ReactNode } from "react";

interface AuthWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthWrapper({ children, fallback }: AuthWrapperProps) {
  const { data: session, status } = useSession();

  console.log("[AuthWrapper] Status:", status, "Session:", !!session);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    console.log("[AuthWrapper] Unauthenticated, showing fallback");
    if (fallback) {
      return <>{fallback}</>;
    }
    // Redirect to login if no fallback provided
    window.location.href = '/auth/v1/login';
    return null;
  }

  if (status === "authenticated" && session) {
    console.log("[AuthWrapper] Authenticated, showing children");
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
    </div>
  );
}
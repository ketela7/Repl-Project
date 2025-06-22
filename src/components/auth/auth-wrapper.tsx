"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

interface AuthWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthWrapper({ children, fallback }: AuthWrapperProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  console.log("[AuthWrapper] Status:", status, "Session:", !!session);

  useEffect(() => {
    if (status === "unauthenticated" && !fallback) {
      router.push('/auth/v1/login');
    }
  }, [status, fallback, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-2"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    console.log("[AuthWrapper] Unauthenticated, showing fallback");
    if (fallback) {
      return <>{fallback}</>;
    }
    // Show access denied message
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p>Access denied. Please sign in.</p>
        </div>
      </div>
    );
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
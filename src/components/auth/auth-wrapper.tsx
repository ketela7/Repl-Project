"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

interface AuthWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthWrapper({ children, fallback }: AuthWrapperProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isServerOnline, setIsServerOnline] = useState(true);
  const [hasStoredSession, setHasStoredSession] = useState(false);

  // Remove console.log for production performance
  // console.log("[AuthWrapper] Status:", status, "Session:", !!session);

  // Check if user has stored session data (indicating they were previously logged in)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const nextAuthSession = localStorage.getItem('next-auth.session-token') || 
                              localStorage.getItem('__Secure-next-auth.session-token') ||
                              document.cookie.includes('next-auth.session-token') ||
                              document.cookie.includes('__Secure-next-auth.session-token');
      setHasStoredSession(!!nextAuthSession);
    }
  }, []);

  // Check server connectivity when status is unauthenticated
  useEffect(() => {
    if (status === "unauthenticated" && hasStoredSession) {
      const checkServerStatus = async () => {
        try {
          const response = await fetch('/api/health', {
            method: 'HEAD',
            cache: 'no-cache',
            signal: AbortSignal.timeout(5000)
          });
          
          if (!response.ok) {
            setIsServerOnline(false);
            router.push('/server-offline');
            return;
          }
          
          setIsServerOnline(true);
          // If server is online but user is unauthenticated, redirect to login
          if (!fallback) {
            router.push('/auth/v1/login');
          }
        } catch (error) {
          setIsServerOnline(false);
          router.push('/server-offline');
        }
      };

      checkServerStatus();
    } else if (status === "unauthenticated" && !hasStoredSession && !fallback) {
      // No stored session and unauthenticated - direct to login
      router.push('/auth/v1/login');
    }
  }, [status, fallback, router, hasStoredSession]);

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
    console.log("[AuthWrapper] Unauthenticated, checking server status...");
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // If we have stored session but are unauthenticated, likely server issue
    if (hasStoredSession && !isServerOnline) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-2"></div>
            <p>Checking server connection...</p>
          </div>
        </div>
      );
    }
    
    // Show access denied message for users without stored session
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
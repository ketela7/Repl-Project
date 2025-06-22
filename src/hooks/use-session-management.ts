
'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useCallback } from 'react';

export function useSessionManagement() {
  const { data: session, update } = useSession();

  // Sync remember me preference from localStorage to session
  const syncRememberMePreference = useCallback(async () => {
    if (typeof window !== 'undefined' && session) {
      const storedRememberMe = localStorage.getItem('rememberMe') === 'true';
      
      // Update session if preference differs or if it's undefined
      if (session.rememberMe !== storedRememberMe) {
        await update({ rememberMe: storedRememberMe });
      }
    }
  }, [session, update]);

  // Initial sync when session loads
  useEffect(() => {
    syncRememberMePreference();
  }, [syncRememberMePreference]);

  // Monitor session expiration with optimized frequency
  useEffect(() => {
    if (session) {
      // Reduce frequency to every 4 hours for less API overhead
      const checkInterval = setInterval(async () => {
        try {
          // Only check if tab is visible to reduce unnecessary calls
          if (!document.hidden) {
            const response = await fetch('/api/auth/session');
            if (!response.ok) {
              signOut({ callbackUrl: '/auth/v1/login' });
            }
          }
        } catch (error) {
          console.error("[Session Management] Session check error:", error);
        }
      }, 4 * 60 * 60 * 1000); // Check every 4 hours

      return () => clearInterval(checkInterval);
    }
  }, [session]);

  // Function to update remember me preference
  const updateRememberMe = useCallback(async (rememberMe: boolean) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('rememberMe', rememberMe.toString());
      
      if (session) {
        await update({ rememberMe });
      }
    }
  }, [session, update]);

  return {
    session,
    isRememberMeEnabled: session?.rememberMe || false,
    updateRememberMe,
    syncRememberMePreference
  };
}

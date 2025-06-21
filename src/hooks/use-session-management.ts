
'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useCallback } from 'react';

export function useSessionManagement() {
  const { data: session, update } = useSession();

  // Sync remember me preference from localStorage to session
  const syncRememberMePreference = useCallback(async () => {
    if (typeof window !== 'undefined' && session) {
      const storedRememberMe = localStorage.getItem('rememberMe') === 'true';
      
      console.log("[Session Management] DEBUG - localStorage 'rememberMe':", localStorage.getItem('rememberMe'));
      console.log("[Session Management] DEBUG - storedRememberMe (parsed):", storedRememberMe);
      console.log("[Session Management] DEBUG - session.rememberMe:", session.rememberMe);
      
      // Update session if preference differs or if it's undefined
      if (session.rememberMe !== storedRememberMe) {
        console.log("[Session Management] Syncing remember me preference from localStorage:", storedRememberMe);
        console.log("[Session Management] Current session rememberMe:", session.rememberMe);
        await update({ rememberMe: storedRememberMe });
      } else {
        console.log("[Session Management] Remember me preference already in sync");
      }
    }
  }, [session, update]);

  // Initial sync when session loads
  useEffect(() => {
    syncRememberMePreference();
  }, [syncRememberMePreference]);

  // Monitor session expiration based on JWT token expiration
  useEffect(() => {
    if (session) {
      const rememberMe = session.rememberMe || false;
      console.log("[Session Management] Session active, remember me:", rememberMe);
      
      // Check session validity periodically instead of client-side timeout
      const checkInterval = setInterval(async () => {
        try {
          const response = await fetch('/api/auth/session');
          if (!response.ok) {
            console.log("[Session Management] Session check failed, signing out");
            signOut({ callbackUrl: '/auth/v1/login' });
          }
        } catch (error) {
          console.error("[Session Management] Session check error:", error);
        }
      }, 60 * 60 * 1000); // Check every hour

      return () => clearInterval(checkInterval);
    }
  }, [session]);

  // Function to update remember me preference
  const updateRememberMe = useCallback(async (rememberMe: boolean) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('rememberMe', rememberMe.toString());
      console.log("[Session Management] Updated localStorage rememberMe:", rememberMe);
      
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


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
        console.log("[Session Management] Syncing remember me preference:", storedRememberMe);
        await update({ rememberMe: storedRememberMe });
      }
    }
  }, [session, update]);

  // Initial sync when session loads
  useEffect(() => {
    syncRememberMePreference();
  }, [syncRememberMePreference]);

  // Set up automatic session timeout based on remember me preference
  useEffect(() => {
    if (session) {
      const rememberMe = session.rememberMe || false;
      const timeoutDuration = rememberMe 
        ? 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
        : 24 * 60 * 60 * 1000; // 1 day in milliseconds

      console.log("[Session Management] Setting session timeout:", rememberMe ? "30 days" : "1 day");

      const timeoutId = setTimeout(() => {
        console.log("[Session Management] Session expired, signing out");
        signOut({ callbackUrl: '/auth/v1/login' });
      }, timeoutDuration);

      return () => clearTimeout(timeoutId);
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


'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect } from 'react';

export function useSessionManagement() {
  const { data: session, update } = useSession();

  useEffect(() => {
    // Check if remember me preference exists in localStorage
    if (typeof window !== 'undefined') {
      const rememberMe = localStorage.getItem('rememberMe') === 'true';
      
      // Update session with remember me preference if it's different
      if (session && session.rememberMe !== rememberMe) {
        update({ rememberMe });
      }
    }
  }, [session, update]);

  useEffect(() => {
    // Set up session timeout based on remember me preference
    if (session) {
      const rememberMe = session.rememberMe || false;
      const timeoutDuration = rememberMe 
        ? 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
        : 24 * 60 * 60 * 1000; // 1 day in milliseconds

      const timeoutId = setTimeout(() => {
        // Auto sign out when session expires
        signOut({ callbackUrl: '/auth/v1/login' });
      }, timeoutDuration);

      return () => clearTimeout(timeoutId);
    }
  }, [session]);

  return {
    session,
    isRememberMeEnabled: session?.rememberMe || false
  };
}

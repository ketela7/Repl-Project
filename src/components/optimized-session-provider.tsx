'use client';

import { SessionProvider, useSession as useNextAuthSession } from 'next-auth/react';
import { createContext, useContext, useCallback, useRef, useEffect, useState, ReactNode } from 'react';
import type { Session } from 'next-auth';

interface OptimizedSessionContextType {
  session: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  update: () => Promise<Session | null>;
}

const OptimizedSessionContext = createContext<OptimizedSessionContextType | undefined>(undefined);

interface SessionCache {
  data: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  timestamp: number;
  ttl: number;
}

/**
 * Optimized Session Provider that reduces redundant session calls
 * Implements intelligent caching and request deduplication
 */
export function OptimizedSessionProvider({ children }: { children: ReactNode }) {
  const cacheRef = useRef<SessionCache | null>(null);
  const pendingRequestRef = useRef<Promise<Session | null> | null>(null);
  const lastUpdateRef = useRef<number>(0);
  
  // Session cache TTL - 5 minutes for optimal balance
  const SESSION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  // Minimum interval between updates - prevents rapid successive calls
  const MIN_UPDATE_INTERVAL = 1000; // 1 second
  
  const { data: nextAuthSession, status: nextAuthStatus, update: nextAuthUpdate } = useNextAuthSession();
  
  // Update cache when NextAuth session changes
  useEffect(() => {
    if (nextAuthSession !== undefined || nextAuthStatus !== 'loading') {
      cacheRef.current = {
        data: nextAuthSession || null,
        status: nextAuthStatus,
        timestamp: Date.now(),
        ttl: SESSION_CACHE_TTL
      };
    }
  }, [nextAuthSession, nextAuthStatus]);
  
  const isCacheValid = useCallback((): boolean => {
    if (!cacheRef.current) return false;
    
    const age = Date.now() - cacheRef.current.timestamp;
    return age < cacheRef.current.ttl;
  }, []);
  
  const update = useCallback(async (): Promise<Session | null> => {
    const now = Date.now();
    
    // Throttle updates to prevent rapid successive calls
    if (now - lastUpdateRef.current < MIN_UPDATE_INTERVAL) {
      console.log('[Session] Throttling session update - too frequent');
      return cacheRef.current?.data || null;
    }
    
    // Return existing pending request if one is in progress
    if (pendingRequestRef.current) {
      console.log('[Session] Returning existing pending session request');
      return pendingRequestRef.current;
    }
    
    // Use cache if valid
    if (isCacheValid()) {
      console.log('[Session] Using cached session data');
      return cacheRef.current!.data;
    }
    
    console.log('[Session] Fetching fresh session data');
    lastUpdateRef.current = now;
    
    // Create new request and cache the promise
    pendingRequestRef.current = nextAuthUpdate().then((result) => {
      // Update cache with fresh data
      cacheRef.current = {
        data: result,
        status: result ? 'authenticated' : 'unauthenticated',
        timestamp: Date.now(),
        ttl: SESSION_CACHE_TTL
      };
      
      // Clear pending request
      pendingRequestRef.current = null;
      
      return result;
    }).catch((error) => {
      console.error('[Session] Error updating session:', error);
      
      // Clear pending request on error
      pendingRequestRef.current = null;
      
      // Return cached data if available, otherwise null
      return cacheRef.current?.data || null;
    });
    
    return pendingRequestRef.current;
  }, [nextAuthUpdate, isCacheValid]);
  
  const contextValue: OptimizedSessionContextType = {
    session: nextAuthSession || null,
    status: nextAuthStatus,
    update
  };
  
  return (
    <OptimizedSessionContext.Provider value={contextValue}>
      {children}
    </OptimizedSessionContext.Provider>
  );
}

/**
 * Optimized useSession hook that implements intelligent session caching
 * Reduces redundant API calls while maintaining session freshness
 */
export function useOptimizedSession() {
  const context = useContext(OptimizedSessionContext);
  const fallbackSession = useNextAuthSession();
  
  if (!context) {
    // Fallback to NextAuth session if OptimizedSessionProvider is not used
    console.warn('[Session] OptimizedSessionProvider not found, falling back to NextAuth session');
    return fallbackSession;
  }
  
  return {
    data: context.session,
    status: context.status,
    update: context.update
  };
}

/**
 * Wrapper component that provides both NextAuth and optimized session context
 */
export function SessionProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <OptimizedSessionProvider>
        {children}
      </OptimizedSessionProvider>
    </SessionProvider>
  );
}
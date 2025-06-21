
'use client';

/**
 * Session duration constants
 */
export const SESSION_DURATIONS = {
  DEFAULT: 24 * 60 * 60, // 1 day in seconds
  REMEMBER_ME: 30 * 24 * 60 * 60, // 30 days in seconds
} as const;

/**
 * Get session duration based on remember me preference
 */
export function getSessionDuration(rememberMe: boolean): number {
  return rememberMe ? SESSION_DURATIONS.REMEMBER_ME : SESSION_DURATIONS.DEFAULT;
}

/**
 * Get remember me preference from localStorage
 */
export function getRememberMePreference(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('rememberMe') === 'true';
}

/**
 * Set remember me preference in localStorage
 */
export function setRememberMePreference(rememberMe: boolean): void {
  if (typeof window === 'undefined') {
    console.log("[Session Utils] Window undefined, cannot set localStorage");
    return;
  }
  
  try {
    localStorage.setItem('rememberMe', rememberMe.toString());
    console.log("[Session Utils] Successfully set rememberMe to localStorage:", rememberMe);
    
    // Verify it was set
    const stored = localStorage.getItem('rememberMe');
    console.log("[Session Utils] Verification - localStorage now contains:", stored);
  } catch (error) {
    console.error("[Session Utils] Failed to set localStorage:", error);
  }
}

/**
 * Calculate session expiration time
 */
export function calculateSessionExpiration(rememberMe: boolean): Date {
  const now = new Date();
  const duration = getSessionDuration(rememberMe) * 1000; // Convert to milliseconds
  return new Date(now.getTime() + duration);
}

/**
 * Check if session has expired
 */
export function isSessionExpired(expirationTime: Date): boolean {
  return new Date() > expirationTime;
}

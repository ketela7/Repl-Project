/**
 * URL utilities for handling domain-agnostic routing
 * Supports custom domains, Replit domains, and localhost
 */

/**
 * Get the base URL for the application
 * Priority: NEXTAUTH_URL > current window origin > fallback
 */
export function getBaseUrl(): string {
  // Server-side: use NEXTAUTH_URL
  if (typeof window === 'undefined') {
    return process.env.NEXTAUTH_URL || 'http://localhost:5000';
  }
  
  // Client-side: use current origin
  return window.location.origin;
}

/**
 * Create an absolute URL from a relative path
 */
export function createAbsoluteUrl(path: string): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Redirect to a path using the correct base URL
 * For client-side redirects
 */
export function redirectTo(path: string): void {
  if (typeof window !== 'undefined') {
    window.location.href = createAbsoluteUrl(path);
  }
}

/**
 * Get base URL for server-side redirects
 * Uses NEXTAUTH_URL or extracts from request URL
 */
export function getServerBaseUrl(requestUrl?: string): string {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  
  if (requestUrl) {
    const url = new URL(requestUrl);
    return url.origin;
  }
  
  return 'http://localhost:5000';
}

/**
 * Create URL for server-side redirects
 */
export function createServerRedirectUrl(path: string, requestUrl?: string): string {
  const baseUrl = getServerBaseUrl(requestUrl);
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}
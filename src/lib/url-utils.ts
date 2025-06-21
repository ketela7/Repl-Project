/**
 * URL utilities for handling domain-agnostic routing
 * Uses BASE_URL as the core environment variable with platform auto-detection
 */

import { config } from './config';

/**
 * Get the base URL for the application
 * Priority: BASE_URL > platform detection > current window origin > fallback
 */
export function getBaseUrl(): string {
  // Server-side: use detected base URL from config
  if (typeof window === 'undefined') {
    return config.app.baseUrl;
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
 * Uses BASE_URL detection with request URL fallback
 */
export function getServerBaseUrl(requestUrl?: string): string {
  // Use detected base URL from config first
  const detectedBaseUrl = config.app.baseUrl;
  if (detectedBaseUrl && detectedBaseUrl !== 'http://localhost:5000') {
    return detectedBaseUrl;
  }
  
  // Fallback to request URL origin
  if (requestUrl) {
    try {
      const url = new URL(requestUrl);
      return url.origin;
    } catch (error) {
      console.warn('Invalid request URL:', requestUrl);
    }
  }
  
  // Final fallback
  return detectedBaseUrl || 'http://localhost:5000';
}

/**
 * Create URL for server-side redirects
 */
export function createServerRedirectUrl(path: string, requestUrl?: string): string {
  const baseUrl = getServerBaseUrl(requestUrl);
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}
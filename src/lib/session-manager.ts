/**
 * Advanced session management to prevent timeouts during operations
 * Implements proactive session refresh and activity tracking
 */

import { getSession, signOut } from 'next-auth/react';

interface SessionConfig {
  refreshThreshold: number; // Minutes before expiry to refresh
  maxInactivity: number; // Minutes of inactivity before warning
  warningDuration: number; // Seconds to show warning before logout
}

const DEFAULT_CONFIG: SessionConfig = {
  refreshThreshold: 30, // Refresh 30 minutes before expiry
  maxInactivity: 60, // Warn after 60 minutes of inactivity
  warningDuration: 60, // 60 second warning
};

class SessionManager {
  private config: SessionConfig;
  private lastActivity: number = Date.now();
  private refreshTimer: NodeJS.Timeout | null = null;
  private inactivityTimer: NodeJS.Timeout | null = null;
  private warningTimeout: NodeJS.Timeout | null = null;
  private isRefreshing: boolean = false;
  private listeners: Set<(event: SessionEvent) => void> = new Set();

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.setupActivityTracking();
  }

  /**
   * Initialize session management
   */
  async initialize(): Promise<void> {
    await this.checkAndRefreshSession();
    this.scheduleNextRefresh();
    this.resetInactivityTimer();
  }

  /**
   * Proactively refresh session if needed
   */
  async checkAndRefreshSession(): Promise<boolean> {
    if (this.isRefreshing) return true;

    try {
      this.isRefreshing = true;
      const session = await getSession();
      
      if (!session) {
        this.emit('sessionExpired');
        return false;
      }

      // Check if session needs refresh (simplified - would need token expiry info)
      const now = Date.now();
      const sessionAge = now - (session.expires ? new Date(session.expires).getTime() : now);
      const refreshThresholdMs = this.config.refreshThreshold * 60 * 1000;

      if (sessionAge > refreshThresholdMs) {
        console.log('[SessionManager] Proactively refreshing session');
        // Trigger session refresh by calling getSession again
        const refreshedSession = await getSession();
        
        if (refreshedSession) {
          this.emit('sessionRefreshed');
          return true;
        } else {
          this.emit('sessionExpired');
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('[SessionManager] Session check failed:', error);
      this.emit('sessionError', error);
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Track user activity to reset inactivity timer
   */
  private setupActivityTracking(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      this.recordActivity();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });
  }

  /**
   * Record user activity
   */
  recordActivity(): void {
    this.lastActivity = Date.now();
    this.resetInactivityTimer();
    
    // Clear any existing warning
    if (this.warningTimeout) {
      clearTimeout(this.warningTimeout);
      this.warningTimeout = null;
      this.emit('warningDismissed');
    }
  }

  /**
   * Schedule next session refresh
   */
  private scheduleNextRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Check session every 5 minutes
    this.refreshTimer = setTimeout(() => {
      this.checkAndRefreshSession().then(() => {
        this.scheduleNextRefresh();
      });
    }, 5 * 60 * 1000);
  }

  /**
   * Reset inactivity timer
   */
  private resetInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    this.inactivityTimer = setTimeout(() => {
      this.handleInactivity();
    }, this.config.maxInactivity * 60 * 1000);
  }

  /**
   * Handle user inactivity
   */
  private handleInactivity(): void {
    this.emit('inactivityWarning');
    
    // Start countdown to automatic logout
    this.warningTimeout = setTimeout(() => {
      this.handleForcedLogout();
    }, this.config.warningDuration * 1000);
  }

  /**
   * Handle forced logout due to inactivity
   */
  private async handleForcedLogout(): Promise<void> {
    this.emit('forcedLogout');
    await signOut({ callbackUrl: '/auth/v1/login' });
  }

  /**
   * Extend session during long operations
   */
  async extendSessionForOperation(operationName: string): Promise<boolean> {
    console.log(`[SessionManager] Extending session for operation: ${operationName}`);
    this.recordActivity(); // Reset inactivity
    return await this.checkAndRefreshSession();
  }

  /**
   * Add event listener
   */
  on(event: SessionEventType, listener: (data?: any) => void): void {
    this.listeners.add(listener);
  }

  /**
   * Remove event listener
   */
  off(listener: (event: SessionEvent) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * Emit event to listeners
   */
  private emit(type: SessionEventType, data?: any): void {
    const event: SessionEvent = { type, data, timestamp: Date.now() };
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('[SessionManager] Listener error:', error);
      }
    });
  }

  /**
   * Cleanup timers
   */
  destroy(): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    if (this.warningTimeout) clearTimeout(this.warningTimeout);
    this.listeners.clear();
  }

  /**
   * Get current session status
   */
  getStatus(): SessionStatus {
    const now = Date.now();
    const timeSinceActivity = now - this.lastActivity;
    
    return {
      isActive: timeSinceActivity < this.config.maxInactivity * 60 * 1000,
      lastActivity: this.lastActivity,
      timeSinceActivity,
      isRefreshing: this.isRefreshing,
    };
  }
}

// Types
type SessionEventType = 'sessionRefreshed' | 'sessionExpired' | 'sessionError' | 'inactivityWarning' | 'warningDismissed' | 'forcedLogout';

interface SessionEvent {
  type: SessionEventType;
  data?: any;
  timestamp: number;
}

interface SessionStatus {
  isActive: boolean;
  lastActivity: number;
  timeSinceActivity: number;
  isRefreshing: boolean;
}

// Singleton instance
export const sessionManager = new SessionManager();

// React hook for session management
import { useState, useEffect } from 'react';

export function useSessionManager() {
  const [status, setStatus] = useState<SessionStatus>(sessionManager.getStatus());
  const [warning, setWarning] = useState<boolean>(false);

  useEffect(() => {
    sessionManager.initialize();

    const handleSessionEvent = (event: SessionEvent) => {
      switch (event.type) {
        case 'inactivityWarning':
          setWarning(true);
          break;
        case 'warningDismissed':
          setWarning(false);
          break;
        case 'sessionExpired':
        case 'forcedLogout':
          setWarning(false);
          break;
      }
      setStatus(sessionManager.getStatus());
    };

    sessionManager.on('sessionRefreshed', handleSessionEvent);
    sessionManager.on('sessionExpired', handleSessionEvent);
    sessionManager.on('inactivityWarning', handleSessionEvent);
    sessionManager.on('warningDismissed', handleSessionEvent);
    sessionManager.on('forcedLogout', handleSessionEvent);

    // Update status periodically
    const statusInterval = setInterval(() => {
      setStatus(sessionManager.getStatus());
    }, 30000); // Every 30 seconds

    return () => {
      clearInterval(statusInterval);
      sessionManager.destroy();
    };
  }, []);

  return {
    status,
    warning,
    extendSession: sessionManager.extendSessionForOperation.bind(sessionManager),
    recordActivity: sessionManager.recordActivity.bind(sessionManager),
  };
}
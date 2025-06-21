
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ServerStatusCheckerProps {
  children: React.ReactNode;
  checkInterval?: number;
}

export function ServerStatusChecker({ 
  children, 
  checkInterval = 30000 // 30 seconds
}: ServerStatusCheckerProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const router = useRouter();

  const checkServerStatus = async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      const online = response.ok;
      
      if (!online && isOnline) {
        // Server went offline
        setIsOnline(false);
        toast.error("Server connection lost", {
          description: "Redirecting to offline page...",
          duration: 3000
        });
        
        setTimeout(() => {
          router.push('/server-offline');
        }, 2000);
      } else if (online && !isOnline) {
        // Server came back online
        setIsOnline(true);
        toast.success("Server connection restored", {
          description: "You're back online!",
          duration: 3000
        });
      }
    } catch (error) {
      if (isOnline) {
        setIsOnline(false);
        toast.error("Server connection lost", {
          description: "Redirecting to offline page...",
          duration: 3000
        });
        
        setTimeout(() => {
          router.push('/server-offline');
        }, 2000);
      }
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Check immediately on mount
    checkServerStatus();

    // Set up periodic checks
    const interval = setInterval(checkServerStatus, checkInterval);

    // Also check when the page becomes visible again
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkServerStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkInterval, isOnline, isChecking]);

  return <>{children}</>;
}


'use client';

import { useState, useEffect } from 'react';
import { getUserTimezone, storeUserTimezone, getStoredUserTimezone } from '@/lib/timezone-utils';

export function useTimezone() {
  const [timezone, setTimezone] = useState<string>('UTC');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to get stored timezone first, then detect from browser
    const storedTimezone = getStoredUserTimezone();
    const detectedTimezone = getUserTimezone();
    
    const finalTimezone = storedTimezone || detectedTimezone;
    
    setTimezone(finalTimezone);
    storeUserTimezone(); // Store the current timezone
    setIsLoading(false);
  }, []);

  return {
    timezone,
    isLoading,
    setTimezone: (tz: string) => {
      setTimezone(tz);
      if (typeof window !== 'undefined') {
        localStorage.setItem('userTimezone', tz);
      }
    }
  };
}

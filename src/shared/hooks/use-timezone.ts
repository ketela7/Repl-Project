
'use client';

import { useState, useEffect } from 'react';
import { getUserTimezone, initializeTimezone } from '@/shared/utils';

export function useTimezone() {
  const [timezone, setTimezone] = useState<string>('UTC');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Auto-detect timezone without user intervention
    const detectedTimezone = initializeTimezone();
    setTimezone(detectedTimezone);
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
    },
    getUserTimezone: () => getUserTimezone()
  };
}

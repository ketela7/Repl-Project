'use client'

import React, { createContext, useContext, ReactNode } from 'react'

import { useTimezone } from '@/lib/hooks/use-timezone'

interface TimezoneContextType {
  timezone: string
  isLoading: boolean
  setTimezone: (tz: string) => void
}

const TimezoneContext = createContext<TimezoneContextType | null>(null)

export function TimezoneProvider({ children }: { children: ReactNode }) {
  const timezoneData = useTimezone()

  return (
    <TimezoneContext.Provider value={timezoneData}>
      {children}
    </TimezoneContext.Provider>
  )
}

export function useTimezoneContext() {
  const context = useContext(TimezoneContext)
  if (!context) {
    throw new Error('useTimezoneContext must be used within a TimezoneProvider')
  }
  return context
}

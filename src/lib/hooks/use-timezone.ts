import { useState, useEffect } from 'react'

export function useTimezone() {
  const [timezone, setTimezone] = useState<string>('UTC')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      setTimezone(detectedTimezone)
    } catch {
      setTimezone('UTC')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    timezone,
    isLoading,
    setTimezone,
  }
}

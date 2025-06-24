'use client'

import { useEffect, useState } from 'react'
import { apiOptimizer } from '@/lib/api-performance'
import { driveCache } from '@/lib/cache'
import { errorHandler } from '@/lib/enhanced-error-handler'

interface PerformanceStats {
  apiQueue: number
  cacheSize: number
  errorCount: number
  lastUpdate: number
}

export function PerformanceMonitor() {
  const [stats, setStats] = useState<PerformanceStats>({
    apiQueue: 0,
    cacheSize: 0,
    errorCount: 0,
    lastUpdate: Date.now()
  })

  useEffect(() => {
    const updateStats = () => {
      const apiStats = apiOptimizer.getStats()
      const cacheStats = driveCache.getStats()
      const errorStats = errorHandler.getErrorStats()
      
      setStats({
        apiQueue: apiStats.queueSize,
        cacheSize: cacheStats.size,
        errorCount: Object.values(errorStats).reduce((sum, count) => sum + count, 0),
        lastUpdate: Date.now()
      })
    }

    // Update stats every 5 seconds
    const interval = setInterval(updateStats, 5000)
    updateStats() // Initial update

    return () => clearInterval(interval)
  }, [])

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black/80 text-white p-2 rounded text-xs font-mono">
      <div>Queue: {stats.apiQueue}</div>
      <div>Cache: {stats.cacheSize}</div>
      <div>Errors: {stats.errorCount}</div>
    </div>
  )
}
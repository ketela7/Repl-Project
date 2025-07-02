/**
 * Web Vitals monitoring for Core Web Vitals tracking
 * Tracks LCP, FID, CLS, FCP, and TTFB metrics
 */

import { getCLS, getFCP, getFID, getLCP, getTTFB } from 'web-vitals'

// Define performance thresholds
const PERFORMANCE_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 }, // First Input Delay
  CLS: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
}

interface VitalMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
}

// Performance metrics store
let performanceMetrics: VitalMetric[] = []

// Rating helper function
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = PERFORMANCE_THRESHOLDS[name as keyof typeof PERFORMANCE_THRESHOLDS]
  if (!threshold) return 'good'

  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

// Send metric to analytics (console for now, can be extended to real analytics)
function sendToAnalytics(metric: VitalMetric) {
  // In production, send to your analytics service
  if (process.env.NODE_ENV === 'development') {
    const icon =
      metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌'
    console.log(`${icon} ${metric.name}: ${metric.value}ms (${metric.rating})`)
  }

  // Store metric locally
  performanceMetrics.push(metric)

  // Keep only last 50 metrics to prevent memory bloat
  if (performanceMetrics.length > 50) {
    performanceMetrics = performanceMetrics.slice(-50)
  }
}

// Initialize Web Vitals monitoring
export function initWebVitals() {
  if (typeof window === 'undefined') return

  // Track Core Web Vitals
  getCLS(metric => {
    sendToAnalytics({
      name: 'CLS',
      value: metric.value,
      rating: getRating('CLS', metric.value),
      timestamp: Date.now(),
    })
  })

  getFCP(metric => {
    sendToAnalytics({
      name: 'FCP',
      value: metric.value,
      rating: getRating('FCP', metric.value),
      timestamp: Date.now(),
    })
  })

  getFID(metric => {
    sendToAnalytics({
      name: 'FID',
      value: metric.value,
      rating: getRating('FID', metric.value),
      timestamp: Date.now(),
    })
  })

  getLCP(metric => {
    sendToAnalytics({
      name: 'LCP',
      value: metric.value,
      rating: getRating('LCP', metric.value),
      timestamp: Date.now(),
    })
  })

  getTTFB(metric => {
    sendToAnalytics({
      name: 'TTFB',
      value: metric.value,
      rating: getRating('TTFB', metric.value),
      timestamp: Date.now(),
    })
  })
}

// Get current performance summary
export function getPerformanceSummary() {
  if (performanceMetrics.length === 0) {
    return { message: 'No performance metrics collected yet' }
  }

  return performanceMetrics.reduce((acc, metric) => {
    if (!acc[metric.name]) {
      acc[metric.name] = { latest: metric, count: 0, averageValue: 0 }
    }
    acc[metric.name].latest = metric
    acc[metric.name].count += 1
    acc[metric.name].averageValue = (acc[metric.name].averageValue + metric.value) / 2
    return acc
  }, {} as any)
}

// Performance monitoring hook for React components
export function usePerformanceMonitor(componentName: string) {
  if (typeof window === 'undefined') return { markStart: () => {}, markEnd: () => {} }

  let startTime = 0

  return {
    markStart: () => {
      startTime = performance.now()
    },
    markEnd: () => {
      const duration = performance.now() - startTime

      if (duration > 100) {
        // Only log slow components
        sendToAnalytics({
          name: `Component-${componentName}`,
          value: duration,
          rating: duration > 500 ? 'poor' : duration > 200 ? 'needs-improvement' : 'good',
          timestamp: Date.now(),
        })
      }
    },
  }
}

// Track route change performance
export function trackRouteChange(route: string, duration: number) {
  sendToAnalytics({
    name: `Route-${route}`,
    value: duration,
    rating: duration > 1000 ? 'poor' : duration > 500 ? 'needs-improvement' : 'good',
    timestamp: Date.now(),
  })
}

// Export metrics for debugging
export function exportMetrics() {
  return performanceMetrics
}

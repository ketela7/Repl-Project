/**
 * Web Vitals monitoring for Core Web Vitals tracking
 * Tracks LCP, FID, CLS, FCP, and TTFB metrics
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals'

// Define performance thresholds
const PERFORMANCE_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 }, // First Input Delay
  INP: { good: 200, poor: 500 }, // Interaction to Next Paint
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
    // Web vitals metric processed silently in development
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
  onCLS((metric: Metric) => {
    sendToAnalytics({
      name: 'CLS',
      value: metric.value,
      rating: getRating('CLS', metric.value),
      timestamp: Date.now(),
    })
  })

  onFCP((metric: Metric) => {
    sendToAnalytics({
      name: 'FCP',
      value: metric.value,
      rating: getRating('FCP', metric.value),
      timestamp: Date.now(),
    })
  })

  onINP((metric: Metric) => {
    sendToAnalytics({
      name: 'INP',
      value: metric.value,
      rating: getRating('INP', metric.value),
      timestamp: Date.now(),
    })
  })

  onLCP((metric: Metric) => {
    sendToAnalytics({
      name: 'LCP',
      value: metric.value,
      rating: getRating('LCP', metric.value),
      timestamp: Date.now(),
    })
  })

  onTTFB((metric: Metric) => {
    sendToAnalytics({
      name: 'TTFB',
      value: metric.value,
      rating: getRating('TTFB', metric.value),
      timestamp: Date.now(),
    })
  })
}


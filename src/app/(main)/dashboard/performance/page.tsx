
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { getPerformanceSummary, exportMetrics } from '@/lib/web-vitals'
import { Activity, Clock, Eye, Zap, Gauge, Download } from 'lucide-react'

interface MetricData {
  latest: {
    name: string
    value: number
    rating: 'good' | 'needs-improvement' | 'poor'
    timestamp: number
  }
  count: number
  averageValue: number
}

export default function PerformancePage() {
  const [metrics, setMetrics] = useState<Record<string, MetricData>>({})
  const [isLoading, setIsLoading] = useState(true)

  const refreshMetrics = () => {
    const summary = getPerformanceSummary()
    if (typeof summary === 'object' && !('message' in summary)) {
      setMetrics(summary)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    refreshMetrics()
    
    // Auto refresh every 5 seconds
    const interval = setInterval(refreshMetrics, 5000)
    return () => clearInterval(interval)
  }, [])

  const downloadMetrics = () => {
    const data = exportMetrics()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `web-vitals-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good':
        return 'bg-green-500'
      case 'needs-improvement':
        return 'bg-yellow-500'
      case 'poor':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getRatingBadgeVariant = (rating: string) => {
    switch (rating) {
      case 'good':
        return 'default'
      case 'needs-improvement':
        return 'secondary'
      case 'poor':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getMetricIcon = (name: string) => {
    if (name.includes('LCP')) return <Eye className="h-4 w-4" />
    if (name.includes('FCP')) return <Zap className="h-4 w-4" />
    if (name.includes('CLS')) return <Activity className="h-4 w-4" />
    if (name.includes('TTFB')) return <Clock className="h-4 w-4" />
    if (name.includes('INP')) return <Gauge className="h-4 w-4" />
    return <Activity className="h-4 w-4" />
  }

  const getProgressValue = (name: string, value: number) => {
    const thresholds = {
      LCP: 4000,
      FCP: 3000,
      CLS: 0.25,
      TTFB: 1800,
      INP: 500
    }
    
    const maxValue = thresholds[name as keyof typeof thresholds] || 1000
    return Math.min((value / maxValue) * 100, 100)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Performance Dashboard</h1>
            <p className="text-muted-foreground">Web Vitals monitoring and metrics</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-2 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          <p className="text-muted-foreground">Real-time Web Vitals monitoring</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshMetrics} variant="outline">
            Refresh
          </Button>
          <Button onClick={downloadMetrics} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {Object.keys(metrics).length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Performance Data</h3>
            <p className="text-muted-foreground">
              Navigate around the app to generate web vitals metrics
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(metrics).map(([metricName, data]) => (
            <Card key={metricName}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {getMetricIcon(metricName)}
                  {metricName}
                </CardTitle>
                <Badge variant={getRatingBadgeVariant(data.latest.rating)}>
                  {data.latest.rating.replace('-', ' ')}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">
                  {data.latest.value < 1 
                    ? data.latest.value.toFixed(3) 
                    : Math.round(data.latest.value)
                  }
                  {metricName === 'CLS' ? '' : 'ms'}
                </div>
                <Progress 
                  value={getProgressValue(metricName, data.latest.value)} 
                  className="mb-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Samples: {data.count}</span>
                  <span>
                    Avg: {data.averageValue < 1 
                      ? data.averageValue.toFixed(3) 
                      : Math.round(data.averageValue)
                    }
                    {metricName === 'CLS' ? '' : 'ms'}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Last: {new Date(data.latest.timestamp).toLocaleTimeString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Web Vitals Explained</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4" />
                LCP - Largest Contentful Paint
              </h4>
              <p className="text-sm text-muted-foreground">
                Time to render the largest visible element (Good: &lt;2.5s)
              </p>
            </div>
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4" />
                FCP - First Contentful Paint
              </h4>
              <p className="text-sm text-muted-foreground">
                Time to first visible content (Good: &lt;1.8s)
              </p>
            </div>
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4" />
                CLS - Cumulative Layout Shift
              </h4>
              <p className="text-sm text-muted-foreground">
                Visual stability score (Good: &lt;0.1)
              </p>
            </div>
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <Gauge className="h-4 w-4" />
                INP - Interaction to Next Paint
              </h4>
              <p className="text-sm text-muted-foreground">
                Response time to user interactions (Good: &lt;200ms)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

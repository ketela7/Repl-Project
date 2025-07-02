import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function DriveGridSkeleton() {
  // Fixed width patterns to avoid hydration mismatch
  const widthPatterns = [
    { main: '75%', sub: '45%' },
    { main: '65%', sub: '35%' },
    { main: '85%', sub: '50%' },
    { main: '70%', sub: '40%' },
    { main: '90%', sub: '55%' },
    { main: '80%', sub: '48%' },
    { main: '60%', sub: '38%' },
    { main: '95%', sub: '42%' },
  ]

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32 rounded" />
          <Skeleton className="h-6 w-16 rounded" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => {
            const pattern = widthPatterns[i % widthPatterns.length]

            return (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="h-4 w-4 flex-shrink-0 rounded" />
                <Skeleton className="h-4 w-4 flex-shrink-0 rounded" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 rounded" style={{ width: pattern?.main || '70%' }} />
                  <Skeleton className="h-3 rounded" style={{ width: pattern?.sub || '40%' }} />
                </div>
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export function BreadcrumbSkeleton() {
  return (
    <div className="mb-4 flex items-center space-x-2">
      <Skeleton className="h-4 w-16" />
      <span className="text-muted-foreground">/</span>
      <Skeleton className="h-4 w-20" />
      <span className="text-muted-foreground">/</span>
      <Skeleton className="h-4 w-24" />
    </div>
  )
}

export default DriveGridSkeleton

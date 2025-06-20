import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

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
    { main: '72%', sub: '43%' },
    { main: '88%', sub: '52%' },
    { main: '67%', sub: '39%' },
    { main: '93%', sub: '47%' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {Array.from({ length: 10 }).map((_, i) => {
        const pattern = widthPatterns[i % widthPatterns.length];

        return (
          <Card key={i} className="group hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <Skeleton className="h-12 w-12 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
              <div className="space-y-2">
                <div
                  className="h-4 bg-muted rounded"
                  style={{ width: pattern.main }}
                />
                <div
                  className="h-3 bg-muted rounded"
                  style={{ width: pattern.sub }}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function DriveListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 rounded-lg border">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      ))}
    </div>
  );
}

export function BreadcrumbSkeleton() {
  return (
    <div className="flex items-center space-x-2 mb-4">
      <Skeleton className="h-4 w-16" />
      <span className="text-muted-foreground">/</span>
      <Skeleton className="h-4 w-20" />
      <span className="text-muted-foreground">/</span>
      <Skeleton className="h-4 w-24" />
    </div>
  );
}
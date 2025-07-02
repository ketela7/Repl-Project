'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Simple client-side redirect to login
    // This avoids SSR redirect issues on mobile
    router.replace('/auth/v1/login')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <div className="text-muted-foreground">Redirecting to login...</div>
      </div>
    </div>
  )
}

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
    <div className="bg-background flex min-h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="border-primary mx-auto h-12 w-12 animate-spin rounded-full border-b-2"></div>
        <div className="text-muted-foreground">Redirecting to login...</div>
      </div>
    </div>
  )
}

"use client"

import { useSession } from "next-auth/react"
import { ReactNode } from "react"
import { redirect } from "next/navigation"

interface AuthWrapperProps {
  children: ReactNode
  fallback?: ReactNode
}

export function AuthWrapper({ children, fallback }: AuthWrapperProps) {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return fallback || <div>Loading...</div>
  }

  if (!session) {
    redirect("/auth/v1/login")
  }

  return <>{children}</>
}
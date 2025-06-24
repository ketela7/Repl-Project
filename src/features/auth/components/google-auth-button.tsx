"use client"

import { Button } from "@/shared/components/ui/button"
import { signIn } from "next-auth/react"

interface GoogleAuthButtonProps {
  children?: React.ReactNode
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  onClick?: () => void
}

export function GoogleAuthButton({ 
  children = "Sign in with Google", 
  className,
  variant = "default",
  onClick
}: GoogleAuthButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      signIn("google")
    }
  }

  return (
    <Button
      variant={variant}
      className={className}
      onClick={handleClick}
    >
      {children}
    </Button>
  )
}
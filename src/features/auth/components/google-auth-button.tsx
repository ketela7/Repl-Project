'use client'

import { signIn } from 'next-auth/react'

import { Button } from '@/shared/components/ui/button'

interface GoogleAuthButtonProps {
  children?: React.ReactNode
  className?: string
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
  onClick?: () => void
}

export function GoogleAuthButton({
  children = 'Sign in with Google',
  className,
  variant = 'default',
  onClick,
}: GoogleAuthButtonProps) {
  const handleClick = async () => {
    if (onClick) {
      onClick()
    } else {
      try {
        await signIn('google', {
          callbackUrl: '/dashboard/drive',
          redirect: true,
        })
      } catch (error) {
        console.error('Sign in failed:', error)
      }
    }
  }

  return (
    <Button variant={variant} className={className} onClick={handleClick}>
      {children}
    </Button>
  )
}

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Shield } from 'lucide-react'

import { GoogleAuthButton } from '@/components/auth/google-auth-button'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'

const FormSchema = z.object({
  remember: z.boolean(),
})

interface NextAuthFormProps {
  isReauth?: boolean
}

export function NextAuthForm({ isReauth = false }: NextAuthFormProps) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      remember: false,
    },
    mode: 'onChange',
  })

  // Store remember me preference in localStorage for use during authentication
  const setRememberMePreference = (rememberMe: boolean) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nextauth-remember-me', JSON.stringify(rememberMe))
    }
  }

  // Handle remember me preference change
  const handleRememberChange = (checked: boolean) => {
    form.setValue('remember', checked)
    setRememberMePreference(checked)
  }

  return (
    <div className="space-y-4">
      {/* Show re-auth message if needed */}
      {isReauth && (
        <Alert className="border-blue-200 bg-blue-50">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Please sign in again to grant Google Drive access permissions.
          </AlertDescription>
        </Alert>
      )}

      {/* Remember Me Checkbox */}
      <div className="bg-muted/30 flex items-center space-x-2 rounded-md border p-3">
        <Checkbox
          id="remember-me-nextauth"
          checked={form.watch('remember')}
          onCheckedChange={checked => handleRememberChange(!!checked)}
        />
        <div className="space-y-1">
          <label
            htmlFor="remember-me-nextauth"
            className="cursor-pointer text-sm font-medium select-none"
          >
            Keep me signed in for 30 days
          </label>
          <p className="text-muted-foreground text-xs">
            Default: Sign out after 1 day for security
          </p>
        </div>
      </div>

      <GoogleAuthButton className="w-full" />
    </div>
  )
}

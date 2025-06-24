import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-destructive/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            <AlertCircle className="text-destructive h-6 w-6" />
          </div>
          <CardTitle>Authentication Error</CardTitle>
          <CardDescription>
            Sorry, we encountered an issue while trying to sign you in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-center text-sm">
            This could be due to an invalid or expired authentication code.
            Please try signing in again.
          </p>
          <Button asChild className="w-full">
            <Link href="/auth/v1/login">Try Again</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Chrome } from "lucide-react"

export default function SignIn() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Sign in to Drive Manager</CardTitle>
          <p className="text-gray-600">Access and manage your Google Drive files</p>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => signIn("google", { callbackUrl: "/dashboard/drive" })}
            className="w-full flex items-center gap-2"
            size="lg"
          >
            <Chrome className="h-5 w-5" />
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
'use client'

import { Command } from 'lucide-react'
import { Suspense } from 'react'

import { NextAuthForm } from './_components/nextauth-form'
import { SearchParamsHandler } from './_components/search-params-handler'

export default function LoginV1() {
  return (
    <div className="flex h-dvh">
      <div className="bg-primary hidden lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            <Command className="text-primary-foreground mx-auto size-12" />
            <div className="space-y-2">
              <h1 className="text-primary-foreground text-5xl font-light">Hello again</h1>
              <p className="text-primary-foreground/80 text-xl">Login to continue</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-background flex w-full items-center justify-center p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-10 py-24 lg:py-32">
          <div className="space-y-4 text-center">
            <div className="text-foreground font-medium tracking-tight">Login</div>
            <div className="text-muted-foreground mx-auto max-w-xl">
              Welcome back. Enter your email and password, let&apos;s hope you remember them this time.
            </div>
          </div>
          <div className="space-y-4">
            <Suspense fallback={<div className="text-center">Loading...</div>}>
              <SearchParamsHandler>{(isReauth) => <NextAuthForm isReauth={isReauth} />}</SearchParamsHandler>
            </Suspense>
            <p className="text-muted-foreground text-center text-xs font-medium">
              Sign in with your Google account to access the Google Drive management system.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

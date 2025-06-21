"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Checkbox } from "@/components/ui/checkbox";
import { setRememberMePreference } from "@/lib/session-utils";

const FormSchema = z.object({
  remember: z.boolean().default(false),
});

export function NextAuthForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      remember: false,
    },
  });

  const handleGoogleSignIn = () => {
    // Store remember me preference before sign in
    const rememberMe = form.getValues('remember');
    setRememberMePreference(rememberMe);
    console.log("[NextAuthForm] Remember me preference set:", rememberMe);
  };

  return (
    <div className="space-y-4">
      {/* Remember Me Checkbox */}
      <div className="flex items-center space-x-2 p-3 border rounded-md bg-muted/30">
        <Checkbox
          id="remember-me-nextauth"
          checked={form.watch('remember')}
          onCheckedChange={(checked) => form.setValue('remember', !!checked)}
        />
        <div className="space-y-1">
          <label htmlFor="remember-me-nextauth" className="text-sm font-medium cursor-pointer select-none">
            Keep me signed in for 30 days
          </label>
          <p className="text-xs text-muted-foreground">
            Default: Sign out after 1 day for security
          </p>
        </div>
      </div>
      
      <GoogleAuthButton 
        className="w-full" 
        onClick={handleGoogleSignIn}
      />
    </div>
  );
}
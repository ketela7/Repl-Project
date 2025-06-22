"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield } from "lucide-react";
import { setRememberMePreference } from "@/lib/session";

const FormSchema = z.object({
  remember: z.boolean().default(false),
});

interface NextAuthFormProps {
  isReauth?: boolean;
}

export function NextAuthForm({ isReauth = false }: NextAuthFormProps) {
  
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
  };

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
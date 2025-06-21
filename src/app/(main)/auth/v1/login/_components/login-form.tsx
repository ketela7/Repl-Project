"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { setRememberMePreference } from "@/lib/session-utils";
import { Separator } from "@/components/ui/separator";

const FormSchema = z.object({
  remember: z.boolean().default(false),
});

export function LoginFormV1() {
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      remember: false,
    },
  });

  const handleGoogleSignIn = async (rememberMe: boolean = false) => {
    setIsLoading(true);
    
    try {
      // Store remember me preference in localStorage before sign in
      setRememberMePreference(rememberMe);
      console.log("[Login] Remember me preference stored:", rememberMe);
      
      toast.info("Redirecting to Google Sign-in...", {
        description: rememberMe ? "You will be remembered for 30 days" : "Session expires in 1 day"
      });
      
      const result = await signIn('google', {
        callbackUrl: '/dashboard/drive',
        redirect: true,
      });
      
      if (result?.error) {
        toast.error("Sign-in failed", {
          description: "Please try again"
        });
      }
    } catch (error) {
      console.error("Sign-in error:", error);
      toast.error("An error occurred during sign-in");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    await handleGoogleSignIn(data.remember || false);
  };

  return (
    <div className="space-y-4">
      {/* Remember Me Option - Always Visible */}
      <div className="flex items-center space-x-2 p-2 border rounded-md bg-muted/30">
        <Checkbox
          id="remember-me-checkbox"
          checked={form.watch('remember')}
          onCheckedChange={(checked) => form.setValue('remember', !!checked)}
        />
        <label htmlFor="remember-me-checkbox" className="text-sm font-medium cursor-pointer select-none">
          Remember me for 30 days
        </label>
      </div>

      {/* Google Sign In Button */}
      <Button 
        className="w-full" 
        onClick={() => handleGoogleSignIn(form.getValues('remember') || false)}
        disabled={isLoading}
      >
        {isLoading ? "Signing in..." : "Continue with Google"}
      </Button>
      
      <p className="text-muted-foreground text-center text-xs">
        Sign in with your Google account to access the Google Drive management system.
      </p>
    </div>
  );
}
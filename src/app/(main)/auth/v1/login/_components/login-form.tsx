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
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  remember: z.boolean().optional(),
});

export function LoginFormV1() {
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  const handleGoogleSignIn = async (rememberMe: boolean = false) => {
    setIsLoading(true);
    
    try {
      // Store remember me preference in localStorage
      setRememberMePreference(rememberMe);
      
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="remember"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center">
              <FormControl>
                <Checkbox
                  id="login-remember"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="size-4"
                />
              </FormControl>
              <FormLabel htmlFor="login-remember" className="text-muted-foreground ml-1 text-sm font-medium">
                Remember me for 30 days
              </FormLabel>
            </FormItem>
          )}
        />
        <Button className="w-full" type="submit" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign in with Google"}
        </Button>
      </form>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>
      
      <Button 
        variant="outline" 
        className="w-full" 
        onClick={() => handleGoogleSignIn(false)}
        disabled={isLoading}
      >
        Quick Sign in with Google
      </Button>
    </Form>
  );
}
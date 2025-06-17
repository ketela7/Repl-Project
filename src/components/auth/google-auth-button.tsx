"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Turnstile } from "@/components/ui/turnstile";
import { useConfig } from "@/components/providers/config-provider";
import { toast } from "sonner";

interface GoogleAuthButtonProps {
  className?: string;
}

export function GoogleAuthButton({ className }: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [showTurnstile, setShowTurnstile] = useState(false);
  const config = useConfig();

  const handleGoogleAuth = async () => {
    if (!turnstileToken) {
      setShowTurnstile(true);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ turnstileToken }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Authentication failed');
        setTurnstileToken(null);
        setShowTurnstile(true);
      }
    } catch (error) {
      toast.error('An error occurred during authentication');
      setTurnstileToken(null);
      setShowTurnstile(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTurnstileVerify = (token: string) => {
    setTurnstileToken(token);
    setShowTurnstile(false);
    // Automatically proceed with Google auth after Turnstile verification
    setTimeout(() => {
      handleGoogleAuth();
    }, 100);
  };

  const handleTurnstileError = () => {
    toast.error('CAPTCHA verification failed. Please try again.');
    setTurnstileToken(null);
  };

  if (showTurnstile && !turnstileToken) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Please complete the security check to continue with Google Sign-In
          </p>
          <Turnstile
            siteKey={config.turnstileSiteKey}
            onVerify={handleTurnstileVerify}
            onError={handleTurnstileError}
            className="flex justify-center"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowTurnstile(false)}
          className="w-full"
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleGoogleAuth}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <>
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Signing in...
        </>
      ) : (
        <>
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </>
      )}
    </Button>
  );
}
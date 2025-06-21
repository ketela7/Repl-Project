"use client";

import { GoogleAuthButton } from "@/components/auth/google-auth-button";

export function NextAuthForm() {
  return (
    <div className="space-y-4">
      <GoogleAuthButton className="w-full" />
    </div>
  );
}
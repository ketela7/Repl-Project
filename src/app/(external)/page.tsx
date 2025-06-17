import { AuthStatus } from "@/components/auth/auth-status";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard App</h1>
          <p className="text-muted-foreground mt-2">
            A modern admin dashboard with Google authentication
          </p>
        </div>
        <AuthStatus />
      </div>
    </div>
  );
}

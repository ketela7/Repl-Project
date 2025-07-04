export default function LoadingPage() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="border-primary mx-auto h-12 w-12 animate-spin rounded-full border-b-2"></div>
        <div className="text-muted-foreground">Loading your Google Drive Pro...</div>
      </div>
    </div>
  )
}

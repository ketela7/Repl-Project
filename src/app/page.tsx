import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect to login page instead of dashboard to avoid auth context issues
  redirect('/auth/v1/login')
}

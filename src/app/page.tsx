import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'

export default async function HomePage() {
  // Check if user is already authenticated
  const session = await getServerSession(authOptions)

  if (session) {
    // User is authenticated, redirect to dashboard
    redirect('/dashboard/drive')
  } else {
    // User is not authenticated, redirect to login
    redirect('/auth/v1/login')
  }
}

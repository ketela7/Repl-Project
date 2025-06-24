import { signOut } from '@/auth'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    await signOut({ redirect: false })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Logout failed' }, { status: 400 })
  }
}

export async function GET() {
  try {
    await signOut({ redirectTo: '/' })
  } catch (error) {
    return NextResponse.redirect('/?error=logout_failed')
  }
}

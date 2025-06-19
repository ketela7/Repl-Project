import { redirect } from 'next/navigation';

export default function DashboardPage() {
  // Redirect to drive page directly
  redirect('/dashboard/drive');
}

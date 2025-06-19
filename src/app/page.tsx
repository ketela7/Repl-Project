import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect directly to Google Drive management
  redirect('/dashboard/drive');
}
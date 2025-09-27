import { redirect } from 'next/navigation'

export default function OwnerPage() {
  // Redirect ke kasir dashboard sebagai default untuk owner
  redirect('/dashboard')
}
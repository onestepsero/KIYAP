import { getAuthUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  if (user.role !== 'TEACHER' && user.role !== 'ADMIN') redirect('/login')
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role={user.role} name={user.name} />
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}

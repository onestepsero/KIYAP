'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

interface NavItem {
  label: string
  href: string
}

const NAV_ITEMS: Record<string, NavItem[]> = {
  STUDENT: [
    { label: '대시보드', href: '/student' },
    { label: '활동 탐색', href: '/student/activities' },
    { label: '신청 내역', href: '/student/applications' },
  ],
  PARENT: [
    { label: '대시보드', href: '/parent' },
  ],
  TEACHER: [
    { label: '대시보드', href: '/teacher' },
  ],
  ADMIN: [
    { label: '대시보드', href: '/admin' },
    { label: '회원 관리', href: '/admin/users' },
    { label: '활동 관리', href: '/admin/activities' },
    { label: '결제/정산', href: '/admin/payments' },
  ],
}

const ROLE_LABELS: Record<string, string> = {
  STUDENT: '학생',
  PARENT: '학부모',
  TEACHER: '교사',
  ADMIN: '관리자',
}

const ROLE_COLORS: Record<string, string> = {
  STUDENT: 'bg-blue-600',
  PARENT: 'bg-purple-600',
  TEACHER: 'bg-green-600',
  ADMIN: 'bg-red-600',
}

export default function Navbar({ role, name }: { role: string; name: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((d) => { if (d.success) setUnreadCount(d.unreadCount) })
      .catch(() => {})
  }, [pathname])

  const handleLogout = async () => {
    await fetch('/api/auth/me', { method: 'DELETE' })
    router.push('/login')
  }

  const navItems = NAV_ITEMS[role] || []

  return (
    <nav className={`${ROLE_COLORS[role] || 'bg-blue-600'} text-white shadow-lg`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href={`/${role.toLowerCase()}`} className="font-bold text-xl tracking-tight">
              KIYAP
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-white/20 text-white'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/notifications" className="relative p-2 hover:bg-white/10 rounded-full">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">
                  {name.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium">{name}</p>
                  <p className="text-xs text-white/70">{ROLE_LABELS[role]}</p>
                </div>
                <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 text-gray-700">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600"
                  >
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden pb-3 flex gap-1 flex-wrap">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                pathname === item.href ? 'bg-white/20' : 'text-white/80'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!data.success) { setError(data.error); return }
      const role: string = data.data.role
      router.push(`/${role.toLowerCase()}`)
    } catch {
      setError('서버 연결에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (role: string) => {
    const accounts: Record<string, { email: string; password: string }> = {
      admin: { email: 'admin@youth.or.kr', password: 'admin1234' },
      teacher: { email: 'teacher@school.kr', password: 'teacher1234' },
      parent: { email: 'parent@email.com', password: 'parent1234' },
      student: { email: 'student@email.com', password: 'student1234' },
    }
    if (accounts[role]) setForm(accounts[role])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">KIYAP</h1>
          <p className="text-blue-100">한국청소년인천연맹 활동 플랫폼</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">로그인</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">이메일</label>
              <input
                type="email"
                className="input"
                placeholder="이메일 주소 입력"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">비밀번호</label>
              <input
                type="password"
                className="input"
                placeholder="비밀번호 입력"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/register" className="text-sm text-blue-600 hover:underline">
              학생 회원가입
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center mb-3">데모 계정으로 빠른 로그인</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { role: 'admin', label: '관리자', color: 'text-red-600 border-red-200 hover:bg-red-50' },
                { role: 'teacher', label: '교사', color: 'text-green-600 border-green-200 hover:bg-green-50' },
                { role: 'parent', label: '학부모', color: 'text-purple-600 border-purple-200 hover:bg-purple-50' },
                { role: 'student', label: '학생', color: 'text-blue-600 border-blue-200 hover:bg-blue-50' },
              ].map(({ role, label, color }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => fillDemo(role)}
                  className={`text-xs py-2 px-3 rounded-lg border font-medium transition-colors ${color}`}
                >
                  {label} 계정
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

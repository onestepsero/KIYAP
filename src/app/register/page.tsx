'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface School { id: string; name: string }

export default function RegisterPage() {
  const router = useRouter()
  const [schools, setSchools] = useState<School[]>([])
  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '', name: '', phone: '',
    schoolId: '', grade: '', classNum: '', parentPhone: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/schools').then(r => r.json()).then(d => { if (d.success) setSchools(d.data) })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) { setError('비밀번호가 일치하지 않습니다.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!data.success) { setError(data.error); return }
      alert('회원가입이 완료되었습니다.')
      router.push('/login')
    } catch {
      setError('서버 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">KIYAP</h1>
          <p className="text-blue-100 text-sm">학생 회원가입</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">학생 회원가입</h2>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">이름 *</label>
                <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="홍길동" />
              </div>
              <div>
                <label className="label">연락처</label>
                <input className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="010-0000-0000" />
              </div>
            </div>
            <div>
              <label className="label">이메일 *</label>
              <input type="email" className="input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required placeholder="student@email.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">비밀번호 *</label>
                <input type="password" className="input" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={6} />
              </div>
              <div>
                <label className="label">비밀번호 확인 *</label>
                <input type="password" className="input" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} required />
              </div>
            </div>
            <div>
              <label className="label">학교 *</label>
              <select className="input" value={form.schoolId} onChange={e => setForm({...form, schoolId: e.target.value})} required>
                <option value="">학교 선택</option>
                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">학년 *</label>
                <select className="input" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})} required>
                  <option value="">선택</option>
                  {[1,2,3,4,5,6].map(g => <option key={g} value={g}>{g}학년</option>)}
                </select>
              </div>
              <div>
                <label className="label">반 *</label>
                <select className="input" value={form.classNum} onChange={e => setForm({...form, classNum: e.target.value})} required>
                  <option value="">선택</option>
                  {[1,2,3,4,5,6,7,8,9,10].map(c => <option key={c} value={c}>{c}반</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">학부모 연락처 (초대 SMS 발송)</label>
              <input className="input" value={form.parentPhone} onChange={e => setForm({...form, parentPhone: e.target.value})} placeholder="010-0000-0000" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? '처리 중...' : '회원가입'}
            </button>
          </form>
          <div className="mt-4 text-center">
            <Link href="/login" className="text-sm text-blue-600 hover:underline">이미 계정이 있으신가요? 로그인</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

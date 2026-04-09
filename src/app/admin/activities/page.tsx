'use client'
import { useState, useEffect, useCallback } from 'react'
import StatusBadge from '@/components/StatusBadge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { ACTIVITY_CATEGORIES } from '@/types'

interface Activity {
  id: string; title: string; category: string; startDate: string; endDate: string
  location: string; fee: number; capacity: number; status: string
  _count: { applications: number }
}

type FormData = {
  title: string; description: string; category: string; capacity: string
  startDate: string; endDate: string; location: string; fee: string
  targetGrades: string[]; status: string; requireParentConsent: boolean
}

const emptyForm: FormData = {
  title: '', description: '', category: '교육', capacity: '30',
  startDate: '', endDate: '', location: '', fee: '0',
  targetGrades: [], status: 'OPEN', requireParentConsent: false,
}

export default function AdminActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const fetchActivities = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/activities?limit=50')
    const data = await res.json()
    if (data.success) setActivities(data.data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchActivities() }, [fetchActivities])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.success) {
      setMessage('활동이 생성되었습니다.')
      setShowForm(false)
      setForm(emptyForm)
      fetchActivities()
    } else {
      setMessage(data.error)
    }
    setSaving(false)
  }

  const handleStatusChange = async (id: string, status: string) => {
    const res = await fetch(`/api/activities/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if ((await res.json()).success) fetchActivities()
  }

  const GRADES = ['초1', '초2', '초3', '초4', '초5', '초6', '중1', '중2', '중3', '고1', '고2', '고3']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">활동 관리</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? '취소' : '+ 새 활동 등록'}
        </button>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm ${message.includes('생성') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      {showForm && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">새 활동 등록</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">활동명 *</label>
                <input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
              </div>
              <div className="md:col-span-2">
                <label className="label">활동 소개 *</label>
                <textarea className="input h-24 resize-none" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
              </div>
              <div>
                <label className="label">카테고리 *</label>
                <select className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  {ACTIVITY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">모집 정원 *</label>
                <input type="number" className="input" min="1" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} required />
              </div>
              <div>
                <label className="label">시작일 *</label>
                <input type="datetime-local" className="input" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} required />
              </div>
              <div>
                <label className="label">종료일 *</label>
                <input type="datetime-local" className="input" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} required />
              </div>
              <div>
                <label className="label">장소 *</label>
                <input className="input" value={form.location} onChange={e => setForm({...form, location: e.target.value})} required />
              </div>
              <div>
                <label className="label">활동비 (원)</label>
                <input type="number" className="input" min="0" value={form.fee} onChange={e => setForm({...form, fee: e.target.value})} />
              </div>
              <div>
                <label className="label">상태</label>
                <select className="input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="DRAFT">임시저장</option>
                  <option value="OPEN">모집중</option>
                  <option value="CLOSED">마감</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="consent" checked={form.requireParentConsent}
                  onChange={e => setForm({...form, requireParentConsent: e.target.checked})} />
                <label htmlFor="consent" className="text-sm text-gray-700">학부모 동의 필요</label>
              </div>
              <div className="md:col-span-2">
                <label className="label">대상 학년 (복수 선택)</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {GRADES.map(g => (
                    <label key={g} className="flex items-center gap-1 text-sm cursor-pointer">
                      <input type="checkbox" checked={form.targetGrades.includes(g)}
                        onChange={e => setForm({...form, targetGrades: e.target.checked
                          ? [...form.targetGrades, g]
                          : form.targetGrades.filter(x => x !== g)})} />
                      {g}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">취소</button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? '저장 중...' : '활동 등록'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['활동명', '카테고리', '일정', '장소', '정원/신청', '활동비', '상태', '관리'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => <tr key={i} className="border-b"><td colSpan={8} className="py-3 px-4"><div className="h-4 bg-gray-200 rounded animate-pulse" /></td></tr>)
              ) : activities.map((act) => (
                <tr key={act.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium max-w-48">
                    <p className="truncate">{act.title}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{act.category}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{formatDate(act.startDate)}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs max-w-32 truncate">{act.location}</td>
                  <td className="py-3 px-4">
                    <span className={act._count.applications >= act.capacity ? 'text-red-600' : 'text-green-600'}>
                      {act._count.applications}/{act.capacity}
                    </span>
                  </td>
                  <td className="py-3 px-4">{act.fee === 0 ? '무료' : formatCurrency(act.fee)}</td>
                  <td className="py-3 px-4"><StatusBadge status={act.status as 'OPEN' | 'CLOSED' | 'DRAFT' | 'CANCELLED'} /></td>
                  <td className="py-3 px-4">
                    <select
                      className="text-xs border border-gray-200 rounded px-2 py-1"
                      value={act.status}
                      onChange={e => handleStatusChange(act.id, e.target.value)}
                    >
                      <option value="DRAFT">임시저장</option>
                      <option value="OPEN">모집중</option>
                      <option value="CLOSED">마감</option>
                      <option value="COMPLETED">완료</option>
                      <option value="CANCELLED">취소</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

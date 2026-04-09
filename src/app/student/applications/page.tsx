'use client'
import { useState, useEffect } from 'react'
import StatusBadge from '@/components/StatusBadge'
import VirtualAccountInfo from '@/components/VirtualAccountInfo'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Application {
  id: string; status: string; appliedAt: string
  activity: { id: string; title: string; startDate: string; category: string; fee: number; location: string }
  payment?: { id: string; amount: number; virtualAccountNo: string; bankName: string; accountHolder: string; dueDate: string; status: string; paidAt?: string | null }
}

export default function StudentApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  const fetchApplications = async () => {
    setLoading(true)
    const params = filter ? `?status=${filter}` : ''
    const res = await fetch(`/api/applications${params}`)
    const data = await res.json()
    if (data.success) setApplications(data.data)
    setLoading(false)
  }

  useEffect(() => { fetchApplications() }, [filter]) // eslint-disable-line

  const handleCancel = async (appId: string) => {
    if (!confirm('신청을 취소하시겠습니까?')) return
    const res = await fetch(`/api/applications/${appId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel' }),
    })
    if ((await res.json()).success) fetchApplications()
  }

  const handlePayConfirm = async (paymentId: string) => {
    const res = await fetch(`/api/payments/${paymentId}/confirm`, { method: 'POST' })
    if ((await res.json()).success) fetchApplications()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">신청 내역</h1>
        <select className="input w-36" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">전체</option>
          <option value="CONFIRMED">확정</option>
          <option value="WAITLIST">대기</option>
          <option value="CANCELLED">취소</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="card animate-pulse h-24" />)}</div>
      ) : applications.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">신청 내역이 없습니다.</div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{app.activity.category}</span>
                    <StatusBadge status={app.status as 'CONFIRMED' | 'WAITLIST' | 'CANCELLED' | 'PENDING'} />
                    {app.payment?.status === 'PENDING' && <span className="badge bg-orange-100 text-orange-700">미납</span>}
                    {app.payment?.status === 'PAID' && <span className="badge bg-green-100 text-green-700">납부완료</span>}
                  </div>
                  <h3 className="font-semibold text-gray-900">{app.activity.title}</h3>
                  <p className="text-sm text-gray-500">
                    {formatDate(app.activity.startDate)} · {app.activity.location}
                  </p>
                  <p className="text-sm text-gray-500">신청일: {formatDate(app.appliedAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {app.activity.fee === 0 ? '무료' : formatCurrency(app.activity.fee)}
                  </p>
                </div>
              </div>

              {app.payment && <VirtualAccountInfo payment={app.payment} />}

              <div className="flex gap-2 mt-3">
                {app.payment?.status === 'PENDING' && (
                  <button onClick={() => handlePayConfirm(app.payment!.id)} className="btn-primary text-sm flex-1">
                    [테스트] 입금 확인
                  </button>
                )}
                {['CONFIRMED', 'WAITLIST', 'PENDING'].includes(app.status) && (
                  <button onClick={() => handleCancel(app.id)} className="btn-secondary text-sm text-red-600 border-red-200">
                    신청 취소
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

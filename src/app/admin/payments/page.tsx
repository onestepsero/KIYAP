'use client'
import { useState, useEffect, useCallback } from 'react'
import StatusBadge from '@/components/StatusBadge'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Payment {
  id: string; amount: number; virtualAccountNo: string; bankName: string
  dueDate: string; paidAt?: string | null; settledAt?: string | null; status: string; createdAt: string
  application: {
    activity: { title: string }
    student: { user: { name: string }; school: { name: string } }
  }
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, revenue: 0 })

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    const params = statusFilter ? `?status=${statusFilter}` : ''
    const res = await fetch(`/api/payments${params}`)
    const data = await res.json()
    if (data.success) {
      setPayments(data.data)
      const all = await fetch('/api/payments').then(r => r.json())
      if (all.success) {
        const paid = all.data.filter((p: Payment) => ['PAID', 'SETTLED'].includes(p.status))
        const pending = all.data.filter((p: Payment) => p.status === 'PENDING')
        setStats({
          total: all.data.length,
          paid: paid.length,
          pending: pending.length,
          revenue: paid.reduce((sum: number, p: Payment) => sum + p.amount, 0),
        })
      }
    }
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  const handleConfirm = async (paymentId: string) => {
    const res = await fetch(`/api/payments/${paymentId}/confirm`, { method: 'POST' })
    if ((await res.json()).success) fetchPayments()
  }

  const handleSettle = async (paymentId: string) => {
    const res = await fetch(`/api/payments/${paymentId}/confirm`, { method: 'PUT' })
    if ((await res.json()).success) fetchPayments()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">결제/정산 관리</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-xs text-gray-500">전체</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.total}건</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <p className="text-xs text-gray-500">납부 완료</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.paid}건</p>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
          <p className="text-xs text-gray-500">미납</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{stats.pending}건</p>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
          <p className="text-xs text-gray-500">총 수납액</p>
          <p className="text-xl font-bold text-purple-600 mt-1">{formatCurrency(stats.revenue)}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <select className="input w-36" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">전체 상태</option>
          <option value="PENDING">미납</option>
          <option value="PAID">납부완료</option>
          <option value="SETTLED">정산완료</option>
          <option value="EXPIRED">만료</option>
        </select>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['학생', '학교', '활동명', '금액', '가상계좌', '납부기한', '상태', '관리'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => <tr key={i} className="border-b"><td colSpan={8} className="py-3 px-4"><div className="h-4 bg-gray-200 rounded animate-pulse" /></td></tr>)
              ) : payments.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">결제 내역이 없습니다.</td></tr>
              ) : payments.map((pay) => (
                <tr key={pay.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{pay.application.student.user.name}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{pay.application.student.school.name}</td>
                  <td className="py-3 px-4 text-xs max-w-40 truncate">{pay.application.activity.title}</td>
                  <td className="py-3 px-4 font-semibold">{formatCurrency(pay.amount)}</td>
                  <td className="py-3 px-4 text-xs text-blue-600 font-mono">{pay.virtualAccountNo}</td>
                  <td className="py-3 px-4 text-xs text-gray-500">{formatDate(pay.dueDate)}</td>
                  <td className="py-3 px-4"><StatusBadge status={pay.status as 'PENDING' | 'PAID' | 'SETTLED' | 'EXPIRED'} /></td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      {pay.status === 'PENDING' && (
                        <button onClick={() => handleConfirm(pay.id)} className="text-xs text-green-600 hover:underline">입금확인</button>
                      )}
                      {pay.status === 'PAID' && (
                        <button onClick={() => handleSettle(pay.id)} className="text-xs text-purple-600 hover:underline">정산처리</button>
                      )}
                    </div>
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

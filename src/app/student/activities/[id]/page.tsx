'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import StatusBadge from '@/components/StatusBadge'
import VirtualAccountInfo from '@/components/VirtualAccountInfo'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Activity {
  id: string; title: string; description: string; category: string
  startDate: string; endDate: string; location: string; fee: number
  capacity: number; status: string; targetGrades: string[]
  requireParentConsent: boolean
  _count: { applications: number }
}

interface Application { id: string; status: string; payment?: { id: string; amount: number; virtualAccountNo: string; bankName: string; accountHolder: string; dueDate: string; status: string; paidAt?: string | null } }

export default function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [activity, setActivity] = useState<Activity | null>(null)
  const [myApp, setMyApp] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    Promise.all([
      fetch(`/api/activities/${id}`).then(r => r.json()),
      fetch('/api/applications').then(r => r.json()),
    ]).then(([actData, appData]) => {
      if (actData.success) setActivity(actData.data)
      if (appData.success) {
        const found = appData.data.find((a: { activityId: string }) => a.activityId === id)
        if (found) setMyApp(found)
      }
      setLoading(false)
    })
  }, [id])

  const handleApply = async () => {
    setApplying(true)
    setMessage('')
    const res = await fetch(`/api/activities/${id}/apply`, { method: 'POST' })
    const data = await res.json()
    if (data.success) {
      setMessage(data.data.isWaitlist ? '대기자로 등록되었습니다.' : '신청이 완료되었습니다!')
      router.refresh()
      setTimeout(() => window.location.reload(), 1000)
    } else {
      setMessage(data.error)
    }
    setApplying(false)
  }

  const handleCancel = async () => {
    if (!myApp || !confirm('신청을 취소하시겠습니까?')) return
    const res = await fetch(`/api/applications/${myApp.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel' }),
    })
    const data = await res.json()
    if (data.success) {
      setMessage('신청이 취소되었습니다.')
      setTimeout(() => window.location.reload(), 1000)
    }
  }

  const handlePaymentConfirm = async () => {
    if (!myApp?.payment) return
    const res = await fetch(`/api/payments/${myApp.payment.id}/confirm`, { method: 'POST' })
    const data = await res.json()
    if (data.success) {
      setMessage('입금이 확인되었습니다!')
      setTimeout(() => window.location.reload(), 1000)
    }
  }

  if (loading) return <div className="flex justify-center p-12"><div className="text-gray-400">로딩 중...</div></div>
  if (!activity) return <div className="card text-center py-12 text-gray-400">활동을 찾을 수 없습니다.</div>

  const isFull = activity._count.applications >= activity.capacity

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm">
        ← 목록으로
      </button>

      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{activity.category}</span>
          <StatusBadge status={activity.status as 'OPEN'} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{activity.title}</h1>
        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <div>
            <span className="text-gray-500 block">일정</span>
            <span className="font-medium">{formatDate(activity.startDate)} ~ {formatDate(activity.endDate)}</span>
          </div>
          <div>
            <span className="text-gray-500 block">장소</span>
            <span className="font-medium">{activity.location}</span>
          </div>
          <div>
            <span className="text-gray-500 block">활동비</span>
            <span className="font-bold text-blue-600">{activity.fee === 0 ? '무료' : formatCurrency(activity.fee)}</span>
          </div>
          <div>
            <span className="text-gray-500 block">신청 현황</span>
            <span className={`font-medium ${isFull ? 'text-red-600' : 'text-green-600'}`}>
              {activity._count.applications}/{activity.capacity}명
              {isFull && ' (대기자 신청 가능)'}
            </span>
          </div>
          {activity.targetGrades.length > 0 && (
            <div className="col-span-2">
              <span className="text-gray-500 block">대상 학년</span>
              <span className="font-medium">{activity.targetGrades.join(', ')}</span>
            </div>
          )}
        </div>
        <div className="prose prose-sm max-w-none text-gray-600 bg-gray-50 rounded-lg p-4 mb-6 whitespace-pre-wrap">
          {activity.description}
        </div>

        {message && (
          <div className={`px-4 py-3 rounded-lg text-sm mb-4 ${message.includes('완료') || message.includes('등록') || message.includes('확인') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        {myApp ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">신청 상태:</span>
              <StatusBadge status={myApp.status as 'CONFIRMED' | 'WAITLIST' | 'CANCELLED'} />
            </div>
            {myApp.payment && <VirtualAccountInfo payment={myApp.payment} />}
            {myApp.payment?.status === 'PENDING' && (
              <button onClick={handlePaymentConfirm} className="btn-primary w-full">
                [테스트] 입금 확인 처리
              </button>
            )}
            {['CONFIRMED', 'WAITLIST', 'PENDING'].includes(myApp.status) && (
              <button onClick={handleCancel} className="btn-secondary w-full text-red-600 border-red-200 hover:bg-red-50">
                신청 취소
              </button>
            )}
          </div>
        ) : activity.status === 'OPEN' ? (
          <button onClick={handleApply} disabled={applying} className="btn-primary w-full">
            {applying ? '처리 중...' : isFull ? '대기자 신청하기' : '신청하기'}
          </button>
        ) : (
          <div className="text-center py-4 text-gray-400">신청 불가 ({activity.status})</div>
        )}
      </div>
    </div>
  )
}

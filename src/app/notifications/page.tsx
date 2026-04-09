'use client'
import { useState, useEffect } from 'react'
import { formatDateTime } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string; type: string; title: string; message: string; isRead: boolean; sentAt: string
}

const TYPE_ICONS: Record<string, string> = {
  ACTIVITY_APPLIED: '📝',
  ACTIVITY_CONFIRMED: '✅',
  ACTIVITY_CANCELLED: '❌',
  PAYMENT_REQUEST: '💳',
  PAYMENT_CONFIRMED: '💰',
  PAYMENT_OVERDUE: '⚠️',
  ANNOUNCEMENT: '📢',
  SYSTEM: '⚙️',
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(d => { if (d.success) setNotifications(d.data) })
      .finally(() => setLoading(false))
  }, [])

  const markAllRead = async () => {
    await fetch('/api/notifications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">←</button>
            <h1 className="text-xl font-bold text-gray-900">알림</h1>
          </div>
          <button onClick={markAllRead} className="text-sm text-blue-600 hover:underline">모두 읽음</button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="card animate-pulse h-16" />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">알림이 없습니다.</div>
        ) : (
          <div className="space-y-2">
            {notifications.map((noti) => (
              <div key={noti.id} className={`card py-4 ${!noti.isRead ? 'border-l-4 border-l-blue-500' : ''}`}>
                <div className="flex items-start gap-3">
                  <span className="text-xl">{TYPE_ICONS[noti.type] || '🔔'}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{noti.title}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{noti.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDateTime(noti.sentAt)}</p>
                  </div>
                  {!noti.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

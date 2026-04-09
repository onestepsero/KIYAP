import Link from 'next/link'
import { formatDate, formatCurrency } from '@/lib/utils'
import StatusBadge from './StatusBadge'

interface Activity {
  id: string
  title: string
  category: string
  startDate: string | Date
  endDate: string | Date
  location: string
  fee: number
  capacity: number
  status: string
  _count?: { applications: number }
}

export default function ActivityCard({ activity, basePath = '/student' }: { activity: Activity; basePath?: string }) {
  const applied = activity._count?.applications || 0
  const isFull = applied >= activity.capacity
  const percent = Math.min(100, Math.round((applied / activity.capacity) * 100))

  return (
    <Link href={`${basePath}/activities/${activity.id}`} className="card hover:shadow-md transition-shadow block">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
          {activity.category}
        </span>
        <StatusBadge status={activity.status as 'OPEN' | 'CLOSED' | 'COMPLETED' | 'DRAFT' | 'CANCELLED'} />
      </div>
      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{activity.title}</h3>
      <div className="space-y-1 text-sm text-gray-500 mb-3">
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatDate(activity.startDate)}
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          {activity.location}
        </div>
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-900">
          {activity.fee === 0 ? '무료' : formatCurrency(activity.fee)}
        </span>
        <span className={`text-xs ${isFull ? 'text-red-600' : 'text-gray-500'}`}>
          {applied}/{activity.capacity}명
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all ${isFull ? 'bg-red-400' : 'bg-blue-500'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </Link>
  )
}

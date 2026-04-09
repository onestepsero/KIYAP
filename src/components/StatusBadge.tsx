import { STATUS_LABELS, STATUS_COLORS } from '@/types'

type StatusKey = keyof typeof STATUS_LABELS

export default function StatusBadge({ status }: { status: StatusKey }) {
  return (
    <span className={`badge ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}

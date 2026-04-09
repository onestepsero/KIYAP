export type UserRole = 'STUDENT' | 'PARENT' | 'TEACHER' | 'ADMIN'

export interface JWTPayload {
  userId: string
  email: string
  role: UserRole
  name: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export type ActivityCategory =
  | '캠프'
  | '교육'
  | '봉사'
  | '진로'
  | '체육'
  | '문화예술'
  | '국제교류'
  | '생활기술'
  | '독서/토론'
  | '과학기술'

export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  '캠프', '교육', '봉사', '진로', '체육', '문화예술', '국제교류', '생활기술', '독서/토론', '과학기술',
]

export const STATUS_LABELS = {
  PENDING: '대기중',
  CONFIRMED: '확정',
  WAITLIST: '대기자',
  CANCELLED: '취소',
  PAID: '납부완료',
  SETTLED: '정산완료',
  EXPIRED: '기간만료',
  REFUNDED: '환불',
  OPEN: '모집중',
  CLOSED: '마감',
  DRAFT: '임시저장',
  COMPLETED: '완료',
} as const

export const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  WAITLIST: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-red-100 text-red-800',
  PAID: 'bg-green-100 text-green-800',
  SETTLED: 'bg-purple-100 text-purple-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
  REFUNDED: 'bg-orange-100 text-orange-800',
  OPEN: 'bg-green-100 text-green-800',
  CLOSED: 'bg-red-100 text-red-800',
  DRAFT: 'bg-gray-100 text-gray-600',
  COMPLETED: 'bg-blue-100 text-blue-800',
} as const

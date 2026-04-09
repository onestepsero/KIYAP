import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import StatusBadge from '@/components/StatusBadge'
import VirtualAccountInfo from '@/components/VirtualAccountInfo'
import { formatDate, formatCurrency } from '@/lib/utils'

export default async function ParentDashboard() {
  const authUser = await getAuthUser()
  if (!authUser) return null

  const parent = await prisma.parent.findUnique({
    where: { userId: authUser.userId },
    include: {
      children: {
        include: {
          user: true,
          school: true,
          applications: {
            include: { activity: true, payment: true },
            where: { status: { in: ['CONFIRMED', 'WAITLIST', 'PENDING'] } },
            orderBy: { appliedAt: 'desc' },
          },
        },
      },
    },
  })

  if (!parent) return <div className="card text-center py-12 text-gray-400">연결된 자녀 계정이 없습니다.</div>

  const allApplications = parent.children.flatMap(c => c.applications)
  const pendingPayments = allApplications.filter(a => a.payment?.status === 'PENDING')
  const totalPending = pendingPayments.reduce((sum, a) => sum + (a.payment?.amount || 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">학부모 대시보드</h1>
        <p className="text-gray-500">자녀 {parent.children.length}명의 활동 현황</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
          <p className="text-sm text-gray-500">신청 활동 합계</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{allApplications.length}개</p>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-5">
          <p className="text-sm text-gray-500">미납 건수</p>
          <p className="text-3xl font-bold text-orange-600 mt-1">{pendingPayments.length}건</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-5">
          <p className="text-sm text-gray-500">미납 총액</p>
          <p className="text-3xl font-bold text-red-600 mt-1">{formatCurrency(totalPending)}</p>
        </div>
      </div>

      {parent.children.map((child) => (
        <div key={child.id} className="card">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
              {child.user.name.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{child.user.name}</p>
              <p className="text-sm text-gray-500">{child.school.name} {child.grade}학년 {child.class}반</p>
            </div>
          </div>

          {child.applications.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">신청한 활동이 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {child.applications.map((app) => (
                <div key={app.id} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={app.status as 'CONFIRMED' | 'WAITLIST' | 'PENDING'} />
                      </div>
                      <h4 className="font-medium text-gray-900">{app.activity.title}</h4>
                      <p className="text-sm text-gray-500">{formatDate(app.activity.startDate)}</p>
                    </div>
                    <span className="font-semibold">
                      {app.activity.fee === 0 ? '무료' : formatCurrency(app.activity.fee)}
                    </span>
                  </div>
                  {app.payment && <VirtualAccountInfo payment={app.payment} />}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

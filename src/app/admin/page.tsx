import { prisma } from '@/lib/db'
import StatsCard from '@/components/StatsCard'
import StatusBadge from '@/components/StatusBadge'
import { formatDate, formatCurrency } from '@/lib/utils'

export default async function AdminDashboard() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalUsers, newUsers, openActivities,
    totalApplications, waitlistCount,
    paymentStats, paidCount, pendingCount,
    recentApplications, categoryStats,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.activity.count({ where: { status: 'OPEN' } }),
    prisma.application.count({ where: { status: { not: 'CANCELLED' } } }),
    prisma.application.count({ where: { status: 'WAITLIST' } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: { in: ['PAID', 'SETTLED'] } } }),
    prisma.payment.count({ where: { status: { in: ['PAID', 'SETTLED'] } } }),
    prisma.payment.count({ where: { status: 'PENDING' } }),
    prisma.application.findMany({
      take: 8, orderBy: { appliedAt: 'desc' },
      include: { student: { include: { user: true } }, activity: { select: { title: true } } },
    }),
    prisma.activity.groupBy({ by: ['category'], _count: { id: true }, orderBy: { _count: { id: 'desc' } } }),
  ])

  const totalRevenue = paymentStats._sum.amount || 0
  const paymentRate = (paidCount + pendingCount) > 0
    ? Math.round((paidCount / (paidCount + pendingCount)) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
        <p className="text-gray-500">한국청소년인천연맹 플랫폼 현황</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="전체 회원" value={totalUsers.toLocaleString()} subtitle={`이번 달 +${newUsers}명`} color="blue" />
        <StatsCard title="모집 중 활동" value={openActivities} color="green" />
        <StatsCard title="총 신청 건수" value={totalApplications.toLocaleString()} subtitle={`대기자 ${waitlistCount}명`} color="purple" />
        <StatsCard title="수납 현황" value={`${paymentRate}%`} subtitle={formatCurrency(totalRevenue)} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h2 className="font-semibold text-gray-900 mb-4">최근 신청 현황</h2>
          <div className="space-y-2">
            {recentApplications.map((app) => (
              <div key={app.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold">
                    {app.student.user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{app.student.user.name}</p>
                    <p className="text-xs text-gray-400">{app.activity.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{formatDate(app.appliedAt)}</span>
                  <StatusBadge status={app.status as 'CONFIRMED' | 'WAITLIST' | 'CANCELLED'} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">카테고리별 활동</h2>
            <div className="space-y-2">
              {categoryStats.map((stat) => (
                <div key={stat.category} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{stat.category}</span>
                  <span className="text-sm font-semibold text-blue-600">{stat._count.id}개</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-3">결제 현황</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">납부 완료</span>
                <span className="font-semibold text-green-600">{paidCount}건</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">미납</span>
                <span className="font-semibold text-orange-600">{pendingCount}건</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">납부율</span>
                <span className="font-bold text-blue-600">{paymentRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${paymentRate}%` }} />
              </div>
              <div className="flex justify-between text-sm pt-1 border-t border-gray-100">
                <span className="text-gray-500">총 수납액</span>
                <span className="font-bold">{formatCurrency(totalRevenue)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

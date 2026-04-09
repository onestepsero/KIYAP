import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import VirtualAccountInfo from '@/components/VirtualAccountInfo'
import { formatDate } from '@/lib/utils'

export default async function StudentDashboard() {
  const authUser = await getAuthUser()
  if (!authUser) return null

  const student = await prisma.student.findUnique({
    where: { userId: authUser.userId },
    include: { school: true },
  })

  const applications = student
    ? await prisma.application.findMany({
        where: { studentId: student.id, status: { in: ['CONFIRMED', 'PENDING', 'WAITLIST'] } },
        include: { activity: true, payment: true },
        orderBy: { appliedAt: 'desc' },
        take: 5,
      })
    : []

  const notifications = await prisma.notification.findMany({
    where: { userId: authUser.userId, isRead: false },
    orderBy: { sentAt: 'desc' },
    take: 5,
  })

  const upcomingActivities = await prisma.activity.findMany({
    where: { status: 'OPEN', startDate: { gte: new Date() } },
    orderBy: { startDate: 'asc' },
    take: 3,
    include: { _count: { select: { applications: { where: { status: { in: ['CONFIRMED', 'PENDING'] } } } } } },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">안녕하세요, {authUser.name}님!</h1>
        {student && <p className="text-gray-500">{student.school.name} {student.grade}학년 {student.class}반</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
          <p className="text-sm text-gray-500">신청 활동</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{applications.length}개</p>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-5">
          <p className="text-sm text-gray-500">미납 활동비</p>
          <p className="text-3xl font-bold text-orange-600 mt-1">
            {applications.filter(a => a.payment?.status === 'PENDING').length}건
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-5">
          <p className="text-sm text-gray-500">읽지 않은 알림</p>
          <p className="text-3xl font-bold text-purple-600 mt-1">{notifications.length}개</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">내 신청 활동</h2>
            <Link href="/student/applications" className="text-sm text-blue-600 hover:underline">전체 보기</Link>
          </div>
          {applications.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="mb-3">신청한 활동이 없습니다.</p>
              <Link href="/student/activities" className="btn-primary text-sm">활동 탐색하기</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div key={app.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{app.activity.title}</p>
                    <p className="text-xs text-gray-400">{formatDate(app.activity.startDate)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={app.status as 'PENDING' | 'CONFIRMED' | 'WAITLIST' | 'CANCELLED'} />
                    {app.payment && app.payment.status === 'PENDING' && (
                      <span className="badge bg-orange-100 text-orange-700">미납</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {applications.filter(a => a.payment?.status === 'PENDING').slice(0, 1).map((app) => (
            app.payment && (
              <div key={app.id} className="card">
                <h3 className="font-semibold text-gray-900 mb-3">
                  결제 대기 - {app.activity.title}
                </h3>
                <VirtualAccountInfo payment={app.payment} />
                <form action={`/api/payments/${app.payment!.id}/confirm`} method="POST" className="mt-3">
                  <button
                    formAction={`/api/payments/${app.payment!.id}/confirm`}
                    className="btn-primary text-sm w-full"
                    onClick={async (e) => {
                      e.preventDefault()
                      const res = await fetch(`/api/payments/${app.payment!.id}/confirm`, { method: 'POST' })
                      const data = await res.json()
                      if (data.success) window.location.reload()
                      else alert(data.error)
                    }}
                  >
                    [테스트] 입금 확인 처리
                  </button>
                </form>
              </div>
            )
          ))}

          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">모집 중인 활동</h2>
            <div className="space-y-3">
              {upcomingActivities.map((act) => (
                <Link key={act.id} href={`/student/activities/${act.id}`}
                  className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{act.title}</p>
                    <p className="text-xs text-gray-400">{act.category} · {formatDate(act.startDate)}</p>
                  </div>
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    {act._count.applications}/{act.capacity}
                  </span>
                </Link>
              ))}
            </div>
            <Link href="/student/activities" className="block text-center text-sm text-blue-600 hover:underline mt-4">
              모든 활동 보기 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

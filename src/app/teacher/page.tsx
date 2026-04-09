import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import StatusBadge from '@/components/StatusBadge'
import { formatDate } from '@/lib/utils'

export default async function TeacherDashboard() {
  const authUser = await getAuthUser()
  if (!authUser) return null

  const teacher = await prisma.teacher.findUnique({
    where: { userId: authUser.userId },
    include: { school: true },
  })
  if (!teacher) return <div className="card text-center py-12 text-gray-400">교사 정보를 찾을 수 없습니다.</div>

  const students = await prisma.student.findMany({
    where: { schoolId: teacher.schoolId },
    include: {
      user: true,
      applications: {
        include: { activity: true, payment: true },
        where: { status: { not: 'CANCELLED' } },
        orderBy: { appliedAt: 'desc' },
      },
    },
    orderBy: [{ grade: 'asc' }, { class: 'asc' }],
  })

  const totalStudents = students.length
  const activeStudents = students.filter(s => s.applications.length > 0).length
  const pendingPayStudents = students.filter(s => s.applications.some(a => a.payment?.status === 'PENDING')).length
  const allApplications = students.flatMap(s => s.applications)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">교사 대시보드</h1>
        <p className="text-gray-500">{teacher.school.name} 학생 현황</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-xs text-gray-500">전체 학생</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{totalStudents}명</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <p className="text-xs text-gray-500">활동 참여</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{activeStudents}명</p>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
          <p className="text-xs text-gray-500">미납 학생</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{pendingPayStudents}명</p>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
          <p className="text-xs text-gray-500">총 신청 수</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{allApplications.length}건</p>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">학생별 활동 현황</h2>
        {students.length === 0 ? (
          <p className="text-center text-gray-400 py-8">소속 학생이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">학년/반</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">이름</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">신청 활동</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">결제 상태</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const latestApp = student.applications[0]
                  const hasPending = student.applications.some(a => a.payment?.status === 'PENDING')
                  return (
                    <tr key={student.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 px-3 text-gray-500">{student.grade}-{student.class}</td>
                      <td className="py-2 px-3 font-medium">{student.user.name}</td>
                      <td className="py-2 px-3">
                        {student.applications.length === 0 ? (
                          <span className="text-gray-400">없음</span>
                        ) : (
                          <div>
                            <p className="text-gray-900">{latestApp.activity.title}</p>
                            <p className="text-xs text-gray-400">{formatDate(latestApp.activity.startDate)}</p>
                            {student.applications.length > 1 && (
                              <p className="text-xs text-blue-600">+{student.applications.length - 1}개 더</p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {student.applications.length === 0 ? '-' : (
                          hasPending
                            ? <span className="badge bg-orange-100 text-orange-700">미납</span>
                            : <span className="badge bg-green-100 text-green-700">완료</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">최근 활동 신청 현황</h2>
        <div className="space-y-2">
          {allApplications.slice(0, 10).map((app) => (
            <div key={app.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium">{app.activity.title}</p>
                <p className="text-xs text-gray-400">{formatDate(app.appliedAt)}</p>
              </div>
              <StatusBadge status={app.status as 'CONFIRMED' | 'WAITLIST' | 'CANCELLED'} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

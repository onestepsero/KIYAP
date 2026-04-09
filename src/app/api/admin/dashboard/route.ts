import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser || authUser.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: '권한이 없습니다.' }, { status: 403 })
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalUsers,
    newUsersThisMonth,
    totalActivities,
    openActivities,
    totalApplications,
    pendingApplications,
    totalPayments,
    paidPayments,
    pendingPayments,
    recentApplications,
    categoryStats,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.activity.count(),
    prisma.activity.count({ where: { status: 'OPEN' } }),
    prisma.application.count(),
    prisma.application.count({ where: { status: 'WAITLIST' } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: { in: ['PAID', 'SETTLED'] } } }),
    prisma.payment.count({ where: { status: { in: ['PAID', 'SETTLED'] } } }),
    prisma.payment.count({ where: { status: 'PENDING' } }),
    prisma.application.findMany({
      take: 5,
      orderBy: { appliedAt: 'desc' },
      include: {
        student: { include: { user: true } },
        activity: { select: { title: true } },
      },
    }),
    prisma.activity.groupBy({
      by: ['category'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
  ])

  const totalRevenue = totalPayments._sum.amount || 0
  const paymentRate = (paidPayments + pendingPayments) > 0
    ? Math.round((paidPayments / (paidPayments + pendingPayments)) * 100)
    : 0

  return NextResponse.json({
    success: true,
    data: {
      users: { total: totalUsers, newThisMonth: newUsersThisMonth },
      activities: { total: totalActivities, open: openActivities },
      applications: { total: totalApplications, waitlist: pendingApplications },
      payments: {
        totalRevenue,
        paidCount: paidPayments,
        pendingCount: pendingPayments,
        paymentRate,
      },
      recentApplications,
      categoryStats,
    },
  })
}

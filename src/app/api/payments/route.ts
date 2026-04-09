import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser) return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  let payments

  if (authUser.role === 'STUDENT') {
    const student = await prisma.student.findUnique({ where: { userId: authUser.userId } })
    payments = await prisma.payment.findMany({
      where: {
        application: { studentId: student?.id },
        ...(status ? { status: status as 'PENDING' | 'PAID' | 'SETTLED' | 'EXPIRED' | 'REFUNDED' } : {}),
      },
      include: { application: { include: { activity: true } } },
      orderBy: { createdAt: 'desc' },
    })
  } else if (authUser.role === 'PARENT') {
    const parent = await prisma.parent.findUnique({
      where: { userId: authUser.userId },
      include: { children: true },
    })
    payments = await prisma.payment.findMany({
      where: {
        application: { studentId: { in: parent?.children.map((c) => c.id) || [] } },
        ...(status ? { status: status as 'PENDING' | 'PAID' | 'SETTLED' | 'EXPIRED' | 'REFUNDED' } : {}),
      },
      include: { application: { include: { activity: true, student: { include: { user: true } } } } },
      orderBy: { createdAt: 'desc' },
    })
  } else if (authUser.role === 'ADMIN') {
    const activityId = searchParams.get('activityId')
    payments = await prisma.payment.findMany({
      where: {
        ...(activityId ? { application: { activityId } } : {}),
        ...(status ? { status: status as 'PENDING' | 'PAID' | 'SETTLED' | 'EXPIRED' | 'REFUNDED' } : {}),
      },
      include: {
        application: {
          include: {
            activity: true,
            student: { include: { user: true, school: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  } else {
    return NextResponse.json({ success: false, error: '권한 없음' }, { status: 403 })
  }

  return NextResponse.json({ success: true, data: payments })
}

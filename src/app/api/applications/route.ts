import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser) return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const statusFilter = searchParams.get('status')

  let applications

  if (authUser.role === 'STUDENT') {
    const student = await prisma.student.findUnique({ where: { userId: authUser.userId } })
    if (!student) return NextResponse.json({ success: true, data: [] })

    applications = await prisma.application.findMany({
      where: {
        studentId: student.id,
        ...(statusFilter ? { status: statusFilter as 'PENDING' | 'CONFIRMED' | 'WAITLIST' | 'CANCELLED' } : {}),
      },
      include: { activity: true, payment: true },
      orderBy: { appliedAt: 'desc' },
    })
  } else if (authUser.role === 'ADMIN') {
    const activityId = searchParams.get('activityId')
    applications = await prisma.application.findMany({
      where: {
        ...(activityId ? { activityId } : {}),
        ...(statusFilter ? { status: statusFilter as 'PENDING' | 'CONFIRMED' | 'WAITLIST' | 'CANCELLED' } : {}),
      },
      include: {
        activity: true,
        student: { include: { user: true, school: true } },
        payment: true,
      },
      orderBy: { appliedAt: 'desc' },
    })
  } else if (authUser.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({ where: { userId: authUser.userId } })
    if (!teacher) return NextResponse.json({ success: true, data: [] })

    applications = await prisma.application.findMany({
      where: { student: { schoolId: teacher.schoolId } },
      include: {
        activity: true,
        student: { include: { user: true } },
        payment: true,
      },
      orderBy: { appliedAt: 'desc' },
    })
  } else if (authUser.role === 'PARENT') {
    const parent = await prisma.parent.findUnique({
      where: { userId: authUser.userId },
      include: { children: true },
    })
    if (!parent) return NextResponse.json({ success: true, data: [] })

    applications = await prisma.application.findMany({
      where: { studentId: { in: parent.children.map((c) => c.id) } },
      include: {
        activity: true,
        student: { include: { user: true } },
        payment: true,
      },
      orderBy: { appliedAt: 'desc' },
    })
  } else {
    return NextResponse.json({ success: false, error: '권한 없음' }, { status: 403 })
  }

  return NextResponse.json({ success: true, data: applications })
}

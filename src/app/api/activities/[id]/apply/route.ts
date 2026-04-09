import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateVirtualAccount } from '@/lib/virtual-account'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser || authUser.role !== 'STUDENT') {
    return NextResponse.json({ success: false, error: '학생만 신청할 수 있습니다.' }, { status: 403 })
  }

  const { id: activityId } = await params

  const student = await prisma.student.findUnique({ where: { userId: authUser.userId } })
  if (!student) return NextResponse.json({ success: false, error: '학생 정보를 찾을 수 없습니다.' }, { status: 404 })

  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: {
      _count: { select: { applications: { where: { status: { in: ['CONFIRMED', 'PENDING'] } } } } },
    },
  })
  if (!activity || activity.status !== 'OPEN') {
    return NextResponse.json({ success: false, error: '신청할 수 없는 활동입니다.' }, { status: 400 })
  }

  const existing = await prisma.application.findUnique({
    where: { studentId_activityId: { studentId: student.id, activityId } },
  })
  if (existing) {
    return NextResponse.json({ success: false, error: '이미 신청한 활동입니다.' }, { status: 409 })
  }

  const confirmedCount = activity._count.applications
  const isWaitlist = confirmedCount >= activity.capacity

  const application = await prisma.application.create({
    data: {
      studentId: student.id,
      activityId,
      status: isWaitlist ? 'WAITLIST' : 'CONFIRMED',
    },
  })

  // 활동비가 있고, 대기가 아닌 경우 가상계좌 발급
  if (activity.fee > 0 && !isWaitlist) {
    const { bankName, accountNo, dueDate } = generateVirtualAccount()
    await prisma.payment.create({
      data: {
        applicationId: application.id,
        amount: activity.fee,
        virtualAccountNo: accountNo,
        bankName,
        dueDate,
        status: 'PENDING',
      },
    })
  }

  // 알림 생성
  await prisma.notification.create({
    data: {
      userId: authUser.userId,
      type: 'ACTIVITY_APPLIED',
      title: '활동 신청 완료',
      message: `"${activity.title}" ${isWaitlist ? '대기자로 등록' : '신청이 완료'}되었습니다.`,
    },
  })

  return NextResponse.json({
    success: true,
    data: { applicationId: application.id, status: application.status, isWaitlist },
  }, { status: 201 })
}

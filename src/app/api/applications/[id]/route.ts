import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateVirtualAccount } from '@/lib/virtual-account'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser) return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 })

  const { id } = await params
  const { action, cancelReason } = await req.json()

  const application = await prisma.application.findUnique({
    where: { id },
    include: { activity: true, student: { include: { user: true } }, payment: true },
  })
  if (!application) return NextResponse.json({ success: false, error: '신청 내역을 찾을 수 없습니다.' }, { status: 404 })

  if (action === 'cancel') {
    if (authUser.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: authUser.userId } })
      if (application.studentId !== student?.id) {
        return NextResponse.json({ success: false, error: '권한이 없습니다.' }, { status: 403 })
      }
    }

    await prisma.application.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason },
    })

    if (application.payment) {
      await prisma.payment.update({
        where: { id: application.payment.id },
        data: { status: 'REFUNDED' },
      })
    }

    // 대기자 자동 승격
    const waitlisted = await prisma.application.findFirst({
      where: { activityId: application.activityId, status: 'WAITLIST' },
      orderBy: { appliedAt: 'asc' },
    })

    if (waitlisted) {
      await prisma.application.update({ where: { id: waitlisted.id }, data: { status: 'CONFIRMED' } })

      if (application.activity.fee > 0) {
        const { bankName, accountNo, dueDate } = generateVirtualAccount()
        await prisma.payment.create({
          data: {
            applicationId: waitlisted.id,
            amount: application.activity.fee,
            virtualAccountNo: accountNo,
            bankName,
            dueDate,
            status: 'PENDING',
          },
        })
      }

      const waitStudent = await prisma.student.findUnique({
        where: { id: waitlisted.studentId },
        include: { user: true },
      })
      if (waitStudent) {
        await prisma.notification.create({
          data: {
            userId: waitStudent.user.id,
            type: 'ACTIVITY_CONFIRMED',
            title: '대기자 → 확정',
            message: `"${application.activity.title}" 활동이 확정되었습니다!`,
          },
        })
      }
    }

    return NextResponse.json({ success: true, message: '취소 완료' })
  }

  if (action === 'confirm' && authUser.role === 'ADMIN') {
    await prisma.application.update({ where: { id }, data: { status: 'CONFIRMED' } })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ success: false, error: '잘못된 요청입니다.' }, { status: 400 })
}

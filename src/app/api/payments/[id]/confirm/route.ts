import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Mock: 입금 확인 처리 (실제 PG 연동 시 webhook으로 처리)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser) return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 })

  const { id } = await params

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { application: { include: { activity: true, student: { include: { user: true } } } } },
  })
  if (!payment) return NextResponse.json({ success: false, error: '결제 정보를 찾을 수 없습니다.' }, { status: 404 })

  if (payment.status !== 'PENDING') {
    return NextResponse.json({ success: false, error: '이미 처리된 결제입니다.' }, { status: 400 })
  }

  const updated = await prisma.payment.update({
    where: { id },
    data: { status: 'PAID', paidAt: new Date() },
  })

  await prisma.notification.create({
    data: {
      userId: payment.application.student.user.id,
      type: 'PAYMENT_CONFIRMED',
      title: '결제 확인 완료',
      message: `"${payment.application.activity.title}" 활동비 ${payment.amount.toLocaleString('ko-KR')}원 납부가 확인되었습니다.`,
    },
  })

  return NextResponse.json({ success: true, data: updated })
}

// 관리자: 정산 완료 처리
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser || authUser.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: '권한이 없습니다.' }, { status: 403 })
  }

  const { id } = await params
  const payment = await prisma.payment.findUnique({ where: { id } })
  if (!payment || payment.status !== 'PAID') {
    return NextResponse.json({ success: false, error: '정산 가능한 결제가 아닙니다.' }, { status: 400 })
  }

  const updated = await prisma.payment.update({
    where: { id },
    data: { status: 'SETTLED', settledAt: new Date() },
  })

  return NextResponse.json({ success: true, data: updated })
}

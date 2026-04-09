import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser) return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 })

  const { id } = await params
  const activity = await prisma.activity.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          applications: { where: { status: { in: ['CONFIRMED', 'PENDING'] } } },
        },
      },
      applications: authUser.role === 'ADMIN'
        ? {
            include: {
              student: { include: { user: true, school: true } },
              payment: true,
            },
            orderBy: { appliedAt: 'asc' },
          }
        : false,
    },
  })

  if (!activity) return NextResponse.json({ success: false, error: '활동을 찾을 수 없습니다.' }, { status: 404 })
  return NextResponse.json({ success: true, data: activity })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser || authUser.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: '권한이 없습니다.' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()

  const activity = await prisma.activity.update({
    where: { id },
    data: {
      ...(body.title && { title: body.title }),
      ...(body.description && { description: body.description }),
      ...(body.category && { category: body.category }),
      ...(body.capacity && { capacity: parseInt(body.capacity) }),
      ...(body.startDate && { startDate: new Date(body.startDate) }),
      ...(body.endDate && { endDate: new Date(body.endDate) }),
      ...(body.location && { location: body.location }),
      ...(body.fee !== undefined && { fee: parseInt(body.fee) }),
      ...(body.targetGrades && { targetGrades: body.targetGrades }),
      ...(body.status && { status: body.status }),
    },
  })

  await prisma.auditLog.create({
    data: { userId: authUser.userId, action: 'UPDATE', resource: 'Activity', resourceId: id },
  })

  return NextResponse.json({ success: true, data: activity })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser || authUser.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: '권한이 없습니다.' }, { status: 403 })
  }

  const { id } = await params
  await prisma.activity.update({ where: { id }, data: { status: 'CANCELLED' } })

  await prisma.auditLog.create({
    data: { userId: authUser.userId, action: 'DELETE', resource: 'Activity', resourceId: id },
  })

  return NextResponse.json({ success: true })
}

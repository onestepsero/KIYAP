import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser) return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 })

  const notifications = await prisma.notification.findMany({
    where: { userId: authUser.userId },
    orderBy: { sentAt: 'desc' },
    take: 20,
  })

  const unreadCount = await prisma.notification.count({
    where: { userId: authUser.userId, isRead: false },
  })

  return NextResponse.json({ success: true, data: notifications, unreadCount })
}

export async function PUT(req: NextRequest) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser) return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 })

  const { ids } = await req.json()

  await prisma.notification.updateMany({
    where: {
      userId: authUser.userId,
      ...(ids ? { id: { in: ids } } : {}),
    },
    data: { isRead: true, readAt: new Date() },
  })

  return NextResponse.json({ success: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser || authUser.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: '권한이 없습니다.' }, { status: 403 })
  }

  const { id } = await params
  const { isApproved, isActive, role } = await req.json()

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(isApproved !== undefined && { isApproved }),
      ...(isActive !== undefined && { isActive }),
      ...(role && { role }),
    },
  })

  await prisma.auditLog.create({
    data: { userId: authUser.userId, action: 'UPDATE', resource: 'User', resourceId: id },
  })

  return NextResponse.json({ success: true, data: { id: user.id, isApproved: user.isApproved, isActive: user.isActive } })
}

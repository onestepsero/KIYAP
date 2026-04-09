import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser || !['ADMIN', 'TEACHER'].includes(authUser.role)) {
    return NextResponse.json({ success: false, error: '권한이 없습니다.' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role')
  const search = searchParams.get('search')
  const schoolId = searchParams.get('schoolId')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const where: Record<string, unknown> = {}
  if (role) where.role = role
  if (search) where.name = { contains: search, mode: 'insensitive' }

  if (authUser.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({ where: { userId: authUser.userId } })
    where.student = { schoolId: teacher?.schoolId }
    where.role = 'STUDENT'
  } else if (schoolId) {
    where.student = { schoolId }
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, email: true, name: true, phone: true, role: true,
        isApproved: true, isActive: true, createdAt: true,
        student: { include: { school: true } },
        teacher: { include: { school: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ])

  return NextResponse.json({
    success: true,
    data: users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

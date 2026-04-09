import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser) return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')

  const where: Record<string, unknown> = {}
  if (category) where.category = category
  if (status) where.status = status
  else if (authUser.role === 'STUDENT' || authUser.role === 'PARENT') where.status = 'OPEN'
  if (search) where.title = { contains: search, mode: 'insensitive' }

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      orderBy: { startDate: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { applications: { where: { status: { in: ['CONFIRMED', 'PENDING'] } } } } },
      },
    }),
    prisma.activity.count({ where }),
  ])

  return NextResponse.json({
    success: true,
    data: activities,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthUserFromRequest(req)
  if (!authUser || authUser.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: '권한이 없습니다.' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const activity = await prisma.activity.create({
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
        capacity: parseInt(body.capacity),
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        location: body.location,
        fee: parseInt(body.fee || '0'),
        targetGrades: body.targetGrades || [],
        status: body.status || 'DRAFT',
        requireParentConsent: body.requireParentConsent || false,
      },
    })

    await prisma.auditLog.create({
      data: { userId: authUser.userId, action: 'CREATE', resource: 'Activity', resourceId: activity.id },
    })

    return NextResponse.json({ success: true, data: activity }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ success: false, error: '활동 생성 실패' }, { status: 500 })
  }
}

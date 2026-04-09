import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const authUser = await getAuthUser()
  if (!authUser) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    include: {
      student: { include: { school: true, parent: { include: { user: true } } } },
      teacher: { include: { school: true } },
      parent: { include: { children: { include: { user: true, school: true } } } },
    },
  })

  if (!user) return NextResponse.json({ success: false, error: '사용자를 찾을 수 없습니다.' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _, ...safeUser } = user
  return NextResponse.json({ success: true, data: safeUser })
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set('kiyap_token', '', { maxAge: 0, path: '/' })
  return response
}

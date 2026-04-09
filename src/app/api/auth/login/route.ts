import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { signToken, setCookieToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ success: false, error: '이메일과 비밀번호를 입력해주세요.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json({ success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 })
    }

    if (!user.isApproved) {
      return NextResponse.json({ success: false, error: '관리자 승인 대기 중입니다.' }, { status: 403 })
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'STUDENT' | 'PARENT' | 'TEACHER' | 'ADMIN',
      name: user.name,
    })

    const { name: cookieName, value, options } = setCookieToken(token)
    const res = NextResponse.json({
      success: true,
      data: { role: user.role, name: user.name },
    })
    res.cookies.set(cookieName, value, options as Parameters<typeof res.cookies.set>[2])
    return res
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

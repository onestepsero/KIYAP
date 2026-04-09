import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, phone, schoolId, grade, classNum, parentPhone } = await req.json()

    if (!email || !password || !name || !schoolId || !grade || !classNum) {
      return NextResponse.json({ success: false, error: '필수 항목을 모두 입력해주세요.' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ success: false, error: '이미 사용 중인 이메일입니다.' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        phone,
        role: 'STUDENT',
        isApproved: true,
        student: {
          create: {
            schoolId,
            grade: parseInt(grade),
            class: parseInt(classNum),
          },
        },
      },
    })

    // Mock: 학부모 초대 SMS 발송 (실제 구현 시 SMS API 연동)
    if (parentPhone) {
      console.log(`[SMS Mock] 학부모 초대 발송 → ${parentPhone}`)
    }

    return NextResponse.json({ success: true, data: { id: user.id, email: user.email } }, { status: 201 })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

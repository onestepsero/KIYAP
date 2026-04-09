import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const schools = await prisma.school.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json({ success: true, data: schools })
}

import { PrismaClient, Role, ActivityStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Schools
  const schools = await Promise.all([
    prisma.school.upsert({
      where: { id: 'school-1' },
      update: {},
      create: { id: 'school-1', name: '인천송도초등학교', region: '인천', address: '인천광역시 연수구 송도동' },
    }),
    prisma.school.upsert({
      where: { id: 'school-2' },
      update: {},
      create: { id: 'school-2', name: '인천연수중학교', region: '인천', address: '인천광역시 연수구 연수동' },
    }),
    prisma.school.upsert({
      where: { id: 'school-3' },
      update: {},
      create: { id: 'school-3', name: '인천남고등학교', region: '인천', address: '인천광역시 남동구 구월동' },
    }),
    prisma.school.upsert({
      where: { id: 'school-4' },
      update: {},
      create: { id: 'school-4', name: '인천부평중학교', region: '인천', address: '인천광역시 부평구 부평동' },
    }),
    prisma.school.upsert({
      where: { id: 'school-5' },
      update: {},
      create: { id: 'school-5', name: '인천계양고등학교', region: '인천', address: '인천광역시 계양구 계산동' },
    }),
  ])
  console.log(`✅ ${schools.length} schools created`)

  const hash = (pw: string) => bcrypt.hashSync(pw, 10)

  // Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@youth.or.kr' },
    update: {},
    create: {
      email: 'admin@youth.or.kr',
      password: hash('admin1234'),
      name: '관리자',
      phone: '032-000-0001',
      role: Role.ADMIN,
      isApproved: true,
    },
  })
  console.log('✅ Admin created:', adminUser.email)

  // Teacher
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@school.kr' },
    update: {},
    create: {
      email: 'teacher@school.kr',
      password: hash('teacher1234'),
      name: '김선생',
      phone: '010-1111-2222',
      role: Role.TEACHER,
      isApproved: true,
    },
  })
  await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: { userId: teacherUser.id, schoolId: 'school-2' },
  })
  console.log('✅ Teacher created:', teacherUser.email)

  // Parent
  const parentUser = await prisma.user.upsert({
    where: { email: 'parent@email.com' },
    update: {},
    create: {
      email: 'parent@email.com',
      password: hash('parent1234'),
      name: '이학부',
      phone: '010-3333-4444',
      role: Role.PARENT,
      isApproved: true,
    },
  })
  const parentRecord = await prisma.parent.upsert({
    where: { userId: parentUser.id },
    update: {},
    create: { userId: parentUser.id },
  })
  console.log('✅ Parent created:', parentUser.email)

  // Student
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@email.com' },
    update: {},
    create: {
      email: 'student@email.com',
      password: hash('student1234'),
      name: '이청소년',
      phone: '010-5555-6666',
      role: Role.STUDENT,
      isApproved: true,
    },
  })
  await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      schoolId: 'school-2',
      grade: 2,
      class: 3,
      parentId: parentRecord.id,
    },
  })
  console.log('✅ Student created:', studentUser.email)

  // Additional students
  const student2User = await prisma.user.upsert({
    where: { email: 'student2@email.com' },
    update: {},
    create: {
      email: 'student2@email.com',
      password: hash('student1234'),
      name: '박청소년',
      phone: '010-7777-8888',
      role: Role.STUDENT,
      isApproved: true,
    },
  })
  await prisma.student.upsert({
    where: { userId: student2User.id },
    update: {},
    create: {
      userId: student2User.id,
      schoolId: 'school-2',
      grade: 1,
      class: 2,
      parentId: parentRecord.id,
    },
  })

  // Activities
  const now = new Date()
  const activities = [
    {
      id: 'act-1',
      title: '청소년 리더십 캠프',
      description: '인천 청소년들을 위한 2박 3일 리더십 캠프입니다. 팀빌딩, 리더십 강의, 야외활동 등으로 구성됩니다.',
      category: '캠프',
      capacity: 30,
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000),
      location: '인천 강화도 청소년수련원',
      fee: 50000,
      targetGrades: ['중1', '중2', '중3'],
      status: ActivityStatus.OPEN,
      requireParentConsent: true,
    },
    {
      id: 'act-2',
      title: '코딩 교육 워크숍',
      description: '파이썬을 이용한 기초 코딩 교육 워크숍입니다. 초보자도 쉽게 배울 수 있습니다.',
      category: '교육',
      capacity: 20,
      startDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      location: '인천청소년센터 컴퓨터실',
      fee: 10000,
      targetGrades: ['중1', '중2', '중3', '고1', '고2'],
      status: ActivityStatus.OPEN,
      requireParentConsent: false,
    },
    {
      id: 'act-3',
      title: '환경 정화 봉사활동',
      description: '인천 송도 해변 환경 정화 봉사활동입니다. 참가 후 봉사시간 인증서를 발급해드립니다.',
      category: '봉사',
      capacity: 50,
      startDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      location: '인천 송도 해변',
      fee: 0,
      targetGrades: ['중1', '중2', '중3', '고1', '고2', '고3'],
      status: ActivityStatus.OPEN,
      requireParentConsent: false,
    },
    {
      id: 'act-4',
      title: '청소년 진로 탐색 프로그램',
      description: '다양한 직업군의 멘토와 함께하는 진로 탐색 프로그램입니다.',
      category: '진로',
      capacity: 25,
      startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
      location: '인천청소년수련관 대강당',
      fee: 5000,
      targetGrades: ['고1', '고2', '고3'],
      status: ActivityStatus.OPEN,
      requireParentConsent: false,
    },
    {
      id: 'act-5',
      title: '스포츠 클라이밍 체험',
      description: '인천 실내 클라이밍장에서 진행하는 스포츠 클라이밍 체험 활동입니다.',
      category: '체육',
      capacity: 15,
      startDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      location: '인천 클라이밍센터',
      fee: 20000,
      targetGrades: ['중1', '중2', '중3', '고1'],
      status: ActivityStatus.OPEN,
      requireParentConsent: true,
    },
    {
      id: 'act-6',
      title: '청소년 문화예술 캠프',
      description: '음악, 미술, 연극 등 문화예술 체험 캠프입니다.',
      category: '문화예술',
      capacity: 40,
      startDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 22 * 24 * 60 * 60 * 1000),
      location: '인천문화예술회관',
      fee: 30000,
      targetGrades: ['중1', '중2', '중3', '고1', '고2'],
      status: ActivityStatus.OPEN,
      requireParentConsent: true,
    },
    {
      id: 'act-7',
      title: '글로벌 문화 교류 행사',
      description: '다양한 나라의 청소년들과 교류하는 글로벌 문화 행사입니다.',
      category: '국제교류',
      capacity: 60,
      startDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
      location: '인천국제공항 전시장',
      fee: 15000,
      targetGrades: ['중1', '중2', '중3', '고1', '고2', '고3'],
      status: ActivityStatus.OPEN,
      requireParentConsent: false,
    },
    {
      id: 'act-8',
      title: '요리 체험 교실',
      description: '전문 셰프와 함께하는 건강한 요리 체험 교실입니다.',
      category: '생활기술',
      capacity: 20,
      startDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      location: '인천청소년센터 요리실',
      fee: 12000,
      targetGrades: ['중1', '중2', '중3'],
      status: ActivityStatus.COMPLETED,
      requireParentConsent: false,
    },
    {
      id: 'act-9',
      title: '독서토론 클럽',
      description: '매달 선정된 도서를 읽고 토론하는 독서클럽 모집입니다.',
      category: '독서/토론',
      capacity: 12,
      startDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      location: '인천청소년도서관',
      fee: 0,
      targetGrades: ['고1', '고2', '고3'],
      status: ActivityStatus.OPEN,
      requireParentConsent: false,
    },
    {
      id: 'act-10',
      title: '드론 조종 교육',
      description: 'AI·드론 시대에 맞춘 드론 조종 기초 교육 프로그램입니다.',
      category: '과학기술',
      capacity: 18,
      startDate: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      location: '인천테크노파크 드론장',
      fee: 25000,
      targetGrades: ['중2', '중3', '고1', '고2'],
      status: ActivityStatus.OPEN,
      requireParentConsent: false,
    },
  ]

  for (const act of activities) {
    await prisma.activity.upsert({
      where: { id: act.id },
      update: {},
      create: act,
    })
  }
  console.log(`✅ ${activities.length} activities created`)

  console.log('\n🎉 Seed completed!\n')
  console.log('=== 테스트 계정 ===')
  console.log('관리자: admin@youth.or.kr / admin1234')
  console.log('교사:   teacher@school.kr / teacher1234')
  console.log('학부모: parent@email.com / parent1234')
  console.log('학생:   student@email.com / student1234')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

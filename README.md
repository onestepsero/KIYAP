# KIYAP - Korea Incheon Youth Activity Platform

한국청소년인천연맹 청소년 활동 통합 플랫폼

## 기술 스택

- **Frontend/Backend**: Next.js 14 (App Router) + TypeScript
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **ORM**: Prisma
- **Auth**: JWT (jose) + bcryptjs
- **UI**: Tailwind CSS

## 로컬 실행 방법

### 1. 사전 요구사항
- Node.js v18+
- Docker & Docker Compose
- Git

### 2. 환경 설정
```bash
cd /Users/nhn/study/webapp/KIYAP
cp .env.example .env.local
cp .env.example .env
```

### 3. Docker 컨테이너 시작 (PostgreSQL + Redis)
```bash
docker-compose up -d
```

### 4. 패키지 설치 및 DB 초기화
```bash
npm install
npx prisma migrate dev --name init
npx prisma db seed
```

### 5. 개발 서버 실행
```bash
npm run dev
# http://localhost:3000 접속
```

---

## 테스트 계정

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| 관리자 | admin@youth.or.kr | admin1234 |
| 교사 | teacher@school.kr | teacher1234 |
| 학부모 | parent@email.com | parent1234 |
| 학생 | student@email.com | student1234 |

---

## 주요 기능

### 학생
- 활동 목록 탐색 (카테고리/키워드 필터)
- 활동 신청 / 대기자 신청
- 가상계좌 발급 및 결제 확인
- 신청 내역 조회 및 취소

### 학부모
- 자녀 활동 현황 조회
- 미납 활동비 확인 및 가상계좌 정보

### 교사
- 소속 학교 학생 활동 참여 현황
- 미납 학생 목록

### 관리자
- KPI 대시보드 (회원수, 활동수, 납부율)
- 회원 관리 (승인/비활성화)
- 활동 CRUD (등록, 상태 변경)
- 결제/정산 관리 (입금 확인, 정산 처리)

---

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| POST | /api/auth/login | 로그인 |
| POST | /api/auth/register | 학생 회원가입 |
| GET | /api/auth/me | 내 정보 |
| DELETE | /api/auth/me | 로그아웃 |
| GET | /api/activities | 활동 목록 |
| POST | /api/activities | 활동 등록 (관리자) |
| GET | /api/activities/[id] | 활동 상세 |
| PUT | /api/activities/[id] | 활동 수정 (관리자) |
| POST | /api/activities/[id]/apply | 활동 신청 (학생) |
| GET | /api/applications | 신청 목록 |
| PUT | /api/applications/[id] | 신청 취소/확정 |
| GET | /api/payments | 결제 목록 |
| POST | /api/payments/[id]/confirm | 입금 확인 (Mock) |
| PUT | /api/payments/[id]/confirm | 정산 처리 (관리자) |
| GET | /api/users | 회원 목록 |
| PUT | /api/users/[id] | 회원 상태 변경 |
| GET | /api/schools | 학교 목록 |
| GET | /api/notifications | 알림 목록 |
| PUT | /api/notifications | 알림 읽음 처리 |
| GET | /api/admin/dashboard | 관리자 KPI |

---

## 아키텍처

```
KIYAP/
├── prisma/
│   ├── schema.prisma    # DB 스키마 (User, Activity, Application, Payment, ...)
│   └── seed.ts          # 초기 데이터
├── src/
│   ├── app/
│   │   ├── (login/register)  # 인증 페이지
│   │   ├── student/          # 학생 페이지
│   │   ├── parent/           # 학부모 페이지
│   │   ├── teacher/          # 교사 페이지
│   │   ├── admin/            # 관리자 페이지
│   │   └── api/              # REST API 라우트
│   ├── components/           # 공통 컴포넌트
│   ├── lib/                  # auth, db, utils
│   ├── middleware.ts         # RBAC 미들웨어
│   └── types/                # TypeScript 타입
└── docker-compose.yml        # PostgreSQL + Redis
```

## 결제 플로우 (Mock)

```
활동 신청 → 가상계좌 자동 발급 → PENDING
→ [테스트] 입금 확인 클릭 → PAID
→ 관리자 정산 처리 → SETTLED
```

실제 서비스 적용 시: PG사(이니시스/토스페이먼츠) Webhook 연동 필요

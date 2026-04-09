import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'KIYAP - 한국청소년인천연맹 활동 플랫폼',
  description: '청소년 활동 신청부터 정산까지 원스톱 플랫폼',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}

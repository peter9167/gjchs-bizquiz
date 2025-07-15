import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GJCHS BizQuiz - 광주여상 비즈니스 퀴즈',
  description: '광주여자상업고등학교 모의주식 거래 퀴즈 시스템. 학생들이 가상 자산으로 주식 거래를 체험하고 경제 지식을 학습할 수 있는 교육용 플랫폼입니다.',
  keywords: ['광주여상', '모의주식', '퀴즈', '경제교육', '주식거래', '비즈니스', '교육', 'GJCHS'],
  authors: [{ name: 'GJCHS BizQuiz Team' }],
  creator: 'GJCHS BizQuiz',
  publisher: '광주여자상업고등학교',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://gjchs-bizquiz.vercel.app',
    title: 'GJCHS BizQuiz - 광주여상 비즈니스 퀴즈',
    description: '광주여자상업고등학교 모의주식 거래 퀴즈 시스템',
    siteName: 'GJCHS BizQuiz',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GJCHS BizQuiz - 광주여상 비즈니스 퀴즈',
    description: '광주여자상업고등학교 모의주식 거래 퀴즈 시스템',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  )
}
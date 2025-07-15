# GJCHS BizQuiz

광주여자상업고등학교 모의주식 거래 퀴즈 시스템입니다. 학생들이 가상 자산으로 주식 거래를 체험하고 경제 지식을 학습할 수 있는 교육용 플랫폼입니다.

## 🎯 주요 기능

### 학생 시스템
- 간편한 학생 등록 (학년, 반, 번호, 이름)
- 세션 기반 인증 (로그인 불필요)
- 개인 대시보드 및 퀴즈 결과 확인
- 실시간 랭킹 시스템

### 퀴즈 시스템
- 객관식 4지선다 문제
- 타이머 기능 (시간 제한)
- 즉시 채점 및 결과 표시
- 문제별 이미지 지원

### 모의주식 시스템
- 퀴즈 점수를 가상 자산으로 자동 변환
- 실시간 포트폴리오 추적
- 학급별 주가 시뮬레이션
- 인터랙티브 차트로 주가 변동 확인
- 가상 자산 기준 리더보드

### 관리자 패널
- 완전한 문제 관리 (CRUD)
- 이미지 업로드 지원
- 퀴즈 일정 관리:
  - 일일 퀴즈
  - 특정 요일 스케줄링 (월-일)
  - 시간 기반 활성화/비활성화
- 실시간 사용자 모니터링
- 상세 분석 및 리포트
- 학생 데이터 관리
- CSV 내보내기 기능

### 스케줄링 기능
- 스케줄 기반 자동 퀴즈 활성화
- 다중 퀴즈 세트 관리
- 시간대 처리
- 퀴즈 알림 시스템

## 🛠 기술 스택

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Real-time subscriptions)
- **Charts**: Chart.js, React-Chart.js-2
- **Icons**: Lucide React
- **Authentication**: Session-based (Custom implementation)

## 📊 데이터베이스 스키마

### 주요 테이블
- `students`: 학생 정보 및 세션 관리
- `questions`: 퀴즈 문제 저장
- `quiz_schedules`: 퀴즈 일정 관리
- `quiz_sessions`: 퀴즈 세션 및 답안 저장
- `portfolios`: 학생별 가상 자산 관리
- `stock_prices`: 시뮬레이션된 주가 데이터
- `live_rankings`: 실시간 랭킹 뷰

### 주요 기능
- Row Level Security (RLS) 정책
- 자동 포트폴리오 업데이트 함수
- 주가 시뮬레이션 함수
- 성능 최적화를 위한 인덱스

## 🚀 설치 및 실행

### 1. 프로젝트 클론
\`\`\`bash
git clone <repository-url>
cd gjchs-bizquiz
\`\`\`

### 2. 의존성 설치
\`\`\`bash
npm install
\`\`\`

### 3. 환경 변수 설정
\`.env.local\` 파일을 생성하고 다음 값들을 설정:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
\`\`\`

### 4. 데이터베이스 설정
\`database-schema.sql\` 파일의 내용을 Supabase SQL 에디터에서 실행:

1. Supabase 대시보드 접속
2. SQL Editor 메뉴 선택
3. \`database-schema.sql\` 내용 복사 후 실행
4. 테이블, 뷰, 함수, RLS 정책이 생성됨

### 5. 개발 서버 실행
\`\`\`bash
npm run dev
\`\`\`

웹사이트가 \`http://localhost:3000\`에서 실행됩니다.

## 📁 프로젝트 구조

\`\`\`
src/
├── app/                    # Next.js App Router
│   ├── admin/             # 관리자 페이지
│   │   ├── questions/     # 문제 관리
│   │   ├── schedules/     # 일정 관리
│   │   ├── analytics/     # 분석 리포트
│   │   └── ...
│   ├── quiz/              # 퀴즈 시스템
│   ├── portfolio/         # 포트폴리오 페이지
│   ├── rankings/          # 랭킹 페이지
│   ├── stock-chart/       # 주가 차트
│   └── ...
├── components/            # 재사용 가능한 컴포넌트
├── lib/                   # 유틸리티 및 라이브러리
│   ├── supabase.ts       # Supabase 클라이언트
│   ├── session.ts        # 세션 관리
│   ├── quiz.ts           # 퀴즈 로직
│   ├── portfolio.ts      # 포트폴리오 관리
│   └── admin.ts          # 관리자 기능
└── types/                 # TypeScript 타입 정의
\`\`\`

## 🎮 사용 방법

### 학생 사용법
1. 홈페이지에서 "학생 등록하기" 클릭
2. 학년, 반, 번호, 이름 입력하여 등록
3. 대시보드에서 퀴즈 참여, 포트폴리오 확인, 랭킹 조회 가능
4. 퀴즈 완료 시 점수에 따라 가상 자산 자동 증감

### 관리자 사용법
1. 홈페이지에서 "관리자 페이지" 클릭
2. 문제 관리: 새 문제 추가, 기존 문제 수정/삭제
3. 일정 관리: 퀴즈 일정 생성 및 자동 활성화 설정
4. 분석 리포트: 학습 성과 및 통계 확인
5. 실시간 모니터링: 현재 활동 사용자 추적

## 📈 주요 특징

### 실시간 기능
- 포트폴리오 자동 업데이트
- 실시간 랭킹 시스템
- 주가 시뮬레이션
- 활동 모니터링

### 교육적 가치
- 경제 교육과 퀴즈를 결합
- 성과에 따른 즉각적 피드백
- 경쟁적 학습 환경 조성
- 데이터 기반 학습 분석

### 확장성
- 모듈식 컴포넌트 구조
- 타입 안전성 (TypeScript)
- 성능 최적화된 데이터베이스
- 클라우드 기반 인프라 (Supabase)

## 🔒 보안

- Row Level Security (RLS) 적용
- 세션 기반 인증
- 환경 변수를 통한 민감 정보 보호
- 입력 데이터 검증 및 산정

## 📞 지원 및 문의

문제가 발생하거나 개선 사항이 있다면 이슈를 등록해 주세요.

## 📄 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.
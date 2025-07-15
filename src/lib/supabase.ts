import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// 개발 환경에서 환경 변수가 설정되지 않은 경우를 위한 기본값
const defaultUrl = 'https://placeholder.supabase.co'
const defaultKey = 'placeholder-key'

// 환경 변수 검증 및 기본값 설정
const validUrl = supabaseUrl && supabaseUrl !== 'your_supabase_url_here' ? supabaseUrl : defaultUrl
const validKey = supabaseAnonKey && supabaseAnonKey !== 'your_supabase_anon_key_here' ? supabaseAnonKey : defaultKey

// 글로벌 변수로 싱글톤 관리
declare global {
  var __supabase: ReturnType<typeof createClient> | undefined
  var __supabaseAdmin: ReturnType<typeof createClient> | undefined
}

// 싱글톤 패턴으로 클라이언트 인스턴스 생성
export const supabase = globalThis.__supabase ?? createClient(validUrl, validKey)
if (process.env.NODE_ENV !== 'production') globalThis.__supabase = supabase

// 관리자 권한이 필요한 작업용 (RLS 우회)
export const supabaseAdmin = globalThis.__supabaseAdmin ?? createClient(validUrl, supabaseServiceKey || validKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
if (process.env.NODE_ENV !== 'production') globalThis.__supabaseAdmin = supabaseAdmin

// 서버 클라이언트는 일반 클라이언트와 동일하게 사용
export const createServerClient = () => {
  return supabase
}

// 환경 변수가 제대로 설정되었는지 확인하는 함수
export const isSupabaseConfigured = () => {
  return supabaseUrl && 
         supabaseUrl !== 'your_supabase_url_here' && 
         supabaseAnonKey && 
         supabaseAnonKey !== 'your_supabase_anon_key_here'
}
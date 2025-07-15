-- RLS 정책 문제 해결을 위한 SQL

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Students can insert their own data" ON students;
DROP POLICY IF EXISTS "Students can view their own data" ON students;

-- 새로운 정책 생성 - 더 관대한 INSERT 정책
CREATE POLICY "Allow public insert for students" ON students
  FOR INSERT WITH CHECK (true);

-- SELECT 정책도 더 관대하게 수정
CREATE POLICY "Allow public select for students" ON students
  FOR SELECT USING (true);

-- 또는 임시로 RLS 완전히 비활성화 (개발 환경에서만)
-- ALTER TABLE students DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE portfolios DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE quiz_sessions DISABLE ROW LEVEL SECURITY;
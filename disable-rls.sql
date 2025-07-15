-- 임시로 RLS 비활성화 (개발 환경에서만 사용)
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios DISABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions DISABLE ROW LEVEL SECURITY;

-- 또는 더 관대한 정책으로 변경
-- DROP POLICY IF EXISTS "Students can insert their own data" ON students;
-- DROP POLICY IF EXISTS "Students can view their own data" ON students;

-- CREATE POLICY "Allow all operations for students" ON students FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all operations for portfolios" ON portfolios FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all operations for quiz_sessions" ON quiz_sessions FOR ALL USING (true) WITH CHECK (true);
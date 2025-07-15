-- 보안을 유지하면서 등록을 허용하는 안전한 RLS 정책

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Students can insert their own data" ON students;
DROP POLICY IF EXISTS "Students can view their own data" ON students;

-- 새로운 보안 정책 생성

-- 1. 학생 등록 정책: 중복 등록 방지하면서 새 등록 허용
CREATE POLICY "Allow student registration" ON students
  FOR INSERT 
  WITH CHECK (
    -- 같은 학년, 반, 번호의 학생이 없을 때만 등록 허용
    NOT EXISTS (
      SELECT 1 FROM students 
      WHERE grade = NEW.grade 
      AND class = NEW.class 
      AND number = NEW.number
    )
  );

-- 2. 학생 조회 정책: 자신의 데이터만 조회 가능
CREATE POLICY "Students can view their own data" ON students
  FOR SELECT 
  USING (
    session_token IS NOT NULL 
    AND session_token = current_setting('app.current_session_token', true)
  );

-- 3. 학생 업데이트 정책: 자신의 데이터만 업데이트 가능
CREATE POLICY "Students can update their own data" ON students
  FOR UPDATE 
  USING (
    session_token IS NOT NULL 
    AND session_token = current_setting('app.current_session_token', true)
  )
  WITH CHECK (
    session_token IS NOT NULL 
    AND session_token = current_setting('app.current_session_token', true)
  );

-- 포트폴리오 테이블 정책
DROP POLICY IF EXISTS "Students can view their portfolio" ON portfolios;

-- 포트폴리오 INSERT 정책 (등록 시 자동 생성)
CREATE POLICY "Allow portfolio creation" ON portfolios
  FOR INSERT 
  WITH CHECK (true);

-- 포트폴리오 SELECT 정책 (자신의 것만 조회)
CREATE POLICY "Students can view their own portfolio" ON portfolios
  FOR SELECT 
  USING (
    student_id IN (
      SELECT id FROM students 
      WHERE session_token = current_setting('app.current_session_token', true)
    )
  );

-- 포트폴리오 UPDATE 정책 (자신의 것만 업데이트)
CREATE POLICY "Students can update their own portfolio" ON portfolios
  FOR UPDATE 
  USING (
    student_id IN (
      SELECT id FROM students 
      WHERE session_token = current_setting('app.current_session_token', true)
    )
  )
  WITH CHECK (
    student_id IN (
      SELECT id FROM students 
      WHERE session_token = current_setting('app.current_session_token', true)
    )
  );

-- 퀴즈 세션 정책은 기존 유지 (이미 안전함)

-- 공개 테이블에 대한 정책 (모든 사용자가 읽기 가능)
CREATE POLICY "Allow public read for questions" ON questions
  FOR SELECT USING (true);

CREATE POLICY "Allow public read for quiz_schedules" ON quiz_schedules
  FOR SELECT USING (true);

CREATE POLICY "Allow public read for stock_prices" ON stock_prices
  FOR SELECT USING (true);

-- 랭킹 뷰는 자동으로 공개 접근 가능

-- 보안 강화: 세션 토큰 설정 함수 생성
CREATE OR REPLACE FUNCTION set_session_token(token text)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_session_token', token, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
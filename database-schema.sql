-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Students table
CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade integer NOT NULL,
  class integer NOT NULL,
  number integer NOT NULL,
  name text NOT NULL,
  phone text,
  session_token text UNIQUE,
  created_at timestamp DEFAULT now(),
  UNIQUE(grade, class, number)
);

-- Questions table
CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  image_url text,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_answer char(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  category text,
  difficulty integer DEFAULT 1,
  created_at timestamp DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Quiz schedules
CREATE TABLE quiz_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  question_ids uuid[] NOT NULL,
  schedule_type text NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'once')),
  weekdays integer[], -- [1,2,3,4,5] for Mon-Fri
  start_time time NOT NULL,
  end_time time NOT NULL,
  start_date date NOT NULL,
  end_date date,
  time_limit_minutes integer DEFAULT 30,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now()
);

-- Quiz sessions
CREATE TABLE quiz_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id),
  schedule_id uuid REFERENCES quiz_schedules(id),
  started_at timestamp DEFAULT now(),
  completed_at timestamp,
  score integer DEFAULT 0,
  total_questions integer NOT NULL,
  answers jsonb, -- Store all answers
  time_taken_seconds integer
);

-- Portfolios
CREATE TABLE portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) UNIQUE,
  virtual_assets bigint DEFAULT 1000000, -- Starting money
  total_return_rate decimal(5,2) DEFAULT 0.00,
  last_updated timestamp DEFAULT now()
);

-- Stock prices (simulated)
CREATE TABLE stock_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  price_date date DEFAULT CURRENT_DATE,
  grade integer,
  class integer,
  price decimal(10,2) NOT NULL,
  volume integer DEFAULT 0,
  created_at timestamp DEFAULT now()
);

-- Real-time rankings view
CREATE VIEW live_rankings AS 
SELECT 
  ROW_NUMBER() OVER (ORDER BY p.virtual_assets DESC) as rank,
  s.name, s.grade, s.class, s.number,
  p.virtual_assets,
  p.total_return_rate,
  COUNT(qs.id) as quizzes_completed
FROM students s 
JOIN portfolios p ON s.id = p.student_id
LEFT JOIN quiz_sessions qs ON s.id = qs.student_id AND qs.completed_at IS NOT NULL
GROUP BY s.id, s.name, s.grade, s.class, s.number, p.virtual_assets, p.total_return_rate;

-- Indexes for performance
CREATE INDEX idx_students_session_token ON students(session_token);
CREATE INDEX idx_quiz_sessions_student_id ON quiz_sessions(student_id);
CREATE INDEX idx_quiz_sessions_schedule_id ON quiz_sessions(schedule_id);
CREATE INDEX idx_portfolios_student_id ON portfolios(student_id);
CREATE INDEX idx_stock_prices_date_grade_class ON stock_prices(price_date, grade, class);

-- Row Level Security (RLS) policies
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- Allow public read access for students (session-based auth)
CREATE POLICY "Students can view their own data" ON students
  FOR SELECT USING (session_token = current_setting('app.current_session_token', true));

CREATE POLICY "Students can insert their own data" ON students
  FOR INSERT WITH CHECK (true);

-- Quiz sessions - students can only see their own
CREATE POLICY "Students can view their quiz sessions" ON quiz_sessions
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students 
      WHERE session_token = current_setting('app.current_session_token', true)
    )
  );

CREATE POLICY "Students can insert their quiz sessions" ON quiz_sessions
  FOR INSERT WITH CHECK (
    student_id IN (
      SELECT id FROM students 
      WHERE session_token = current_setting('app.current_session_token', true)
    )
  );

-- Portfolios - students can only see their own
CREATE POLICY "Students can view their portfolio" ON portfolios
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students 
      WHERE session_token = current_setting('app.current_session_token', true)
    )
  );

-- Functions for portfolio management
CREATE OR REPLACE FUNCTION update_portfolio_from_quiz(
  p_student_id uuid,
  p_score integer,
  p_total_questions integer
) RETURNS void AS $$
DECLARE
  score_percentage decimal;
  asset_change bigint;
BEGIN
  score_percentage := (p_score::decimal / p_total_questions::decimal) * 100;
  
  -- Calculate asset change based on score (100% = +50k, 0% = -20k)
  asset_change := CASE 
    WHEN score_percentage >= 90 THEN 50000
    WHEN score_percentage >= 80 THEN 30000
    WHEN score_percentage >= 70 THEN 15000
    WHEN score_percentage >= 60 THEN 5000
    WHEN score_percentage >= 50 THEN 0
    ELSE -20000
  END;
  
  -- Update portfolio
  UPDATE portfolios 
  SET 
    virtual_assets = virtual_assets + asset_change,
    total_return_rate = ((virtual_assets + asset_change - 1000000)::decimal / 1000000::decimal) * 100,
    last_updated = now()
  WHERE student_id = p_student_id;
  
  -- Create portfolio if doesn't exist
  IF NOT FOUND THEN
    INSERT INTO portfolios (student_id, virtual_assets, total_return_rate)
    VALUES (p_student_id, 1000000 + asset_change, (asset_change::decimal / 1000000::decimal) * 100);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to simulate stock prices
CREATE OR REPLACE FUNCTION update_stock_prices() RETURNS void AS $$
DECLARE
  grade_rec record;
BEGIN
  -- Update stock prices for each grade/class combination
  FOR grade_rec IN 
    SELECT DISTINCT grade, class FROM students
  LOOP
    INSERT INTO stock_prices (grade, class, price, volume)
    SELECT 
      grade_rec.grade,
      grade_rec.class,
      -- Base price influenced by average portfolio performance
      1000 + (
        SELECT COALESCE(AVG(total_return_rate), 0) * 10
        FROM portfolios p
        JOIN students s ON p.student_id = s.id
        WHERE s.grade = grade_rec.grade AND s.class = grade_rec.class
      ) + (random() * 200 - 100), -- Add some volatility
      -- Volume based on recent quiz activity
      (
        SELECT COUNT(*)
        FROM quiz_sessions qs
        JOIN students s ON qs.student_id = s.id
        WHERE s.grade = grade_rec.grade 
          AND s.class = grade_rec.class
          AND qs.completed_at > now() - interval '1 day'
      );
  END LOOP;
END;
$$ LANGUAGE plpgsql;
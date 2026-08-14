-- 006_attendance.sql
CREATE TYPE attendance_status AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

CREATE TABLE attendance (
  attendance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(student_id),
  subject_id UUID NOT NULL REFERENCES subjects(subject_id),
  academic_year_id UUID NOT NULL REFERENCES academic_years(academic_year_id),
  semester_id UUID REFERENCES semesters(semester_id),
  date DATE NOT NULL,
  status attendance_status NOT NULL DEFAULT 'PRESENT',
  session VARCHAR(20),  -- 'MORNING', 'AFTERNOON', 'FULL_DAY'
  remarks TEXT,
  entered_by UUID NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, subject_id, date, session)
);

CREATE INDEX idx_attendance_student ON attendance (student_id);
CREATE INDEX idx_attendance_date ON attendance (date);
CREATE INDEX idx_attendance_subject ON attendance (subject_id);

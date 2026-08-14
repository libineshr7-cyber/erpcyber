-- 005_exams_marks.sql
CREATE TYPE exam_status AS ENUM ('UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE mark_status AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');
CREATE TYPE mark_result AS ENUM ('PASS', 'FAIL', 'ABSENT', 'WITHHELD', 'PENDING');

CREATE TABLE exams (
  exam_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_name VARCHAR(255) NOT NULL,
  exam_code VARCHAR(50),
  academic_year_id UUID NOT NULL REFERENCES academic_years(academic_year_id),
  semester_id UUID REFERENCES semesters(semester_id),
  department_id UUID REFERENCES departments(department_id),
  exam_date DATE,
  maximum_marks INTEGER NOT NULL DEFAULT 100,
  passing_marks INTEGER NOT NULL DEFAULT 50,
  status exam_status NOT NULL DEFAULT 'UPCOMING',
  created_by UUID REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE marks (
  mark_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(student_id),
  subject_id UUID NOT NULL REFERENCES subjects(subject_id),
  exam_id UUID NOT NULL REFERENCES exams(exam_id),
  marks_obtained DECIMAL(6,2),
  maximum_marks INTEGER NOT NULL,
  grade VARCHAR(5),
  result mark_result NOT NULL DEFAULT 'PENDING',
  status mark_status NOT NULL DEFAULT 'DRAFT',
  is_absent BOOLEAN NOT NULL DEFAULT false,
  version INTEGER NOT NULL DEFAULT 1,
  submitted_by UUID REFERENCES users(user_id),
  submitted_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(user_id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_by UUID NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, subject_id, exam_id)
);

CREATE INDEX idx_marks_student ON marks (student_id);
CREATE INDEX idx_marks_exam ON marks (exam_id);
CREATE INDEX idx_marks_subject ON marks (subject_id);
CREATE INDEX idx_marks_status ON marks (status);

CREATE TABLE mark_versions (
  version_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mark_id UUID NOT NULL REFERENCES marks(mark_id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  old_marks DECIMAL(6,2),
  new_marks DECIMAL(6,2),
  old_status mark_status,
  new_status mark_status,
  change_reason TEXT NOT NULL,
  changed_by UUID NOT NULL REFERENCES users(user_id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE mark_approvals (
  approval_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mark_id UUID NOT NULL REFERENCES marks(mark_id) ON DELETE CASCADE,
  reviewed_by UUID NOT NULL REFERENCES users(user_id),
  action VARCHAR(20) NOT NULL CHECK (action IN ('APPROVE', 'REJECT')),
  reason TEXT,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

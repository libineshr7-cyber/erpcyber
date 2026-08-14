-- 004_subjects_enrollment.sql
CREATE TYPE subject_type AS ENUM ('THEORY', 'PRACTICAL', 'TUTORIAL', 'PROJECT', 'ELECTIVE');
CREATE TYPE subject_status AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

CREATE TABLE subjects (
  subject_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_code VARCHAR(20) UNIQUE NOT NULL,
  subject_name VARCHAR(255) NOT NULL,
  subject_type subject_type NOT NULL DEFAULT 'THEORY',
  credits DECIMAL(3,1) NOT NULL DEFAULT 3,
  semester_number INTEGER NOT NULL CHECK (semester_number BETWEEN 1 AND 8),
  year_of_study INTEGER NOT NULL CHECK (year_of_study BETWEEN 1 AND 4),
  department_id UUID REFERENCES departments(department_id),
  academic_year_id UUID NOT NULL REFERENCES academic_years(academic_year_id),
  maximum_marks INTEGER NOT NULL DEFAULT 100,
  passing_marks INTEGER NOT NULL DEFAULT 50,
  status subject_status NOT NULL DEFAULT 'ACTIVE',
  created_by UUID REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subjects_semester ON subjects (semester_number, academic_year_id);

-- Add FK on staff_assignments now that subjects exist
ALTER TABLE staff_assignments ADD CONSTRAINT fk_staff_assignment_subject
  FOREIGN KEY (subject_id) REFERENCES subjects(subject_id);

-- Student ↔ Subject enrollment (individual, dynamic)
CREATE TYPE enrollment_status AS ENUM ('ENROLLED', 'DROPPED', 'COMPLETED');

CREATE TABLE student_subjects (
  enrollment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(subject_id),
  academic_year_id UUID NOT NULL REFERENCES academic_years(academic_year_id),
  semester_id UUID REFERENCES semesters(semester_id),
  status enrollment_status NOT NULL DEFAULT 'ENROLLED',
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, subject_id, academic_year_id)
);

CREATE INDEX idx_student_subjects_student ON student_subjects (student_id);
CREATE INDEX idx_student_subjects_subject ON student_subjects (subject_id);

-- 003_students_staff.sql
CREATE TYPE student_status AS ENUM ('ACTIVE', 'INACTIVE', 'GRADUATED', 'SUSPENDED', 'ARCHIVED');

CREATE TABLE students (
  student_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(user_id) ON DELETE SET NULL,
  register_number VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  programme VARCHAR(100) NOT NULL,
  department_id UUID REFERENCES departments(department_id),
  batch VARCHAR(20) NOT NULL,         -- e.g., "2025-2029"
  admission_year INTEGER NOT NULL,
  current_year INTEGER NOT NULL CHECK (current_year BETWEEN 1 AND 4),
  current_semester INTEGER NOT NULL CHECK (current_semester BETWEEN 1 AND 8),
  section_id UUID REFERENCES sections(section_id),
  parent_name VARCHAR(255),
  parent_whatsapp_encrypted BYTEA,    -- ENCRYPTED — never expose to client
  account_status student_status NOT NULL DEFAULT 'ACTIVE',
  dob DATE,
  gender VARCHAR(20),
  phone VARCHAR(20),
  address TEXT,
  photo_url VARCHAR(500),
  created_by UUID REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_students_register ON students (register_number);
CREATE INDEX idx_students_batch ON students (batch);
CREATE INDEX idx_students_year ON students (current_year);

CREATE TABLE staff (
  staff_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  designation VARCHAR(100),
  department_id UUID REFERENCES departments(department_id),
  phone VARCHAR(20),
  is_class_advisor BOOLEAN NOT NULL DEFAULT false,
  account_status account_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE staff_assignments (
  assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff(staff_id) ON DELETE CASCADE,
  subject_id UUID NOT NULL,     -- FK added after subjects table
  section_id UUID REFERENCES sections(section_id),
  academic_year_id UUID NOT NULL REFERENCES academic_years(academic_year_id),
  semester_id UUID NOT NULL REFERENCES semesters(semester_id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

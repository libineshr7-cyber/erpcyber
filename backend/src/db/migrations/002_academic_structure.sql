-- 002_academic_structure.sql
CREATE TYPE semester_status AS ENUM ('UPCOMING', 'ACTIVE', 'COMPLETED');

CREATE TABLE departments (
  department_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(50) NOT NULL,
  head_user_id UUID REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE academic_years (
  academic_year_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label VARCHAR(20) UNIQUE NOT NULL,  -- e.g., "2025-2026"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE semesters (
  semester_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academic_year_id UUID NOT NULL REFERENCES academic_years(academic_year_id),
  semester_number INTEGER NOT NULL CHECK (semester_number BETWEEN 1 AND 8),
  year_of_study INTEGER NOT NULL CHECK (year_of_study BETWEEN 1 AND 4),
  start_date DATE,
  end_date DATE,
  status semester_status NOT NULL DEFAULT 'UPCOMING',
  UNIQUE(academic_year_id, semester_number)
);

CREATE TABLE sections (
  section_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academic_year_id UUID NOT NULL REFERENCES academic_years(academic_year_id),
  semester_id UUID NOT NULL REFERENCES semesters(semester_id),
  name VARCHAR(10) NOT NULL,  -- A, B, C
  year_of_study INTEGER NOT NULL,
  department_id UUID REFERENCES departments(department_id),
  UNIQUE(academic_year_id, semester_id, name, year_of_study)
);

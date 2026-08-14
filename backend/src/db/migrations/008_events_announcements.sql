-- 008_events_announcements.sql
CREATE TYPE event_status AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED');
CREATE TYPE announcement_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

CREATE TABLE events (
  event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(100),    -- 'WORKSHOP', 'SEMINAR', 'HACKATHON', etc.
  event_date DATE NOT NULL,
  event_time TIME,
  venue VARCHAR(255),
  registration_link VARCHAR(500),
  poster_path VARCHAR(500),
  department_id UUID REFERENCES departments(department_id),
  status event_status NOT NULL DEFAULT 'DRAFT',
  created_by UUID NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_date ON events (event_date);
CREATE INDEX idx_events_status ON events (status);

CREATE TABLE announcements (
  announcement_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  department_id UUID REFERENCES departments(department_id),
  pinned BOOLEAN NOT NULL DEFAULT false,
  status announcement_status NOT NULL DEFAULT 'DRAFT',
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

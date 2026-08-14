-- 007_reports_whatsapp.sql
CREATE TYPE report_status AS ENUM ('GENERATING', 'READY', 'FAILED', 'EXPIRED');
CREATE TYPE whatsapp_status AS ENUM ('PENDING', 'SENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');

CREATE TABLE reports (
  report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(student_id),
  exam_id UUID NOT NULL REFERENCES exams(exam_id),
  academic_year_id UUID NOT NULL REFERENCES academic_years(academic_year_id),
  semester_id UUID REFERENCES semesters(semester_id),
  file_path VARCHAR(500) NOT NULL,    -- UUID-based path, not student name
  file_size_bytes INTEGER,
  checksum VARCHAR(100),
  status report_status NOT NULL DEFAULT 'GENERATING',
  generated_by UUID NOT NULL REFERENCES users(user_id),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  watermark_text TEXT
);

CREATE INDEX idx_reports_student ON reports (student_id);
CREATE INDEX idx_reports_exam ON reports (exam_id);

CREATE TABLE report_access_log (
  access_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES reports(report_id),
  accessed_by UUID NOT NULL REFERENCES users(user_id),
  ip_address INET,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE whatsapp_messages (
  message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES reports(report_id),
  student_id UUID NOT NULL REFERENCES students(student_id),
  recipient_phone_encrypted BYTEA NOT NULL,   -- encrypted, never plaintext in DB
  wa_message_id VARCHAR(255),
  idempotency_key VARCHAR(255) UNIQUE NOT NULL,
  status whatsapp_status NOT NULL DEFAULT 'PENDING',
  sent_by UUID NOT NULL REFERENCES users(user_id),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE whatsapp_webhooks (
  webhook_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wa_message_id VARCHAR(255),
  event_type VARCHAR(50),
  raw_payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 009_audit_security.sql
CREATE TYPE audit_result AS ENUM ('SUCCESS', 'FAILURE', 'PARTIAL');
CREATE TYPE security_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TABLE audit_logs (
  log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(user_id),
  username VARCHAR(100),
  role user_role,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  result audit_result NOT NULL DEFAULT 'SUCCESS',
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs (user_id, created_at);
CREATE INDEX idx_audit_action ON audit_logs (action, created_at);
CREATE INDEX idx_audit_resource ON audit_logs (resource_type, resource_id);

CREATE TABLE security_events (
  event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(100) NOT NULL,
  severity security_severity NOT NULL,
  user_id UUID REFERENCES users(user_id),
  username VARCHAR(100),
  ip_address INET,
  description TEXT NOT NULL,
  metadata JSONB,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES users(user_id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_security_events_severity ON security_events (severity, created_at);
CREATE INDEX idx_security_events_type ON security_events (event_type, created_at);
CREATE INDEX idx_security_events_resolved ON security_events (is_resolved, created_at);

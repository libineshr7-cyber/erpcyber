-- 001_users_auth.sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'HOD', 'STAFF', 'STUDENT');
CREATE TYPE account_status AS ENUM ('ACTIVE', 'INACTIVE', 'LOCKED', 'SUSPENDED');

CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  account_status account_status NOT NULL DEFAULT 'ACTIVE',
  mfa_enabled BOOLEAN NOT NULL DEFAULT false,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  last_login_ip INET,
  password_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
  sid VARCHAR NOT NULL PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_sessions_expire ON sessions (expire);

CREATE TABLE password_reset_tokens (
  token_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE mfa_credentials (
  mfa_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  secret_encrypted BYTEA NOT NULL,
  recovery_codes_hash TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE login_attempts (
  attempt_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(100),
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  failure_reason VARCHAR(100),
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_login_attempts_username ON login_attempts (username, attempted_at);
CREATE INDEX idx_login_attempts_ip ON login_attempts (ip_address, attempted_at);

CREATE TABLE permissions (
  permission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE role_permissions (
  role user_role NOT NULL,
  permission_id UUID NOT NULL REFERENCES permissions(permission_id) ON DELETE CASCADE,
  PRIMARY KEY (role, permission_id)
);

-- Seed initial permissions
INSERT INTO permissions (name, description) VALUES
  ('students:read', 'View student list and details'),
  ('students:write', 'Create and update students'),
  ('students:delete', 'Soft-delete students'),
  ('staff:read', 'View staff list'),
  ('staff:write', 'Create and update staff'),
  ('subjects:read', 'View subjects'),
  ('subjects:write', 'Create and update subjects'),
  ('exams:read', 'View exams'),
  ('exams:write', 'Create and update exams'),
  ('marks:read', 'View marks'),
  ('marks:write', 'Enter and update marks'),
  ('marks:approve', 'Approve or reject marks'),
  ('attendance:read', 'View attendance'),
  ('attendance:write', 'Enter attendance'),
  ('reports:generate', 'Generate PDF reports'),
  ('reports:read', 'View reports'),
  ('whatsapp:send', 'Send WhatsApp reports'),
  ('events:read', 'View events'),
  ('events:write', 'Create and manage events'),
  ('announcements:read', 'View announcements'),
  ('announcements:write', 'Create announcements'),
  ('audit:read', 'View audit logs'),
  ('security:read', 'View security events'),
  ('security:manage', 'Manage sessions and security settings'),
  ('academic_years:write', 'Manage academic years and semesters'),
  ('users:manage', 'Manage user accounts and roles');

-- Role permission assignments
INSERT INTO role_permissions (role, permission_id)
SELECT 'HOD', permission_id FROM permissions;

INSERT INTO role_permissions (role, permission_id)
SELECT 'STAFF', permission_id FROM permissions
WHERE name IN (
  'students:read','subjects:read','exams:read',
  'marks:read','marks:write',
  'attendance:read','attendance:write',
  'reports:generate','reports:read',
  'whatsapp:send',
  'events:read','announcements:read'
);

INSERT INTO role_permissions (role, permission_id)
SELECT 'STUDENT', permission_id FROM permissions
WHERE name IN (
  'events:read','announcements:read',
  'reports:read','attendance:read','marks:read'
);

INSERT INTO role_permissions (role, permission_id)
SELECT 'SUPER_ADMIN', permission_id FROM permissions;

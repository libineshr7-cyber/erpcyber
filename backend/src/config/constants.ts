export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  HOD: 'HOD',
  STAFF: 'STAFF',
  STUDENT: 'STUDENT',
} as const;

export type Role = keyof typeof ROLES;

export const PERMISSIONS = {
  STUDENTS_READ: 'students:read',
  STUDENTS_WRITE: 'students:write',
  STUDENTS_DELETE: 'students:delete',
  STAFF_READ: 'staff:read',
  STAFF_WRITE: 'staff:write',
  SUBJECTS_READ: 'subjects:read',
  SUBJECTS_WRITE: 'subjects:write',
  EXAMS_READ: 'exams:read',
  EXAMS_WRITE: 'exams:write',
  MARKS_READ: 'marks:read',
  MARKS_WRITE: 'marks:write',
  MARKS_APPROVE: 'marks:approve',
  ATTENDANCE_READ: 'attendance:read',
  ATTENDANCE_WRITE: 'attendance:write',
  REPORTS_GENERATE: 'reports:generate',
  REPORTS_READ: 'reports:read',
  WHATSAPP_SEND: 'whatsapp:send',
  EVENTS_READ: 'events:read',
  EVENTS_WRITE: 'events:write',
  ANNOUNCEMENTS_READ: 'announcements:read',
  ANNOUNCEMENTS_WRITE: 'announcements:write',
  AUDIT_READ: 'audit:read',
  SECURITY_READ: 'security:read',
  SECURITY_MANAGE: 'security:manage',
  ACADEMIC_YEARS_WRITE: 'academic_years:write',
  USERS_MANAGE: 'users:manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const GRADE_THRESHOLDS = [
  { min: 90, grade: 'O' },
  { min: 80, grade: 'A+' },
  { min: 70, grade: 'A' },
  { min: 60, grade: 'B+' },
  { min: 50, grade: 'B' },
  { min: 40, grade: 'C' },
  { min: 30, grade: 'D' },
  { min: 0, grade: 'F' },
] as const;

export const MARK_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export const WHATSAPP_STATUS = {
  PENDING: 'PENDING',
  SENDING: 'SENDING',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  READ: 'READ',
  FAILED: 'FAILED',
} as const;

export const SECURITY_SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

export const AUDIT_ACTIONS = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  MFA_SETUP: 'MFA_SETUP',
  MFA_VERIFIED: 'MFA_VERIFIED',
  PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED: 'PASSWORD_RESET_COMPLETED',
  STUDENT_CREATED: 'STUDENT_CREATED',
  STUDENT_UPDATED: 'STUDENT_UPDATED',
  STUDENT_DELETED: 'STUDENT_DELETED',
  MARK_CREATED: 'MARK_CREATED',
  MARK_UPDATED: 'MARK_UPDATED',
  MARK_SUBMITTED: 'MARK_SUBMITTED',
  MARK_APPROVED: 'MARK_APPROVED',
  MARK_REJECTED: 'MARK_REJECTED',
  ATTENDANCE_UPDATED: 'ATTENDANCE_UPDATED',
  REPORT_GENERATED: 'REPORT_GENERATED',
  REPORT_ACCESSED: 'REPORT_ACCESSED',
  WHATSAPP_SENT: 'WHATSAPP_SENT',
  WHATSAPP_FAILED: 'WHATSAPP_FAILED',
  EVENT_CREATED: 'EVENT_CREATED',
  ROLE_CHANGED: 'ROLE_CHANGED',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  SESSION_TERMINATED: 'SESSION_TERMINATED',
} as const;

export const ALLOWED_UPLOAD_EXTENSIONS = ['.xlsx', '.csv', '.pdf', '.jpg', '.jpeg', '.png'];
export const ALLOWED_EXCEL_EXTENSIONS = ['.xlsx', '.csv'];

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

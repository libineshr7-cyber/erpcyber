import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorizeRoles } from '../middleware/authorize';
import * as academicService from '../services/academicService';
import * as securityService from '../services/securityService';
import * as authService from '../services/authService';
import { success, paginated, error } from '../utils/response';
import { createAuditLog } from '../middleware/auditLog';
import { z } from 'zod';
import { validate } from '../middleware/validateRequest';
import pool from '../config/database';

const router = Router();
router.use(authenticate);
router.use(authorizeRoles('HOD', 'SUPER_ADMIN'));

// ─── HOD User Management (Create & Delete HOD/Admin Users) ───────────────────
router.post('/users', validate(z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  role: z.enum(['HOD', 'SUPER_ADMIN']),
})), async (req: Request, res: Response): Promise<void> => {
  const { username, email, role } = req.body as { username: string; email: string; role: 'HOD' | 'SUPER_ADMIN' };

  const existing = await pool.query('SELECT user_id FROM users WHERE username = $1', [username.toLowerCase()]);
  if (existing.rows.length > 0) { error(res, 'Username already exists', 409); return; }

  const defaultPasswordHash = await authService.hashPassword('123');

  const result = await pool.query(
    `INSERT INTO users (email, username, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING user_id, username, email, role, created_at`,
    [email, username.toLowerCase(), defaultPasswordHash, role]
  );

  await createAuditLog(req, { action: 'HOD_USER_CREATED', resourceType: 'user', resourceId: result.rows[0].user_id });
  success(res, { ...result.rows[0], defaultPassword: '123' }, 'HOD account created with default password 123');
});

router.delete('/users/:id', async (req: Request, res: Response): Promise<void> => {
  if (req.params.id === req.user!.userId) {
    error(res, 'You cannot delete your own account', 400);
    return;
  }

  await pool.query("UPDATE users SET account_status = 'INACTIVE' WHERE user_id = $1", [req.params.id]);
  await createAuditLog(req, { action: 'HOD_USER_DELETED', resourceType: 'user', resourceId: req.params.id });
  success(res, null, 'HOD account deleted/deactivated');
});

// ─── Academic Years ───────────────────────────────────────────────────────────
router.get('/academic-years', async (_req: Request, res: Response): Promise<void> => {
  success(res, await academicService.getAcademicYears());
});

router.post('/academic-years', validate(z.object({
  label: z.string().regex(/^\d{4}-\d{4}$/),
  startDate: z.string(),
  endDate: z.string(),
})), async (req: Request, res: Response): Promise<void> => {
  const result = await academicService.createAcademicYear(req.body, req.user!.userId);
  success(res, result, 'Academic year created');
});

router.post('/academic-years/:id/set-current', async (req: Request, res: Response): Promise<void> => {
  await academicService.setCurrentAcademicYear(req.params.id);
  success(res, null, 'Current academic year updated');
});

// ─── Semesters ────────────────────────────────────────────────────────────────
router.get('/semesters', async (req: Request, res: Response): Promise<void> => {
  success(res, await academicService.getSemesters(req.query.academicYearId as string));
});

router.post('/semesters', async (req: Request, res: Response): Promise<void> => {
  const result = await academicService.createSemester(req.body);
  success(res, result, 'Semester created');
});

// ─── Sections ─────────────────────────────────────────────────────────────────
router.get('/sections', async (req: Request, res: Response): Promise<void> => {
  success(res, await academicService.getSections(req.query as Record<string, unknown>));
});

router.post('/sections', async (req: Request, res: Response): Promise<void> => {
  const result = await academicService.createSection(req.body);
  success(res, result, 'Section created');
});

// ─── Subjects ─────────────────────────────────────────────────────────────────
router.get('/subjects', async (req: Request, res: Response): Promise<void> => {
  const result = await academicService.getSubjects(req.query as Record<string, unknown>);
  paginated(res, result.subjects, result.total, result.page, result.limit);
});

router.post('/subjects', async (req: Request, res: Response): Promise<void> => {
  const result = await academicService.createSubject(req.body, req.user!.userId);
  success(res, result, 'Subject created');
});

router.put('/subjects/:id', async (req: Request, res: Response): Promise<void> => {
  await academicService.updateSubject(req.params.id, req.body);
  success(res, null, 'Subject updated');
});

// ─── Exams ────────────────────────────────────────────────────────────────────
router.get('/exams', async (req: Request, res: Response): Promise<void> => {
  success(res, await academicService.getExams(req.query as Record<string, unknown>));
});

router.post('/exams', async (req: Request, res: Response): Promise<void> => {
  const result = await academicService.createExam(req.body, req.user!.userId);
  success(res, result, 'Exam created');
});

// ─── Events ───────────────────────────────────────────────────────────────────
router.get('/events', async (req: Request, res: Response): Promise<void> => {
  success(res, await academicService.getEvents((req.query.filter as 'upcoming' | 'past' | 'all') || 'all'));
});

router.post('/events', async (req: Request, res: Response): Promise<void> => {
  const result = await academicService.createEvent(req.body, req.user!.userId);
  await createAuditLog(req, { action: 'EVENT_CREATED', resourceType: 'event', resourceId: result.event_id });
  success(res, result, 'Event created');
});

router.post('/events/:id/publish', async (req: Request, res: Response): Promise<void> => {
  await academicService.publishEvent(req.params.id);
  success(res, null, 'Event published');
});

router.delete('/events/:id', async (req: Request, res: Response): Promise<void> => {
  await academicService.archiveEvent(req.params.id);
  success(res, null, 'Event archived');
});

// ─── Announcements ────────────────────────────────────────────────────────────
router.get('/announcements', async (_req: Request, res: Response): Promise<void> => {
  success(res, await academicService.getAnnouncements());
});

router.post('/announcements', async (req: Request, res: Response): Promise<void> => {
  const result = await academicService.createAnnouncement(req.body, req.user!.userId);
  success(res, result, 'Announcement created');
});

// ─── Security ─────────────────────────────────────────────────────────────────
router.get('/security/overview', async (_req: Request, res: Response): Promise<void> => {
  success(res, await securityService.getSecurityOverview());
});

router.get('/security/events', async (req: Request, res: Response): Promise<void> => {
  const result = await securityService.getSecurityEvents(req.query as Record<string, unknown>);
  success(res, result);
});

router.put('/security/events/:id/resolve', async (req: Request, res: Response): Promise<void> => {
  await securityService.resolveSecurityEvent(req.params.id, req.user!.userId);
  success(res, null, 'Event resolved');
});

router.get('/security/sessions', async (req: Request, res: Response): Promise<void> => {
  const userId = (req.query.userId as string) || req.user!.userId;
  success(res, await authService.getActiveSessions(userId));
});

router.delete('/security/sessions/:sid', async (req: Request, res: Response): Promise<void> => {
  await authService.terminateSession(req.params.sid);
  await createAuditLog(req, { action: 'SESSION_TERMINATED', resourceId: req.params.sid });
  success(res, null, 'Session terminated');
});

// ─── Audit Logs ───────────────────────────────────────────────────────────────
router.get('/audit-logs', async (req: Request, res: Response): Promise<void> => {
  const result = await academicService.getAuditLogs(req.query as Record<string, unknown>);
  paginated(res, result.logs, result.total, result.page, result.limit);
});

export default router;

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorizeRoles } from '../middleware/authorize';
import * as staffService from '../services/staffService';
import * as academicService from '../services/academicService';
import { success, paginated } from '../utils/response';
import { handleWhatsAppWebhook } from '../services/whatsappService';
import { config } from '../config/env';
import { safeCompare } from '../utils/crypto';

const router = Router();

// ─── WhatsApp Webhook (no auth — verified by token) ─────────────────────────
router.get('/whatsapp/webhook', (req: Request, res: Response): void => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && safeCompare(String(token), config.whatsapp.webhookVerifyToken)) {
    res.status(200).send(challenge);
  } else {
    res.status(403).json({ error: 'Verification failed' });
  }
});

router.post('/whatsapp/webhook', async (req: Request, res: Response): Promise<void> => {
  // Acknowledge immediately (Meta requires fast response)
  res.status(200).json({ status: 'ok' });
  // Process async
  await handleWhatsAppWebhook(req.body as Record<string, unknown>);
});

// ─── Staff Routes (HOD only for management) ──────────────────────────────────
router.use(authenticate);

router.get('/staff', authorizeRoles('HOD', 'SUPER_ADMIN'), async (req: Request, res: Response): Promise<void> => {
  const result = await staffService.getStaff(req.query as Record<string, unknown>);
  paginated(res, result.staff, result.total, result.page, result.limit);
});

router.post('/staff', authorizeRoles('HOD', 'SUPER_ADMIN'), async (req: Request, res: Response): Promise<void> => {
  const result = await staffService.createStaff(req.body, req.user!.userId);
  success(res, result, 'Staff created');
});

router.get('/staff/:id', authorizeRoles('HOD', 'SUPER_ADMIN'), async (req: Request, res: Response): Promise<void> => {
  success(res, await staffService.getStaffById(req.params.id));
});

router.get('/staff/:id/assignments', async (req: Request, res: Response): Promise<void> => {
  success(res, await staffService.getStaffAssignments(req.params.id));
});

router.post('/staff/:id/assignments', authorizeRoles('HOD', 'SUPER_ADMIN'), async (req: Request, res: Response): Promise<void> => {
  await staffService.assignSubjectsToStaff(req.params.id, req.body.assignments);
  success(res, null, 'Assignments added');
});

router.delete('/staff/:id/assignments/:aid', authorizeRoles('HOD', 'SUPER_ADMIN'), async (req: Request, res: Response): Promise<void> => {
  await staffService.removeStaffAssignment(req.params.aid);
  success(res, null, 'Assignment removed');
});

// ─── Shared routes (Staff + HOD) ─────────────────────────────────────────────
// Subjects — staff can read, HOD writes
router.get('/subjects', async (req: Request, res: Response): Promise<void> => {
  const result = await academicService.getSubjects(req.query as Record<string, unknown>);
  paginated(res, result.subjects, result.total, result.page, result.limit);
});

router.get('/exams', async (req: Request, res: Response): Promise<void> => {
  success(res, await academicService.getExams(req.query as Record<string, unknown>));
});

router.get('/events', async (req: Request, res: Response): Promise<void> => {
  success(res, await academicService.getEvents('all'));
});

router.get('/announcements', async (_req: Request, res: Response): Promise<void> => {
  success(res, await academicService.getAnnouncements());
});

// Attendance
router.post('/attendance', async (req: Request, res: Response): Promise<void> => {
  const { entries } = req.body as { entries: Parameters<typeof academicService.enterAttendance>[0] };
  await academicService.enterAttendance(entries, req.user!.userId);
  success(res, null, 'Attendance recorded');
});

export default router;

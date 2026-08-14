import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorizeRoles, authorizeStudentAccess } from '../middleware/authorize';
import { createSecurityEvent } from '../services/securityService';
import * as studentService from '../services/studentService';
import * as academicService from '../services/academicService';
import * as pdfService from '../pdf/pdfService';
import { success, forbidden, notFound } from '../utils/response';
import pool from '../config/database';
import { createAuditLog } from '../middleware/auditLog';
import * as fs from 'fs';

const router = Router();
router.use(authenticate);
router.use(authorizeRoles('STUDENT'));

// GET /api/student-portal/profile — own profile ONLY, no parent phone
router.get('/profile', async (req: Request, res: Response): Promise<void> => {
  if (!req.user!.studentId) { forbidden(res); return; }

  const student = await studentService.getStudentById(req.user!.studentId);
  if (!student) { notFound(res); return; }

  // Remove ALL phone-related fields for student view
  const safeProfile = { ...student };
  delete (safeProfile as Record<string, unknown>).parent_whatsapp_masked;
  delete (safeProfile as Record<string, unknown>).parent_name;
  delete (safeProfile as Record<string, unknown>).parent_whatsapp_encrypted;

  success(res, safeProfile);
});

// GET /api/student-portal/marks — OWN approved marks only
router.get('/marks', async (req: Request, res: Response): Promise<void> => {
  if (!req.user!.studentId) { forbidden(res); return; }
  const marks = await studentService.getStudentMarks(
    req.user!.studentId,
    req.query.academicYearId as string,
    req.query.examId as string
  );
  success(res, marks);
});

// GET /api/student-portal/attendance — OWN attendance only
router.get('/attendance', async (req: Request, res: Response): Promise<void> => {
  if (!req.user!.studentId) { forbidden(res); return; }
  const attendance = await studentService.getStudentAttendanceSummary(
    req.user!.studentId,
    req.query.academicYearId as string
  );
  success(res, attendance);
});

// GET /api/student-portal/reports — OWN approved reports only
router.get('/reports', async (req: Request, res: Response): Promise<void> => {
  if (!req.user!.studentId) { forbidden(res); return; }

  const result = await pool.query(
    `SELECT r.report_id, r.status, r.generated_at, e.exam_name, e.exam_date
     FROM reports r
     JOIN exams e ON r.exam_id = e.exam_id
     WHERE r.student_id = $1 AND r.status = 'READY'
     ORDER BY r.generated_at DESC`,
    [req.user!.studentId]
  );
  success(res, result.rows);
});

// GET /api/student-portal/reports/:uuid/download — OWN report only
router.get('/reports/:uuid/download', async (req: Request, res: Response): Promise<void> => {
  if (!req.user!.studentId) { forbidden(res); return; }

  try {
    const filePath = await pdfService.authorizeReportDownload(
      req.params.uuid,
      req.user!.userId,
      'STUDENT',
      req.user!.studentId
    );

    await createAuditLog(req, { action: 'REPORT_ACCESSED', resourceType: 'report', resourceId: req.params.uuid });

    if (!fs.existsSync(filePath)) { notFound(res, 'Report file not found'); return; }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report-${req.params.uuid}.pdf"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    fs.createReadStream(filePath).pipe(res);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Access denied';
    forbidden(res, msg);
  }
});

// GET /api/student-portal/events — published events
router.get('/events', async (_req: Request, res: Response): Promise<void> => {
  const events = await academicService.getEvents('all');
  success(res, events);
});

// GET /api/student-portal/announcements — published announcements
router.get('/announcements', async (_req: Request, res: Response): Promise<void> => {
  const announcements = await academicService.getAnnouncements();
  success(res, announcements);
});

export default router;

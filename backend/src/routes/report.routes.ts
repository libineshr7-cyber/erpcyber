import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize, authorizeRoles } from '../middleware/authorize';
import { pdfLimiter, whatsappLimiter } from '../middleware/rateLimiter';
import { createAuditLog } from '../middleware/auditLog';
import * as pdfService from '../pdf/pdfService';
import * as whatsappService from '../services/whatsappService';
import * as fs from 'fs';
import { success, created, notFound, error } from '../utils/response';
import pool from '../config/database';
import { parsePagination } from '../utils/pagination';

const router = Router();
router.use(authenticate);

// POST /api/reports/generate
router.post('/generate', pdfLimiter, authorize('reports:generate'), async (req: Request, res: Response): Promise<void> => {
  const { studentId, examId } = req.body as { studentId: string; examId: string };
  const result = await pdfService.generateStudentReport(studentId, examId, req.user!.userId);
  await createAuditLog(req, { action: 'REPORT_GENERATED', resourceType: 'report', resourceId: result.reportId, metadata: { studentId, examId } });
  created(res, { reportId: result.reportId });
});

// GET /api/reports
router.get('/', authorize('reports:read'), async (req: Request, res: Response): Promise<void> => {
  const { limit, offset } = parsePagination(req.query as Record<string, unknown>);
  const result = await pool.query(
    `SELECT r.report_id, r.status, r.generated_at,
            s.register_number, s.name AS student_name,
            e.exam_name
     FROM reports r
     JOIN students s ON r.student_id = s.student_id
     JOIN exams e ON r.exam_id = e.exam_id
     ORDER BY r.generated_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  success(res, result.rows);
});

// GET /api/reports/:uuid — Authorized download
router.get('/:uuid', authorize('reports:read'), async (req: Request, res: Response): Promise<void> => {
  const filePath = await pdfService.authorizeReportDownload(
    req.params.uuid,
    req.user!.userId,
    req.user!.role,
    req.user!.studentId
  );

  await createAuditLog(req, { action: 'REPORT_ACCESSED', resourceType: 'report', resourceId: req.params.uuid });

  if (!fs.existsSync(filePath)) {
    notFound(res, 'Report file not found');
    return;
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="report-${req.params.uuid}.pdf"`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

// POST /api/reports/:uuid/send-whatsapp
router.post('/:uuid/send-whatsapp', whatsappLimiter, authorize('whatsapp:send'), async (req: Request, res: Response): Promise<void> => {
  const result = await whatsappService.sendReportViaWhatsApp(req.params.uuid, req.user!.userId);

  await createAuditLog(req, {
    action: result.success ? 'WHATSAPP_SENT' : 'WHATSAPP_FAILED',
    resourceType: 'report',
    resourceId: req.params.uuid,
    metadata: { messageId: result.messageId, error: result.error },
  });

  if (!result.success) {
    error(res, result.error || 'Failed to send WhatsApp message', 500);
    return;
  }

  success(res, { messageId: result.messageId }, 'WhatsApp message sent');
});

// POST /api/whatsapp/bulk-preview
router.post('/whatsapp/bulk-preview', authorize('whatsapp:send'), async (req: Request, res: Response): Promise<void> => {
  const { examId } = req.body as { examId: string };
  const preview = await whatsappService.bulkSendPreview(examId);
  success(res, preview);
});

// GET /api/whatsapp/logs
router.get('/whatsapp/logs', authorize('whatsapp:send'), async (req: Request, res: Response): Promise<void> => {
  const logs = await whatsappService.getWhatsAppLogs(req.query as Record<string, unknown>);
  success(res, logs);
});

export default router;

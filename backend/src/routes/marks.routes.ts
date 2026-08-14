import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { authorize, authorizeRoles } from '../middleware/authorize';
import { validate } from '../middleware/validateRequest';
import { uploadLimiter } from '../middleware/rateLimiter';
import { excelUpload } from '../middleware/upload';
import { createAuditLog } from '../middleware/auditLog';
import { checkBulkMarkChange } from '../services/securityService';
import * as marksService from '../services/marksService';
import * as fs from 'fs';
import { success, created, error, paginated } from '../utils/response';

const router = Router();
router.use(authenticate);

const enterMarkSchema = z.object({
  studentId: z.string().uuid(),
  subjectId: z.string().uuid(),
  examId: z.string().uuid(),
  marksObtained: z.number().min(0).optional(),
  isAbsent: z.boolean().optional(),
}).refine(d => d.isAbsent || d.marksObtained !== undefined, {
  message: 'Either isAbsent or marksObtained must be provided',
});

const bulkMarkSchema = z.object({
  entries: z.array(enterMarkSchema).min(1).max(500),
});

const approveRejectSchema = z.object({
  reason: z.string().min(1).max(500).optional(),
});

// GET /api/marks
router.get('/', authorize('marks:read'), async (req: Request, res: Response): Promise<void> => {
  const result = await marksService.getMarks(req.query as Record<string, unknown>, req.user!.role, req.user!.userId);
  paginated(res, result.marks, result.total, result.page, result.limit);
});

// POST /api/marks
router.post('/', authorize('marks:write'), validate(enterMarkSchema), async (req: Request, res: Response): Promise<void> => {
  const result = await marksService.enterMark(req.body, req.user!.userId);
  await createAuditLog(req, { action: 'MARK_CREATED', resourceType: 'mark', resourceId: result.markId });
  await checkBulkMarkChange(req.user!.userId, req.user!.username);
  created(res, result);
});

// POST /api/marks/bulk
router.post('/bulk', authorize('marks:write'), validate(bulkMarkSchema), async (req: Request, res: Response): Promise<void> => {
  const { entries } = req.body as { entries: Parameters<typeof marksService.enterMark>[0][] };
  const result = await marksService.bulkEnterMarks(entries, req.user!.userId);
  await createAuditLog(req, { action: 'MARK_CREATED', metadata: { count: result.success } });
  await checkBulkMarkChange(req.user!.userId, req.user!.username);
  success(res, result);
});

// POST /api/marks/import — Excel preview
router.post('/import', uploadLimiter, authorize('marks:write'), excelUpload.single('file'), async (req: Request, res: Response): Promise<void> => {
  if (!req.file) { error(res, 'No file uploaded', 400); return; }
  const { examId, subjectId } = req.body as { examId: string; subjectId: string };
  const fileBuffer = fs.readFileSync(req.file.path);
  const preview = await marksService.importMarksPreview(fileBuffer, examId, subjectId);
  fs.unlinkSync(req.file.path); // Clean up temp file
  success(res, preview);
});

// POST /api/marks/import/confirm
router.post('/import/confirm', authorize('marks:write'), async (req: Request, res: Response): Promise<void> => {
  const { validRows, examId, subjectId } = req.body as {
    validRows: Awaited<ReturnType<typeof marksService.importMarksPreview>>['valid'];
    examId: string;
    subjectId: string;
  };
  const result = await marksService.importMarksCommit(validRows, examId, subjectId, req.user!.userId);
  await createAuditLog(req, { action: 'MARK_CREATED', metadata: { source: 'excel_import', imported: result.imported } });
  success(res, result);
});

// GET /api/marks/pending-approval
router.get('/pending-approval', authorizeRoles('HOD', 'SUPER_ADMIN'), async (req: Request, res: Response): Promise<void> => {
  const result = await marksService.getPendingApprovals(req.query as Record<string, unknown>);
  paginated(res, result.marks, result.total, result.page, result.limit);
});

// POST /api/marks/:id/submit
router.post('/:id/submit', authorize('marks:write'), async (req: Request, res: Response): Promise<void> => {
  await marksService.submitMarkForApproval(req.params.id, req.user!.userId);
  await createAuditLog(req, { action: 'MARK_SUBMITTED', resourceType: 'mark', resourceId: req.params.id });
  success(res, null, 'Mark submitted for approval');
});

// POST /api/marks/bulk-submit
router.post('/bulk-submit', authorize('marks:write'), async (req: Request, res: Response): Promise<void> => {
  const { examId, subjectId } = req.body as { examId: string; subjectId: string };
  const count = await marksService.bulkSubmitMarks(examId, subjectId, req.user!.userId);
  await createAuditLog(req, { action: 'MARK_SUBMITTED', metadata: { count, examId, subjectId } });
  success(res, { submitted: count });
});

// POST /api/marks/:id/approve
router.post('/:id/approve', authorizeRoles('HOD', 'SUPER_ADMIN'), async (req: Request, res: Response): Promise<void> => {
  await marksService.approveMark(req.params.id, req.user!.userId);
  await createAuditLog(req, { action: 'MARK_APPROVED', resourceType: 'mark', resourceId: req.params.id });
  success(res, null, 'Mark approved');
});

// POST /api/marks/:id/reject
router.post('/:id/reject', authorizeRoles('HOD', 'SUPER_ADMIN'), validate(z.object({ reason: z.string().min(1).max(500) })), async (req: Request, res: Response): Promise<void> => {
  const { reason } = req.body as { reason: string };
  await marksService.rejectMark(req.params.id, req.user!.userId, reason);
  await createAuditLog(req, { action: 'MARK_REJECTED', resourceType: 'mark', resourceId: req.params.id, reason });
  success(res, null, 'Mark rejected');
});

// GET /api/marks/:id/history
router.get('/:id/history', authorize('marks:read'), async (req: Request, res: Response): Promise<void> => {
  const history = await marksService.getMarkHistory(req.params.id);
  success(res, history);
});

export default router;

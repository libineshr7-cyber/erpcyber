import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { authorize, authorizeRoles } from '../middleware/authorize';
import { validate } from '../middleware/validateRequest';
import { createAuditLog } from '../middleware/auditLog';
import * as studentService from '../services/studentService';
import { success, created, notFound, paginated } from '../utils/response';

const router = Router();
router.use(authenticate);

const createStudentSchema = z.object({
  registerNumber: z.string().min(3).max(20).regex(/^[A-Z0-9]+$/, 'Only uppercase letters and numbers'),
  name: z.string().min(2).max(255),
  email: z.string().email().optional(),
  programme: z.string().min(2).max(100),
  departmentId: z.string().uuid().optional(),
  batch: z.string().regex(/^\d{4}-\d{4}$/, 'Format: YYYY-YYYY'),
  admissionYear: z.number().int().min(2000).max(2100),
  currentYear: z.number().int().min(1).max(4),
  currentSemester: z.number().int().min(1).max(8),
  sectionId: z.string().uuid().optional(),
  parentName: z.string().max(255).optional(),
  parentWhatsapp: z.string().regex(/^\+\d{10,15}$/, 'E.164 format: +919876543210').optional(),
  dob: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
});

const enrollSubjectsSchema = z.object({
  subjectIds: z.array(z.string().uuid()).min(1),
  academicYearId: z.string().uuid(),
  semesterId: z.string().uuid().optional(),
});

// GET /api/students
router.get('/', authorize('students:read'), async (req: Request, res: Response): Promise<void> => {
  const result = await studentService.getStudents(req.query as Record<string, unknown>);
  paginated(res, result.students, result.total, result.page, result.limit);
});

// POST /api/students
router.post('/', authorizeRoles('HOD', 'SUPER_ADMIN'), validate(createStudentSchema), async (req: Request, res: Response): Promise<void> => {
  const student = await studentService.createStudent(req.body, req.user!.userId);
  await createAuditLog(req, { action: 'STUDENT_CREATED', resourceType: 'student', resourceId: student.student_id, newValue: { registerNumber: student.register_number } });
  created(res, student, 'Student created successfully');
});

// GET /api/students/:id
router.get('/:id', authorize('students:read'), async (req: Request, res: Response): Promise<void> => {
  const student = await studentService.getStudentById(req.params.id);
  if (!student) { notFound(res); return; }
  success(res, student);
});

// PUT /api/students/:id
router.put('/:id', authorizeRoles('HOD', 'SUPER_ADMIN'), async (req: Request, res: Response): Promise<void> => {
  await studentService.updateStudent(req.params.id, req.body);
  await createAuditLog(req, { action: 'STUDENT_UPDATED', resourceType: 'student', resourceId: req.params.id });
  success(res, null, 'Student updated');
});

// DELETE /api/students/:id
router.delete('/:id', authorizeRoles('HOD', 'SUPER_ADMIN'), async (req: Request, res: Response): Promise<void> => {
  await studentService.softDeleteStudent(req.params.id);
  await createAuditLog(req, { action: 'STUDENT_DELETED', resourceType: 'student', resourceId: req.params.id });
  success(res, null, 'Student archived');
});

// POST /api/students/:id/subjects
router.post('/:id/subjects', authorize('students:write'), validate(enrollSubjectsSchema), async (req: Request, res: Response): Promise<void> => {
  const { subjectIds, academicYearId, semesterId } = req.body as { subjectIds: string[]; academicYearId: string; semesterId?: string };
  await studentService.enrollStudentInSubjects(req.params.id, subjectIds, academicYearId, semesterId);
  success(res, null, 'Subjects enrolled');
});

// GET /api/students/:id/subjects
router.get('/:id/subjects', authorize('students:read'), async (req: Request, res: Response): Promise<void> => {
  const subjects = await studentService.getStudentSubjects(req.params.id, req.query.academicYearId as string);
  success(res, subjects);
});

// GET /api/students/:id/marks
router.get('/:id/marks', authorize('marks:read'), async (req: Request, res: Response): Promise<void> => {
  const marks = await studentService.getStudentMarks(req.params.id, req.query.academicYearId as string, req.query.examId as string);
  success(res, marks);
});

// GET /api/students/:id/attendance
router.get('/:id/attendance', authorize('attendance:read'), async (req: Request, res: Response): Promise<void> => {
  const attendance = await studentService.getStudentAttendanceSummary(req.params.id, req.query.academicYearId as string);
  success(res, attendance);
});

export default router;

import pool from '../config/database';
import { GRADE_THRESHOLDS } from '../config/constants';
import { AppErr } from '../middleware/errorHandler';
import { parsePagination } from '../utils/pagination';
import * as XLSX from 'xlsx';
import logger from '../utils/logger';

// ─── Grade Calculation ────────────────────────────────────────────────────────

export function calculateGrade(marksObtained: number, maximumMarks: number, passingMarks: number): {
  grade: string;
  result: string;
  percentage: number;
} {
  const percentage = (marksObtained / maximumMarks) * 100;
  const passPercentage = (passingMarks / maximumMarks) * 100;

  if (percentage < passPercentage) {
    return { grade: 'F', result: 'FAIL', percentage };
  }

  const threshold = GRADE_THRESHOLDS.find(t => percentage >= t.min);
  return {
    grade: threshold?.grade || 'F',
    result: 'PASS',
    percentage,
  };
}

// ─── Enter / Update Mark ─────────────────────────────────────────────────────

export interface EnterMarkInput {
  studentId: string;
  subjectId: string;
  examId: string;
  marksObtained?: number;
  isAbsent?: boolean;
}

export async function enterMark(input: EnterMarkInput, createdByUserId: string) {
  // Validate maximum marks from exam/subject
  const examResult = await pool.query(
    'SELECT maximum_marks, passing_marks FROM exams WHERE exam_id = $1',
    [input.examId]
  );
  if (examResult.rows.length === 0) throw new AppErr('Exam not found', 404);

  const subjectResult = await pool.query(
    'SELECT maximum_marks, passing_marks FROM subjects WHERE subject_id = $1',
    [input.subjectId]
  );
  if (subjectResult.rows.length === 0) throw new AppErr('Subject not found', 404);

  // Use exam's maximum marks (or subject's as fallback)
  const maxMarks = examResult.rows[0].maximum_marks;
  const passingMarks = examResult.rows[0].passing_marks || subjectResult.rows[0].passing_marks;

  if (!input.isAbsent && input.marksObtained !== undefined) {
    if (input.marksObtained < 0) throw new AppErr('Marks cannot be negative', 400);
    if (input.marksObtained > maxMarks) throw new AppErr(`Marks cannot exceed maximum (${maxMarks})`, 400);
  }

  const { grade, result } = input.isAbsent
    ? { grade: '-', result: 'ABSENT' }
    : calculateGrade(input.marksObtained!, maxMarks, passingMarks);

  // Check if mark already exists
  const existing = await pool.query(
    'SELECT mark_id, marks_obtained, status, version FROM marks WHERE student_id = $1 AND subject_id = $2 AND exam_id = $3',
    [input.studentId, input.subjectId, input.examId]
  );

  if (existing.rows.length > 0) {
    const existingMark = existing.rows[0];

    if (existingMark.status === 'APPROVED') {
      throw new AppErr('Cannot modify approved marks. Contact HOD to reject first.', 409);
    }

    // Save version history
    await pool.query(
      `INSERT INTO mark_versions (mark_id, version_number, old_marks, new_marks, old_status, new_status, change_reason, changed_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        existingMark.mark_id,
        existingMark.version,
        existingMark.marks_obtained,
        input.isAbsent ? null : input.marksObtained,
        existingMark.status,
        'DRAFT',
        'Mark updated',
        createdByUserId,
      ]
    );

    await pool.query(
      `UPDATE marks SET marks_obtained = $1, maximum_marks = $2, grade = $3, result = $4,
         is_absent = $5, status = 'DRAFT', version = version + 1, updated_at = NOW()
       WHERE mark_id = $6`,
      [
        input.isAbsent ? null : input.marksObtained,
        maxMarks, grade, result, input.isAbsent || false,
        existingMark.mark_id,
      ]
    );

    return { markId: existingMark.mark_id, action: 'updated' };
  }

  // Create new mark
  const insertResult = await pool.query(
    `INSERT INTO marks (student_id, subject_id, exam_id, marks_obtained, maximum_marks, grade, result, is_absent, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING mark_id`,
    [
      input.studentId, input.subjectId, input.examId,
      input.isAbsent ? null : input.marksObtained,
      maxMarks, grade, result, input.isAbsent || false,
      createdByUserId,
    ]
  );

  return { markId: insertResult.rows[0].mark_id, action: 'created' };
}

// ─── Bulk Mark Entry ─────────────────────────────────────────────────────────

export async function bulkEnterMarks(
  entries: EnterMarkInput[],
  createdByUserId: string
): Promise<{ success: number; errors: Array<{ studentId: string; error: string }> }> {
  let success = 0;
  const errors: Array<{ studentId: string; error: string }> = [];

  for (const entry of entries) {
    try {
      await enterMark(entry, createdByUserId);
      success++;
    } catch (err: unknown) {
      errors.push({
        studentId: entry.studentId,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return { success, errors };
}

// ─── Excel Import ────────────────────────────────────────────────────────────

export interface ImportPreviewResult {
  valid: Array<{ registerNumber: string; studentName: string; marksObtained: number | null; isAbsent: boolean }>;
  invalid: Array<{ row: number; registerNumber: string; error: string }>;
  warnings: Array<{ row: number; registerNumber: string; warning: string }>;
  canCommit: boolean;
}

export async function importMarksPreview(
  fileBuffer: Buffer,
  examId: string,
  subjectId: string
): Promise<ImportPreviewResult> {
  // Prevent formula injection — sanitize cell values
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: Array<Record<string, unknown>> = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  const examResult = await pool.query(
    'SELECT maximum_marks FROM exams WHERE exam_id = $1',
    [examId]
  );
  if (examResult.rows.length === 0) throw new AppErr('Exam not found', 404);
  const maxMarks = examResult.rows[0].maximum_marks;

  const valid: ImportPreviewResult['valid'] = [];
  const invalid: ImportPreviewResult['invalid'] = [];
  const warnings: ImportPreviewResult['warnings'] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // 1-indexed, row 1 is header

    const rawRegNo = String(row['Register Number'] || row['register_number'] || row['Reg No'] || '').trim();
    const rawMarks = row['Marks'] || row['marks'] || row['Marks Obtained'] || '';

    if (!rawRegNo) {
      invalid.push({ row: rowNum, registerNumber: '', error: 'Missing register number' });
      continue;
    }

    // Excel injection prevention
    if (typeof rawRegNo === 'string' && ['=', '+', '-', '@'].includes(rawRegNo[0])) {
      invalid.push({ row: rowNum, registerNumber: rawRegNo, error: 'Invalid register number format' });
      continue;
    }

    // Look up student
    const studentResult = await pool.query(
      'SELECT student_id, name FROM students WHERE register_number = $1 AND account_status != \'ARCHIVED\'',
      [rawRegNo]
    );

    if (studentResult.rows.length === 0) {
      invalid.push({ row: rowNum, registerNumber: rawRegNo, error: 'Student not found' });
      continue;
    }

    const isAbsent = String(rawMarks).toUpperCase() === 'AB' || String(rawMarks).toUpperCase() === 'ABSENT';

    if (!isAbsent) {
      const marks = parseFloat(String(rawMarks));
      if (isNaN(marks)) {
        invalid.push({ row: rowNum, registerNumber: rawRegNo, error: `Invalid marks value: "${rawMarks}"` });
        continue;
      }
      if (marks < 0) {
        invalid.push({ row: rowNum, registerNumber: rawRegNo, error: 'Marks cannot be negative' });
        continue;
      }
      if (marks > maxMarks) {
        invalid.push({ row: rowNum, registerNumber: rawRegNo, error: `Marks ${marks} exceed maximum ${maxMarks}` });
        continue;
      }
      if (marks === 0) {
        warnings.push({ row: rowNum, registerNumber: rawRegNo, warning: 'Marks are 0 — please confirm' });
      }

      valid.push({
        registerNumber: rawRegNo,
        studentName: studentResult.rows[0].name,
        marksObtained: marks,
        isAbsent: false,
      });
    } else {
      valid.push({
        registerNumber: rawRegNo,
        studentName: studentResult.rows[0].name,
        marksObtained: null,
        isAbsent: true,
      });
    }
  }

  return { valid, invalid, warnings, canCommit: invalid.length === 0 };
}

export async function importMarksCommit(
  validRows: ImportPreviewResult['valid'],
  examId: string,
  subjectId: string,
  createdByUserId: string
): Promise<{ imported: number; failed: number }> {
  let imported = 0;
  let failed = 0;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const row of validRows) {
      const studentResult = await client.query(
        'SELECT student_id FROM students WHERE register_number = $1',
        [row.registerNumber]
      );
      if (studentResult.rows.length === 0) { failed++; continue; }

      try {
        await enterMark({
          studentId: studentResult.rows[0].student_id,
          subjectId,
          examId,
          marksObtained: row.marksObtained ?? undefined,
          isAbsent: row.isAbsent,
        }, createdByUserId);
        imported++;
      } catch {
        failed++;
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return { imported, failed };
}

// ─── Submit for Approval ─────────────────────────────────────────────────────

export async function submitMarkForApproval(markId: string, staffUserId: string) {
  const result = await pool.query(
    'SELECT mark_id, status, created_by FROM marks WHERE mark_id = $1',
    [markId]
  );
  if (result.rows.length === 0) throw new AppErr('Mark not found', 404);

  const mark = result.rows[0];
  if (mark.status !== 'DRAFT') throw new AppErr(`Cannot submit mark with status: ${mark.status}`, 400);

  await pool.query(
    `UPDATE marks SET status = 'SUBMITTED', submitted_by = $1, submitted_at = NOW(), updated_at = NOW()
     WHERE mark_id = $2`,
    [staffUserId, markId]
  );
}

export async function bulkSubmitMarks(examId: string, subjectId: string, staffUserId: string) {
  const result = await pool.query(
    `UPDATE marks SET status = 'SUBMITTED', submitted_by = $1, submitted_at = NOW(), updated_at = NOW()
     WHERE exam_id = $2 AND subject_id = $3 AND status = 'DRAFT'
     RETURNING mark_id`,
    [staffUserId, examId, subjectId]
  );
  return result.rows.length;
}

// ─── HOD Approval ────────────────────────────────────────────────────────────

export async function approveMark(markId: string, hodUserId: string) {
  const result = await pool.query(
    'SELECT mark_id, status FROM marks WHERE mark_id = $1',
    [markId]
  );
  if (result.rows.length === 0) throw new AppErr('Mark not found', 404);
  if (result.rows[0].status !== 'SUBMITTED') throw new AppErr('Only submitted marks can be approved', 400);

  await pool.query(
    `UPDATE marks SET status = 'APPROVED', approved_by = $1, approved_at = NOW(), updated_at = NOW()
     WHERE mark_id = $2`,
    [hodUserId, markId]
  );

  await pool.query(
    `INSERT INTO mark_approvals (mark_id, reviewed_by, action) VALUES ($1, $2, 'APPROVE')`,
    [markId, hodUserId]
  );
}

export async function rejectMark(markId: string, hodUserId: string, reason: string) {
  const result = await pool.query('SELECT mark_id, status FROM marks WHERE mark_id = $1', [markId]);
  if (result.rows.length === 0) throw new AppErr('Mark not found', 404);
  if (result.rows[0].status !== 'SUBMITTED') throw new AppErr('Only submitted marks can be rejected', 400);

  await pool.query(
    `UPDATE marks SET status = 'REJECTED', rejection_reason = $1, approved_by = $2, updated_at = NOW()
     WHERE mark_id = $3`,
    [reason, hodUserId, markId]
  );

  await pool.query(
    `INSERT INTO mark_approvals (mark_id, reviewed_by, action, reason) VALUES ($1, $2, 'REJECT', $3)`,
    [markId, hodUserId, reason]
  );
}

// ─── Get Marks ────────────────────────────────────────────────────────────────

export async function getMarks(query: Record<string, unknown>, userRole: string, userId: string) {
  const { page, limit, offset } = parsePagination(query);
  const conditions: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  if (query.examId) { conditions.push(`m.exam_id = $${i++}`); params.push(query.examId); }
  if (query.subjectId) { conditions.push(`m.subject_id = $${i++}`); params.push(query.subjectId); }
  if (query.status) { conditions.push(`m.status = $${i++}`); params.push(query.status); }
  if (query.studentId) { conditions.push(`m.student_id = $${i++}`); params.push(query.studentId); }

  // STAFF: only see marks for assigned subjects
  if (userRole === 'STAFF') {
    conditions.push(`sa.staff_id = (SELECT staff_id FROM staff WHERE user_id = $${i++})`);
    params.push(userId);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const joinClause = userRole === 'STAFF'
    ? `JOIN staff_assignments sa ON m.subject_id = sa.subject_id AND sa.is_active = true`
    : '';

  const [rows, countResult] = await Promise.all([
    pool.query(
      `SELECT m.mark_id, m.marks_obtained, m.maximum_marks, m.grade, m.result, m.status,
              m.is_absent, m.version, m.submitted_at, m.approved_at,
              s.register_number, s.name AS student_name,
              sub.subject_code, sub.subject_name,
              e.exam_name
       FROM marks m
       JOIN students s ON m.student_id = s.student_id
       JOIN subjects sub ON m.subject_id = sub.subject_id
       JOIN exams e ON m.exam_id = e.exam_id
       ${joinClause}
       ${where}
       ORDER BY s.register_number
       LIMIT $${i++} OFFSET $${i++}`,
      [...params, limit, offset]
    ),
    pool.query(`SELECT COUNT(*) FROM marks m ${joinClause} ${where}`, params),
  ]);

  return { marks: rows.rows, total: parseInt(countResult.rows[0].count), page, limit };
}

export async function getMarkHistory(markId: string) {
  const result = await pool.query(
    `SELECT mv.version_number, mv.old_marks, mv.new_marks, mv.old_status, mv.new_status,
            mv.change_reason, mv.changed_at,
            u.username AS changed_by
     FROM mark_versions mv
     JOIN users u ON mv.changed_by = u.user_id
     WHERE mv.mark_id = $1
     ORDER BY mv.version_number DESC`,
    [markId]
  );
  return result.rows;
}

export async function getPendingApprovals(query: Record<string, unknown>) {
  const { page, limit, offset } = parsePagination(query);

  const [rows, countResult] = await Promise.all([
    pool.query(
      `SELECT m.mark_id, m.marks_obtained, m.maximum_marks, m.grade, m.result,
              m.submitted_at, m.version,
              s.register_number, s.name AS student_name,
              sub.subject_code, sub.subject_name,
              e.exam_name,
              u.username AS submitted_by_username
       FROM marks m
       JOIN students s ON m.student_id = s.student_id
       JOIN subjects sub ON m.subject_id = sub.subject_id
       JOIN exams e ON m.exam_id = e.exam_id
       JOIN users u ON m.submitted_by = u.user_id
       WHERE m.status = 'SUBMITTED'
       ORDER BY m.submitted_at ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
    pool.query(`SELECT COUNT(*) FROM marks WHERE status = 'SUBMITTED'`),
  ]);

  return { marks: rows.rows, total: parseInt(countResult.rows[0].count), page, limit };
}

import pool from '../config/database';
import { hashPassword } from './authService';
import { fieldEncrypt, fieldDecrypt, maskPhone } from '../utils/crypto';
import { parsePagination } from '../utils/pagination';
import { AppErr } from '../middleware/errorHandler';

export interface CreateStudentInput {
  registerNumber: string;
  name: string;
  email?: string;
  programme: string;
  departmentId?: string;
  batch: string;
  admissionYear: number;
  currentYear: number;
  currentSemester: number;
  sectionId?: string;
  parentName?: string;
  parentWhatsapp?: string;
  dob?: string;
  gender?: string;
  phone?: string;
  address?: string;
}

export async function createStudent(input: CreateStudentInput, createdByUserId: string) {
  const existing = await pool.query(
    'SELECT student_id FROM students WHERE register_number = $1',
    [input.registerNumber]
  );
  if (existing.rows.length > 0) {
    throw new AppErr(`Register number ${input.registerNumber} already exists`, 409);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const username = input.registerNumber.toLowerCase();
    const defaultPassword = await hashPassword('123'); // Default password 123 as requested

    const userResult = await client.query(
      `INSERT INTO users (email, username, password_hash, role)
       VALUES ($1, $2, $3, 'STUDENT')
       RETURNING user_id`,
      [input.email || null, username, defaultPassword]
    );
    const userId = userResult.rows[0].user_id;

    const encryptedWhatsapp = input.parentWhatsapp
      ? fieldEncrypt(input.parentWhatsapp)
      : null;

    const studentResult = await client.query(
      `INSERT INTO students (user_id, register_number, name, email, programme, department_id,
         batch, admission_year, current_year, current_semester, section_id, parent_name,
         parent_whatsapp_encrypted, dob, gender, phone, address, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING student_id, register_number, name`,
      [
        userId, input.registerNumber, input.name, input.email || null,
        input.programme, input.departmentId || null, input.batch,
        input.admissionYear, input.currentYear, input.currentSemester,
        input.sectionId || null, input.parentName || null,
        encryptedWhatsapp, input.dob || null, input.gender || null,
        input.phone || null, input.address || null, createdByUserId,
      ]
    );

    await client.query('COMMIT');
    return { ...studentResult.rows[0], username, temporaryPassword: '123' };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getStudents(query: Record<string, unknown>) {
  const { page, limit, offset } = parsePagination(query);
  const conditions: string[] = ['s.account_status != \'ARCHIVED\''];
  const params: unknown[] = [];
  let i = 1;

  if (query.search) {
    conditions.push(`(LOWER(s.name) LIKE $${i} OR LOWER(s.register_number) LIKE $${i})`);
    params.push(`%${String(query.search).toLowerCase()}%`);
    i++;
  }
  if (query.currentYear) {
    conditions.push(`s.current_year = $${i++}`);
    params.push(Number(query.currentYear));
  }
  if (query.currentSemester) {
    conditions.push(`s.current_semester = $${i++}`);
    params.push(Number(query.currentSemester));
  }
  if (query.sectionId) {
    conditions.push(`s.section_id = $${i++}`);
    params.push(query.sectionId);
  }
  if (query.batch) {
    conditions.push(`s.batch = $${i++}`);
    params.push(query.batch);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;

  const [rows, countResult] = await Promise.all([
    pool.query(
      `SELECT s.student_id, s.register_number, s.name, s.email, s.programme, s.batch,
              s.current_year, s.current_semester, s.account_status, s.parent_name,
              s.phone, s.gender, s.created_at,
              sec.name AS section_name
       FROM students s
       LEFT JOIN sections sec ON s.section_id = sec.section_id
       ${where}
       ORDER BY s.register_number ASC
       LIMIT $${i++} OFFSET $${i++}`,
      [...params, limit, offset]
    ),
    pool.query(`SELECT COUNT(*) FROM students s ${where}`, params),
  ]);

  return { students: rows.rows, total: parseInt(countResult.rows[0].count), page, limit };
}

export async function getStudentById(studentId: string) {
  const result = await pool.query(
    `SELECT s.student_id, s.register_number, s.name, s.email, s.programme, s.batch,
            s.admission_year, s.current_year, s.current_semester, s.account_status,
            s.parent_name, s.phone, s.gender, s.dob, s.address, s.photo_url, s.created_at,
            s.parent_whatsapp_encrypted,
            sec.name AS section_name, sec.section_id,
            d.name AS department_name
     FROM students s
     LEFT JOIN sections sec ON s.section_id = sec.section_id
     LEFT JOIN departments d ON s.department_id = d.department_id
     WHERE s.student_id = $1`,
    [studentId]
  );

  if (result.rows.length === 0) throw new AppErr('Student not found', 404);

  const student = result.rows[0];

  if (student.parent_whatsapp_encrypted) {
    const decrypted = fieldDecrypt(Buffer.from(student.parent_whatsapp_encrypted));
    student.parent_whatsapp_masked = maskPhone(decrypted);
  } else {
    student.parent_whatsapp_masked = null;
  }

  delete student.parent_whatsapp_encrypted;
  return student;
}

export async function updateStudent(studentId: string, input: Partial<CreateStudentInput>) {
  const updates: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  const fieldMap: Record<string, string> = {
    name: 'name', email: 'email', programme: 'programme', batch: 'batch',
    currentYear: 'current_year', currentSemester: 'current_semester',
    sectionId: 'section_id', parentName: 'parent_name',
    dob: 'dob', gender: 'gender', phone: 'phone', address: 'address',
  };

  for (const [key, col] of Object.entries(fieldMap)) {
    if (input[key as keyof CreateStudentInput] !== undefined) {
      updates.push(`${col} = $${i++}`);
      params.push(input[key as keyof CreateStudentInput]);
    }
  }

  if (input.parentWhatsapp !== undefined) {
    updates.push(`parent_whatsapp_encrypted = $${i++}`);
    params.push(input.parentWhatsapp ? fieldEncrypt(input.parentWhatsapp) : null);
  }

  if (updates.length === 0) throw new AppErr('No fields to update', 400);

  updates.push(`updated_at = NOW()`);
  params.push(studentId);

  await pool.query(
    `UPDATE students SET ${updates.join(', ')} WHERE student_id = $${i}`,
    params
  );
}

export async function softDeleteStudent(studentId: string) {
  // Soft delete student and deactivate user account
  const student = await pool.query('SELECT user_id FROM students WHERE student_id = $1', [studentId]);
  if (student.rows[0]?.user_id) {
    await pool.query("UPDATE users SET account_status = 'INACTIVE' WHERE user_id = $1", [student.rows[0].user_id]);
  }
  await pool.query(
    `UPDATE students SET account_status = 'ARCHIVED', updated_at = NOW() WHERE student_id = $1`,
    [studentId]
  );
}

export async function enrollStudentInSubjects(
  studentId: string,
  subjectIds: string[],
  academicYearId: string,
  semesterId?: string
) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const subjectId of subjectIds) {
      await client.query(
        `INSERT INTO student_subjects (student_id, subject_id, academic_year_id, semester_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (student_id, subject_id, academic_year_id) DO NOTHING`,
        [studentId, subjectId, academicYearId, semesterId || null]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getStudentSubjects(studentId: string, academicYearId?: string) {
  const conditions = ['ss.student_id = $1', 'ss.status = \'ENROLLED\''];
  const params: unknown[] = [studentId];
  let i = 2;

  if (academicYearId) {
    conditions.push(`ss.academic_year_id = $${i++}`);
    params.push(academicYearId);
  }

  const result = await pool.query(
    `SELECT sub.subject_id, sub.subject_code, sub.subject_name, sub.subject_type,
            sub.credits, sub.semester_number, sub.maximum_marks, sub.passing_marks,
            ay.label AS academic_year
     FROM student_subjects ss
     JOIN subjects sub ON ss.subject_id = sub.subject_id
     JOIN academic_years ay ON ss.academic_year_id = ay.academic_year_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY sub.semester_number, sub.subject_code`,
    params
  );
  return result.rows;
}

export async function getStudentMarks(studentId: string, academicYearId?: string, examId?: string) {
  const conditions = ['m.student_id = $1', 'm.status = \'APPROVED\''];
  const params: unknown[] = [studentId];
  let i = 2;

  if (academicYearId) {
    conditions.push(`sub.academic_year_id = $${i++}`);
    params.push(academicYearId);
  }
  if (examId) {
    conditions.push(`m.exam_id = $${i++}`);
    params.push(examId);
  }

  const result = await pool.query(
    `SELECT m.mark_id, m.marks_obtained, m.maximum_marks, m.grade, m.result, m.is_absent,
            sub.subject_code, sub.subject_name, sub.subject_type, sub.credits, sub.semester_number,
            e.exam_name, e.exam_date,
            ay.label AS academic_year
     FROM marks m
     JOIN subjects sub ON m.subject_id = sub.subject_id
     JOIN exams e ON m.exam_id = e.exam_id
     JOIN academic_years ay ON sub.academic_year_id = ay.academic_year_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY sub.semester_number, sub.subject_code`,
    params
  );
  return result.rows;
}

export async function getStudentAttendanceSummary(studentId: string, academicYearId?: string) {
  const conditions = ['a.student_id = $1'];
  const params: unknown[] = [studentId];
  let i = 2;

  if (academicYearId) {
    conditions.push(`a.academic_year_id = $${i++}`);
    params.push(academicYearId);
  }

  const result = await pool.query(
    `SELECT sub.subject_code, sub.subject_name, sub.semester_number,
            COUNT(*) AS total_classes,
            COUNT(*) FILTER (WHERE a.status = 'PRESENT') AS present,
            COUNT(*) FILTER (WHERE a.status = 'ABSENT') AS absent,
            COUNT(*) FILTER (WHERE a.status = 'LATE') AS late,
            ROUND(
              COUNT(*) FILTER (WHERE a.status IN ('PRESENT', 'LATE')) * 100.0 / NULLIF(COUNT(*), 0), 2
            ) AS attendance_percentage
     FROM attendance a
     JOIN subjects sub ON a.subject_id = sub.subject_id
     WHERE ${conditions.join(' AND ')}
     GROUP BY sub.subject_id, sub.subject_code, sub.subject_name, sub.semester_number
     ORDER BY sub.semester_number, sub.subject_code`,
    params
  );
  return result.rows;
}

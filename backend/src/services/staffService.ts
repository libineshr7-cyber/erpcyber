import pool from '../config/database';
import { hashPassword } from './authService';
import { parsePagination } from '../utils/pagination';
import { AppErr } from '../middleware/errorHandler';

export interface CreateStaffInput {
  employeeId: string;
  name: string;
  email: string;
  designation?: string;
  departmentId?: string;
  phone?: string;
  isClassAdvisor?: boolean;
}

export async function createStaff(input: CreateStaffInput, createdByUserId: string) {
  const existing = await pool.query(
    'SELECT staff_id FROM staff WHERE employee_id = $1',
    [input.employeeId]
  );
  if (existing.rows.length > 0) throw new AppErr('Employee ID already exists', 409);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const username = input.employeeId.toLowerCase();
    const defaultPassword = await hashPassword('123'); // Default password 123 as requested

    const userResult = await client.query(
      `INSERT INTO users (email, username, password_hash, role)
       VALUES ($1, $2, $3, 'STAFF')
       RETURNING user_id`,
      [input.email, username, defaultPassword]
    );
    const userId = userResult.rows[0].user_id;

    const staffResult = await client.query(
      `INSERT INTO staff (user_id, employee_id, name, designation, department_id, phone, is_class_advisor)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING staff_id, employee_id, name`,
      [userId, input.employeeId, input.name, input.designation || null,
       input.departmentId || null, input.phone || null, input.isClassAdvisor || false]
    );

    await client.query('COMMIT');
    return { ...staffResult.rows[0], username, temporaryPassword: '123' };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateStaff(staffId: string, input: Partial<CreateStaffInput>) {
  const staff = await pool.query('SELECT user_id FROM staff WHERE staff_id = $1', [staffId]);
  if (staff.rows.length === 0) throw new AppErr('Staff member not found', 404);

  const userId = staff.rows[0].user_id;

  if (input.employeeId || input.name || input.designation) {
    await pool.query(
      `UPDATE staff
       SET employee_id = COALESCE($1, employee_id),
           name = COALESCE($2, name),
           designation = COALESCE($3, designation),
           updated_at = NOW()
       WHERE staff_id = $4`,
      [input.employeeId, input.name, input.designation, staffId]
    );
  }

  if (input.email || input.employeeId) {
    await pool.query(
      `UPDATE users
       SET email = COALESCE($1, email),
           username = COALESCE($2, username),
           updated_at = NOW()
       WHERE user_id = $3`,
      [input.email, input.employeeId ? input.employeeId.toLowerCase() : null, userId]
    );
  }

  return getStaffById(staffId);
}

export async function deleteStaff(staffId: string) {
  const staff = await pool.query('SELECT user_id FROM staff WHERE staff_id = $1', [staffId]);
  if (staff.rows[0]?.user_id) {
    await pool.query("UPDATE users SET account_status = 'INACTIVE' WHERE user_id = $1", [staff.rows[0].user_id]);
  }
  await pool.query("UPDATE staff SET account_status = 'ARCHIVED', updated_at = NOW() WHERE staff_id = $1", [staffId]);
}

export async function getStaff(query: Record<string, unknown>) {
  const { page, limit, offset } = parsePagination(query);
  const conditions: string[] = ['s.account_status = \'ACTIVE\''];
  const params: unknown[] = [];
  let i = 1;

  if (query.search) {
    conditions.push(`(LOWER(s.name) LIKE $${i} OR LOWER(s.employee_id) LIKE $${i})`);
    params.push(`%${String(query.search).toLowerCase()}%`);
    i++;
  }

  const where = `WHERE ${conditions.join(' AND ')}`;

  const [rows, countResult] = await Promise.all([
    pool.query(
      `SELECT s.staff_id, s.employee_id, s.name, s.designation, s.phone,
              s.is_class_advisor, s.account_status, s.created_at,
              u.email, u.username, u.mfa_enabled,
              d.name AS department_name
       FROM staff s
       JOIN users u ON s.user_id = u.user_id
       LEFT JOIN departments d ON s.department_id = d.department_id
       ${where}
       ORDER BY s.name ASC
       LIMIT $${i++} OFFSET $${i++}`,
      [...params, limit, offset]
    ),
    pool.query(`SELECT COUNT(*) FROM staff s ${where}`, params),
  ]);

  return { staff: rows.rows, total: parseInt(countResult.rows[0].count), page, limit };
}

export async function getStaffById(staffId: string) {
  const result = await pool.query(
    `SELECT s.staff_id, s.employee_id, s.name, s.designation, s.phone,
            s.is_class_advisor, s.account_status, s.created_at,
            u.email, u.username, u.mfa_enabled,
            d.name AS department_name
     FROM staff s
     JOIN users u ON s.user_id = u.user_id
     LEFT JOIN departments d ON s.department_id = d.department_id
     WHERE s.staff_id = $1`,
    [staffId]
  );
  if (result.rows.length === 0) throw new AppErr('Staff member not found', 404);
  return result.rows[0];
}

export async function getStaffAssignments(staffId: string) {
  const result = await pool.query(
    `SELECT sa.assignment_id, sa.is_active,
            sub.subject_id, sub.subject_code, sub.subject_name, sub.semester_number,
            sec.section_id, sec.name AS section_name,
            ay.label AS academic_year, ay.academic_year_id,
            sem.semester_number AS semester
     FROM staff_assignments sa
     JOIN subjects sub ON sa.subject_id = sub.subject_id
     LEFT JOIN sections sec ON sa.section_id = sec.section_id
     JOIN academic_years ay ON sa.academic_year_id = ay.academic_year_id
     JOIN semesters sem ON sa.semester_id = sem.semester_id
     WHERE sa.staff_id = $1 AND sa.is_active = true
     ORDER BY ay.label DESC, sem.semester_number`,
    [staffId]
  );
  return result.rows;
}

export async function assignSubjectsToStaff(
  staffId: string,
  assignments: Array<{ subjectId: string; sectionId?: string; academicYearId: string; semesterId: string }>
) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const a of assignments) {
      await client.query(
        `INSERT INTO staff_assignments (staff_id, subject_id, section_id, academic_year_id, semester_id)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [staffId, a.subjectId, a.sectionId || null, a.academicYearId, a.semesterId]
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

export async function removeStaffAssignment(assignmentId: string) {
  await pool.query(
    'UPDATE staff_assignments SET is_active = false WHERE assignment_id = $1',
    [assignmentId]
  );
}

export async function isStaffAssignedToSubject(userIdOrStaffId: string, subjectId: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1 FROM staff_assignments sa
     JOIN staff s ON sa.staff_id = s.staff_id
     WHERE (s.staff_id = $1 OR s.user_id = $1) AND sa.subject_id = $2 AND sa.is_active = true
     LIMIT 1`,
    [userIdOrStaffId, subjectId]
  );
  return result.rows.length > 0;
}

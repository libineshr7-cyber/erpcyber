import pool from '../config/database';
import { AppErr } from '../middleware/errorHandler';
import { parsePagination } from '../utils/pagination';

// ─── Academic Years ───────────────────────────────────────────────────────────

export async function getAcademicYears() {
  const result = await pool.query('SELECT * FROM academic_years ORDER BY start_date DESC');
  return result.rows;
}

export async function createAcademicYear(input: { label: string; startDate: string; endDate: string }, createdBy: string) {
  const existing = await pool.query('SELECT academic_year_id FROM academic_years WHERE label = $1', [input.label]);
  if (existing.rows.length > 0) throw new AppErr(`Academic year ${input.label} already exists`, 409);

  const result = await pool.query(
    `INSERT INTO academic_years (label, start_date, end_date, created_by) VALUES ($1,$2,$3,$4) RETURNING *`,
    [input.label, input.startDate, input.endDate, createdBy]
  );
  return result.rows[0];
}

export async function setCurrentAcademicYear(academicYearId: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE academic_years SET is_current = false');
    await client.query('UPDATE academic_years SET is_current = true WHERE academic_year_id = $1', [academicYearId]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─── Semesters ────────────────────────────────────────────────────────────────

export async function getSemesters(academicYearId?: string) {
  const result = await pool.query(
    `SELECT s.*, ay.label AS academic_year_label
     FROM semesters s
     JOIN academic_years ay ON s.academic_year_id = ay.academic_year_id
     ${academicYearId ? 'WHERE s.academic_year_id = $1' : ''}
     ORDER BY ay.start_date DESC, s.semester_number`,
    academicYearId ? [academicYearId] : []
  );
  return result.rows;
}

export async function createSemester(input: { academicYearId: string; semesterNumber: number; yearOfStudy: number; startDate?: string; endDate?: string }) {
  const result = await pool.query(
    `INSERT INTO semesters (academic_year_id, semester_number, year_of_study, start_date, end_date)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (academic_year_id, semester_number) DO NOTHING
     RETURNING *`,
    [input.academicYearId, input.semesterNumber, input.yearOfStudy, input.startDate || null, input.endDate || null]
  );
  return result.rows[0];
}

// ─── Sections ─────────────────────────────────────────────────────────────────

export async function getSections(query: { academicYearId?: string; semesterId?: string; yearOfStudy?: number }) {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  if (query.academicYearId) { conditions.push(`sec.academic_year_id = $${i++}`); params.push(query.academicYearId); }
  if (query.semesterId) { conditions.push(`sec.semester_id = $${i++}`); params.push(query.semesterId); }
  if (query.yearOfStudy) { conditions.push(`sec.year_of_study = $${i++}`); params.push(query.yearOfStudy); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await pool.query(
    `SELECT sec.*, ay.label AS academic_year_label
     FROM sections sec
     JOIN academic_years ay ON sec.academic_year_id = ay.academic_year_id
     ${where}
     ORDER BY sec.year_of_study, sec.name`,
    params
  );
  return result.rows;
}

export async function createSection(input: { academicYearId: string; semesterId: string; name: string; yearOfStudy: number; departmentId?: string }) {
  const result = await pool.query(
    `INSERT INTO sections (academic_year_id, semester_id, name, year_of_study, department_id)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (academic_year_id, semester_id, name, year_of_study) DO NOTHING
     RETURNING *`,
    [input.academicYearId, input.semesterId, input.name, input.yearOfStudy, input.departmentId || null]
  );
  return result.rows[0];
}

// ─── Subjects ─────────────────────────────────────────────────────────────────

export async function getSubjects(query: Record<string, unknown>) {
  const { page, limit, offset } = parsePagination(query);
  const conditions: string[] = ['sub.status != \'ARCHIVED\''];
  const params: unknown[] = [];
  let i = 1;

  if (query.academicYearId) { conditions.push(`sub.academic_year_id = $${i++}`); params.push(query.academicYearId); }
  if (query.semesterNumber) { conditions.push(`sub.semester_number = $${i++}`); params.push(Number(query.semesterNumber)); }
  if (query.yearOfStudy) { conditions.push(`sub.year_of_study = $${i++}`); params.push(Number(query.yearOfStudy)); }
  if (query.search) {
    conditions.push(`(LOWER(sub.subject_name) LIKE $${i} OR LOWER(sub.subject_code) LIKE $${i})`);
    params.push(`%${String(query.search).toLowerCase()}%`);
    i++;
  }

  const where = `WHERE ${conditions.join(' AND ')}`;

  const [rows, countResult] = await Promise.all([
    pool.query(
      `SELECT sub.*, ay.label AS academic_year_label
       FROM subjects sub
       JOIN academic_years ay ON sub.academic_year_id = ay.academic_year_id
       ${where}
       ORDER BY sub.semester_number, sub.subject_code
       LIMIT $${i++} OFFSET $${i++}`,
      [...params, limit, offset]
    ),
    pool.query(`SELECT COUNT(*) FROM subjects sub ${where}`, params),
  ]);

  return { subjects: rows.rows, total: parseInt(countResult.rows[0].count), page, limit };
}

export async function createSubject(input: {
  subjectCode: string; subjectName: string; subjectType?: string;
  credits: number; semesterNumber: number; yearOfStudy: number;
  departmentId?: string; academicYearId: string;
  maximumMarks: number; passingMarks: number;
}, createdBy: string) {
  const result = await pool.query(
    `INSERT INTO subjects (subject_code, subject_name, subject_type, credits, semester_number, year_of_study, department_id, academic_year_id, maximum_marks, passing_marks, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [
      input.subjectCode, input.subjectName, input.subjectType || 'THEORY',
      input.credits, input.semesterNumber, input.yearOfStudy,
      input.departmentId || null, input.academicYearId,
      input.maximumMarks, input.passingMarks, createdBy,
    ]
  );
  return result.rows[0];
}

export async function updateSubject(subjectId: string, input: Partial<Parameters<typeof createSubject>[0]>) {
  const fieldMap: Record<string, string> = {
    subjectName: 'subject_name', subjectType: 'subject_type',
    credits: 'credits', maximumMarks: 'maximum_marks', passingMarks: 'passing_marks',
  };

  const updates: string[] = ['updated_at = NOW()'];
  const params: unknown[] = [];
  let i = 1;

  for (const [key, col] of Object.entries(fieldMap)) {
    if (input[key as keyof typeof input] !== undefined) {
      updates.push(`${col} = $${i++}`);
      params.push(input[key as keyof typeof input]);
    }
  }

  params.push(subjectId);
  await pool.query(`UPDATE subjects SET ${updates.join(', ')} WHERE subject_id = $${i}`, params);
}

// ─── Exams ────────────────────────────────────────────────────────────────────

export async function getExams(query: Record<string, unknown>) {
  const conditions: string[] = ['e.status != \'CANCELLED\''];
  const params: unknown[] = [];
  let i = 1;

  if (query.academicYearId) { conditions.push(`e.academic_year_id = $${i++}`); params.push(query.academicYearId); }
  if (query.semesterId) { conditions.push(`e.semester_id = $${i++}`); params.push(query.semesterId); }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const result = await pool.query(
    `SELECT e.*, ay.label AS academic_year_label
     FROM exams e
     JOIN academic_years ay ON e.academic_year_id = ay.academic_year_id
     ${where}
     ORDER BY e.exam_date DESC NULLS LAST`,
    params
  );
  return result.rows;
}

export async function createExam(input: {
  examName: string; examCode?: string; academicYearId: string; semesterId?: string;
  departmentId?: string; examDate?: string; maximumMarks: number; passingMarks: number;
}, createdBy: string) {
  const result = await pool.query(
    `INSERT INTO exams (exam_name, exam_code, academic_year_id, semester_id, department_id, exam_date, maximum_marks, passing_marks, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      input.examName, input.examCode || null, input.academicYearId,
      input.semesterId || null, input.departmentId || null,
      input.examDate || null, input.maximumMarks, input.passingMarks, createdBy,
    ]
  );
  return result.rows[0];
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export async function enterAttendance(entries: Array<{
  studentId: string; subjectId: string; academicYearId: string;
  semesterId?: string; date: string; status: string; session?: string; remarks?: string;
}>, enteredByUserId: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const entry of entries) {
      await client.query(
        `INSERT INTO attendance (student_id, subject_id, academic_year_id, semester_id, date, status, session, remarks, entered_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (student_id, subject_id, date, session) DO UPDATE SET
           status = EXCLUDED.status, remarks = EXCLUDED.remarks, updated_at = NOW()`,
        [
          entry.studentId, entry.subjectId, entry.academicYearId,
          entry.semesterId || null, entry.date, entry.status,
          entry.session || 'FULL_DAY', entry.remarks || null, enteredByUserId,
        ]
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

// ─── Events ───────────────────────────────────────────────────────────────────

export async function getEvents(filter: 'upcoming' | 'past' | 'all' = 'all') {
  let dateFilter = '';
  if (filter === 'upcoming') dateFilter = 'AND e.event_date >= CURRENT_DATE';
  if (filter === 'past') dateFilter = 'AND e.event_date < CURRENT_DATE';

  const result = await pool.query(
    `SELECT e.*, u.username AS created_by_username
     FROM events e
     JOIN users u ON e.created_by = u.user_id
     WHERE e.status = 'PUBLISHED' ${dateFilter}
     ORDER BY e.event_date ${filter === 'past' ? 'DESC' : 'ASC'}`
  );
  return result.rows;
}

export async function createEvent(input: {
  title: string; description?: string; eventType?: string; eventDate: string;
  eventTime?: string; venue?: string; registrationLink?: string;
  posterPath?: string; departmentId?: string;
}, createdBy: string) {
  const result = await pool.query(
    `INSERT INTO events (title, description, event_type, event_date, event_time, venue, registration_link, poster_path, department_id, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      input.title, input.description || null, input.eventType || null,
      input.eventDate, input.eventTime || null, input.venue || null,
      input.registrationLink || null, input.posterPath || null,
      input.departmentId || null, createdBy,
    ]
  );
  return result.rows[0];
}

export async function publishEvent(eventId: string) {
  await pool.query(`UPDATE events SET status = 'PUBLISHED', updated_at = NOW() WHERE event_id = $1`, [eventId]);
}

export async function archiveEvent(eventId: string) {
  await pool.query(`UPDATE events SET status = 'CANCELLED', updated_at = NOW() WHERE event_id = $1`, [eventId]);
}

// ─── Announcements ────────────────────────────────────────────────────────────

export async function getAnnouncements() {
  const result = await pool.query(
    `SELECT a.*, u.username AS created_by_username
     FROM announcements a
     JOIN users u ON a.created_by = u.user_id
     WHERE a.status = 'PUBLISHED' AND (a.expires_at IS NULL OR a.expires_at > NOW())
     ORDER BY a.pinned DESC, a.created_at DESC`
  );
  return result.rows;
}

export async function createAnnouncement(input: {
  title: string; content: string; category?: string;
  departmentId?: string; pinned?: boolean; expiresAt?: string;
}, createdBy: string) {
  const result = await pool.query(
    `INSERT INTO announcements (title, content, category, department_id, pinned, expires_at, status, published_at, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,'PUBLISHED',NOW(),$7)
     RETURNING *`,
    [
      input.title, input.content, input.category || null,
      input.departmentId || null, input.pinned || false,
      input.expiresAt || null, createdBy,
    ]
  );
  return result.rows[0];
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export async function getAuditLogs(query: Record<string, unknown>) {
  const { page, limit, offset } = parsePagination(query);
  const conditions: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  if (query.action) { conditions.push(`al.action = $${i++}`); params.push(query.action); }
  if (query.userId) { conditions.push(`al.user_id = $${i++}`); params.push(query.userId); }
  if (query.role) { conditions.push(`al.role = $${i++}`); params.push(query.role); }
  if (query.from) { conditions.push(`al.created_at >= $${i++}`); params.push(query.from); }
  if (query.to) { conditions.push(`al.created_at <= $${i++}`); params.push(query.to); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows, countResult] = await Promise.all([
    pool.query(
      `SELECT al.* FROM audit_logs al ${where} ORDER BY al.created_at DESC LIMIT $${i++} OFFSET $${i++}`,
      [...params, limit, offset]
    ),
    pool.query(`SELECT COUNT(*) FROM audit_logs al ${where}`, params),
  ]);

  return { logs: rows.rows, total: parseInt(countResult.rows[0].count), page, limit };
}

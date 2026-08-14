import pool from '../config/database';
import { hashPassword } from '../services/authService';
import { fieldEncrypt } from '../utils/crypto';
import logger from '../utils/logger';

async function seed(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    logger.info('🌱 Starting database seed...');

    // ── Department ─────────────────────────────────────────────────────────
    const deptResult = await client.query(`
      INSERT INTO departments (name, short_name)
      VALUES ('Department of Computer Science and Engineering', 'CS')
      ON CONFLICT DO NOTHING
      RETURNING department_id
    `);
    let deptId = deptResult.rows[0]?.department_id;
    if (!deptId) {
      const existing = await client.query('SELECT department_id FROM departments LIMIT 1');
      deptId = existing.rows[0]?.department_id;
    }
    logger.info(`Department: ${deptId}`);

    // ── Users ─────────────────────────────────────────────────────────────
    const hodHash = await hashPassword('HodTest@2025!');
    const staffAHash = await hashPassword('StaffA@2025!');
    const staffBHash = await hashPassword('StaffB@2025!');
    const studentAHash = await hashPassword('StudentA@2025!');
    const studentBHash = await hashPassword('StudentB@2025!');

    const hodUser = await client.query(`
      INSERT INTO users (email, username, password_hash, role)
      VALUES ('hod@erp.local', 'hod_test', $1, 'HOD')
      ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING user_id
    `, [hodHash]);
    const hodUserId = hodUser.rows[0].user_id;

    const staffAUser = await client.query(`
      INSERT INTO users (email, username, password_hash, role)
      VALUES ('staff_a@erp.local', 'staff_test_a', $1, 'STAFF')
      ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING user_id
    `, [staffAHash]);
    const staffAUserId = staffAUser.rows[0].user_id;

    const staffBUser = await client.query(`
      INSERT INTO users (email, username, password_hash, role)
      VALUES ('staff_b@erp.local', 'staff_test_b', $1, 'STAFF')
      ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING user_id
    `, [staffBHash]);
    const staffBUserId = staffBUser.rows[0].user_id;

    const studentAUser = await client.query(`
      INSERT INTO users (email, username, password_hash, role)
      VALUES ('26cs001@erp.local', 'student_26cs001', $1, 'STUDENT')
      ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING user_id
    `, [studentAHash]);
    const studentAUserId = studentAUser.rows[0].user_id;

    const studentBUser = await client.query(`
      INSERT INTO users (email, username, password_hash, role)
      VALUES ('26cs002@erp.local', 'student_26cs002', $1, 'STUDENT')
      ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING user_id
    `, [studentBHash]);
    const studentBUserId = studentBUser.rows[0].user_id;

    logger.info('Users created');

    // ── Staff ─────────────────────────────────────────────────────────────
    const staffA = await client.query(`
      INSERT INTO staff (user_id, employee_id, name, designation, department_id)
      VALUES ($1, 'STAFF001', 'Dr. Priya Sharma', 'Assistant Professor', $2)
      ON CONFLICT (employee_id) DO UPDATE SET name = EXCLUDED.name
      RETURNING staff_id
    `, [staffAUserId, deptId]);
    const staffAId = staffA.rows[0].staff_id;

    const staffB = await client.query(`
      INSERT INTO staff (user_id, employee_id, name, designation, department_id)
      VALUES ($1, 'STAFF002', 'Prof. Rahul Kumar', 'Associate Professor', $2)
      ON CONFLICT (employee_id) DO UPDATE SET name = EXCLUDED.name
      RETURNING staff_id
    `, [staffBUserId, deptId]);
    const staffBId = staffB.rows[0].staff_id;

    logger.info('Staff created');

    // ── Academic Year ─────────────────────────────────────────────────────
    const ayResult = await client.query(`
      INSERT INTO academic_years (label, start_date, end_date, is_current, created_by)
      VALUES ('2025-2026', '2025-06-01', '2026-05-31', true, $1)
      ON CONFLICT (label) DO UPDATE SET is_current = true
      RETURNING academic_year_id
    `, [hodUserId]);
    const ayId = ayResult.rows[0].academic_year_id;

    // ── Semesters ─────────────────────────────────────────────────────────
    for (let sem = 1; sem <= 8; sem++) {
      const year = Math.ceil(sem / 2);
      await client.query(`
        INSERT INTO semesters (academic_year_id, semester_number, year_of_study, status)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (academic_year_id, semester_number) DO NOTHING
      `, [ayId, sem, year, sem === 1 ? 'ACTIVE' : 'UPCOMING']);
    }

    const semResult = await client.query(
      'SELECT semester_id FROM semesters WHERE academic_year_id = $1 AND semester_number = 1',
      [ayId]
    );
    const sem1Id = semResult.rows[0].semester_id;

    logger.info('Academic year and semesters created');

    // ── Sections ─────────────────────────────────────────────────────────
    const secResult = await client.query(`
      INSERT INTO sections (academic_year_id, semester_id, name, year_of_study, department_id)
      VALUES ($1, $2, 'A', 1, $3)
      ON CONFLICT (academic_year_id, semester_id, name, year_of_study) DO NOTHING
      RETURNING section_id
    `, [ayId, sem1Id, deptId]);
    let sectionId = secResult.rows[0]?.section_id;
    if (!sectionId) {
      const existing = await client.query(
        'SELECT section_id FROM sections WHERE academic_year_id = $1 AND name = $2',
        [ayId, 'A']
      );
      sectionId = existing.rows[0]?.section_id;
    }

    await client.query(`
      INSERT INTO sections (academic_year_id, semester_id, name, year_of_study, department_id)
      VALUES ($1, $2, 'B', 1, $3)
      ON CONFLICT (academic_year_id, semester_id, name, year_of_study) DO NOTHING
    `, [ayId, sem1Id, deptId]);

    logger.info('Sections created');

    // ── Students ─────────────────────────────────────────────────────────
    const parentPhone = '+919876543210';
    const encryptedPhone = fieldEncrypt(parentPhone);

    const studentA = await client.query(`
      INSERT INTO students (user_id, register_number, name, programme, department_id, batch, admission_year, current_year, current_semester, section_id, parent_name, parent_whatsapp_encrypted, gender, created_by)
      VALUES ($1, '26CS001', 'Arun Kumar', 'B.E. Computer Science', $2, '2026-2030', 2026, 1, 1, $3, 'Mr. Suresh Kumar', $4, 'Male', $5)
      ON CONFLICT (register_number) DO UPDATE SET name = EXCLUDED.name
      RETURNING student_id
    `, [studentAUserId, deptId, sectionId, encryptedPhone, hodUserId]);
    const studentAId = studentA.rows[0].student_id;

    const parentPhoneB = '+919876543211';
    const encryptedPhoneB = fieldEncrypt(parentPhoneB);

    const studentB = await client.query(`
      INSERT INTO students (user_id, register_number, name, programme, department_id, batch, admission_year, current_year, current_semester, section_id, parent_name, parent_whatsapp_encrypted, gender, created_by)
      VALUES ($1, '26CS002', 'Priya Sharma', 'B.E. Computer Science', $2, '2026-2030', 2026, 1, 1, $3, 'Mrs. Anita Sharma', $4, 'Female', $5)
      ON CONFLICT (register_number) DO UPDATE SET name = EXCLUDED.name
      RETURNING student_id
    `, [studentBUserId, deptId, sectionId, encryptedPhoneB, hodUserId]);
    const studentBId = studentB.rows[0].student_id;

    logger.info('Students created');

    // ── Subjects (6 subjects, different max marks) ────────────────────────
    const subjectData = [
      { code: 'CS101', name: 'Engineering Mathematics', type: 'THEORY', credits: 4, maxMarks: 100, passingMarks: 50 },
      { code: 'CS102', name: 'Programming in C', type: 'THEORY', credits: 3, maxMarks: 100, passingMarks: 50 },
      { code: 'CS103', name: 'Programming Lab', type: 'PRACTICAL', credits: 2, maxMarks: 50, passingMarks: 25 },
      { code: 'CS104', name: 'Digital Electronics', type: 'THEORY', credits: 3, maxMarks: 100, passingMarks: 50 },
      { code: 'CS105', name: 'English Communication', type: 'THEORY', credits: 2, maxMarks: 50, passingMarks: 25 },
      { code: 'CS106', name: 'Network Fundamentals', type: 'THEORY', credits: 3, maxMarks: 100, passingMarks: 50 },
    ];

    const subjectIds: string[] = [];
    for (const sub of subjectData) {
      const res = await client.query(`
        INSERT INTO subjects (subject_code, subject_name, subject_type, credits, semester_number, year_of_study, department_id, academic_year_id, maximum_marks, passing_marks, created_by)
        VALUES ($1,$2,$3,$4,1,1,$5,$6,$7,$8,$9)
        ON CONFLICT (subject_code) DO UPDATE SET subject_name = EXCLUDED.subject_name
        RETURNING subject_id
      `, [sub.code, sub.name, sub.type, sub.credits, deptId, ayId, sub.maxMarks, sub.passingMarks, hodUserId]);
      subjectIds.push(res.rows[0].subject_id);
    }

    logger.info('Subjects created');

    // ── Student-Subject Enrollment ─────────────────────────────────────────
    // Student A: all 6 subjects
    for (const subId of subjectIds) {
      await client.query(`
        INSERT INTO student_subjects (student_id, subject_id, academic_year_id, semester_id)
        VALUES ($1,$2,$3,$4)
        ON CONFLICT (student_id, subject_id, academic_year_id) DO NOTHING
      `, [studentAId, subId, ayId, sem1Id]);
    }

    // Student B: only 5 subjects (to demonstrate dynamic subject counts)
    for (const subId of subjectIds.slice(0, 5)) {
      await client.query(`
        INSERT INTO student_subjects (student_id, subject_id, academic_year_id, semester_id)
        VALUES ($1,$2,$3,$4)
        ON CONFLICT (student_id, subject_id, academic_year_id) DO NOTHING
      `, [studentBId, subId, ayId, sem1Id]);
    }

    logger.info('Student-subject enrollments created (Student A: 6 subjects, Student B: 5 subjects)');

    // ── Staff Assignments ─────────────────────────────────────────────────
    for (const subId of subjectIds.slice(0, 3)) {
      await client.query(`
        INSERT INTO staff_assignments (staff_id, subject_id, section_id, academic_year_id, semester_id)
        VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT DO NOTHING
      `, [staffAId, subId, sectionId, ayId, sem1Id]);
    }

    for (const subId of subjectIds.slice(3)) {
      await client.query(`
        INSERT INTO staff_assignments (staff_id, subject_id, section_id, academic_year_id, semester_id)
        VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT DO NOTHING
      `, [staffBId, subId, sectionId, ayId, sem1Id]);
    }

    logger.info('Staff assignments created');

    // ── Exams ─────────────────────────────────────────────────────────────
    const examData = [
      { name: 'IAT-1', code: 'IAT1', maxMarks: 50, passingMarks: 25, date: '2025-08-15' },
      { name: 'IAT-2', code: 'IAT2', maxMarks: 50, passingMarks: 25, date: '2025-09-20' },
      { name: 'Semester Examination', code: 'SEM1', maxMarks: 100, passingMarks: 50, date: '2025-11-15' },
    ];

    const examIds: string[] = [];
    for (const ex of examData) {
      const res = await client.query(`
        INSERT INTO exams (exam_name, exam_code, academic_year_id, semester_id, department_id, exam_date, maximum_marks, passing_marks, status, created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'COMPLETED',$9)
        ON CONFLICT DO NOTHING
        RETURNING exam_id
      `, [ex.name, ex.code, ayId, sem1Id, deptId, ex.date, ex.maxMarks, ex.passingMarks, hodUserId]);
      if (res.rows[0]) examIds.push(res.rows[0].exam_id);
    }

    if (examIds.length > 0) {
      logger.info('Exams created');

      // ── Sample Marks (IAT-1) ───────────────────────────────────────────
      const iat1Id = examIds[0];
      const sampleMarks = [
        { studentId: studentAId, marks: [42, 38, 47, 88, 42, 85] }, // Student A - all 6
        { studentId: studentBId, marks: [39, 41, 45, 82, 39] },     // Student B - only 5
      ];

      for (const sm of sampleMarks) {
        for (let i = 0; i < sm.marks.length; i++) {
          const subId = subjectIds[i];
          const subject = subjectData[i];
          const maxMarks = subject.maxMarks === 100 ? 50 : subject.maxMarks; // IAT is out of 50 max
          const marks = Math.min(sm.marks[i], maxMarks);
          const percentage = (marks / maxMarks) * 100;
          const grade = percentage >= 90 ? 'O' : percentage >= 80 ? 'A+' : percentage >= 70 ? 'A' :
            percentage >= 60 ? 'B+' : percentage >= 50 ? 'B' : percentage >= 40 ? 'C' : 'F';
          const result = percentage >= 50 ? 'PASS' : 'FAIL';

          await client.query(`
            INSERT INTO marks (student_id, subject_id, exam_id, marks_obtained, maximum_marks, grade, result, status, submitted_by, submitted_at, approved_by, approved_at, created_by)
            VALUES ($1,$2,$3,$4,$5,$6,$7,'APPROVED',$8,NOW(),$9,NOW(),$8)
            ON CONFLICT (student_id, subject_id, exam_id) DO NOTHING
          `, [sm.studentId, subId, iat1Id, marks, maxMarks, grade, result, staffAId || hodUserId, hodUserId]);
        }
      }

      logger.info('Sample marks created (status: APPROVED)');

      // ── Sample Attendance ─────────────────────────────────────────────
      const dates = ['2025-08-01', '2025-08-04', '2025-08-05', '2025-08-06', '2025-08-07', '2025-08-08'];
      for (const date of dates) {
        for (const subId of subjectIds.slice(0, 3)) {
          await client.query(`
            INSERT INTO attendance (student_id, subject_id, academic_year_id, semester_id, date, status, entered_by)
            VALUES ($1,$2,$3,$4,$5,'PRESENT',$6)
            ON CONFLICT (student_id, subject_id, date, session) DO NOTHING
          `, [studentAId, subId, ayId, sem1Id, date, staffAId || hodUserId]);

          await client.query(`
            INSERT INTO attendance (student_id, subject_id, academic_year_id, semester_id, date, status, entered_by)
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            ON CONFLICT (student_id, subject_id, date, session) DO NOTHING
          `, [studentBId, subId, ayId, sem1Id, date, date === '2025-08-06' ? 'ABSENT' : 'PRESENT', staffAId || hodUserId]);
        }
      }

      logger.info('Sample attendance created');
    }

    // ── Events ────────────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO events (title, description, event_type, event_date, event_time, venue, status, department_id, created_by)
      VALUES
        ('Cybersecurity Workshop 2025', 'A hands-on workshop on ethical hacking and penetration testing.', 'WORKSHOP', '2025-09-15', '10:00:00', 'Seminar Hall A', 'PUBLISHED', $1, $2),
        ('National Hackathon 2025', 'Annual hackathon for all CS students. Cash prizes for top 3 teams.', 'HACKATHON', '2025-10-05', '09:00:00', 'Main Auditorium', 'PUBLISHED', $1, $2)
      ON CONFLICT DO NOTHING
    `, [deptId, hodUserId]);

    // ── Announcements ─────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO announcements (title, content, category, pinned, status, published_at, department_id, created_by)
      VALUES
        ('IAT-1 Results Published', 'IAT-1 marks have been approved and are available in your student portal.', 'EXAM', true, 'PUBLISHED', NOW(), $1, $2),
        ('Attendance Warning', 'Students with attendance below 75% in any subject will not be permitted to write the semester examination.', 'ACADEMIC', false, 'PUBLISHED', NOW(), $1, $2)
      ON CONFLICT DO NOTHING
    `, [deptId, hodUserId]);

    logger.info('Events and announcements created');

    await client.query('COMMIT');

    logger.info('✅ Seed completed successfully!');
    logger.info('');
    logger.info('Test Accounts:');
    logger.info('  HOD:      username=hod_test        password=HodTest@2025!');
    logger.info('  Staff A:  username=staff_test_a     password=StaffA@2025!');
    logger.info('  Staff B:  username=staff_test_b     password=StaffB@2025!');
    logger.info('  Student A: username=student_26cs001 password=StudentA@2025! (26CS001 — 6 subjects)');
    logger.info('  Student B: username=student_26cs002 password=StudentB@2025! (26CS002 — 5 subjects)');

  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('❌ Seed failed', { error: err });
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);

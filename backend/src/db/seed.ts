import pool from '../config/database';
import { hashPassword } from '../services/authService';
import { fieldEncrypt } from '../utils/crypto';
import logger from '../utils/logger';

async function seed(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    logger.info('🌱 Starting database seed with CS2001-CS2049, CS3001-CS3048, ST001-ST007...');

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

    // Default password '123' for all accounts as requested
    const defaultPasswordHash = await hashPassword('123');

    // ── HOD Account ───────────────────────────────────────────────────────
    const hodUser = await client.query(`
      INSERT INTO users (email, username, password_hash, role)
      VALUES ('hod@erp.local', 'hod_test', $1, 'HOD')
      ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING user_id
    `, [defaultPasswordHash]);
    const hodUserId = hodUser.rows[0].user_id;

    // ── Academic Year & Semesters ──────────────────────────────────────────
    const ayResult = await client.query(`
      INSERT INTO academic_years (label, start_date, end_date, is_current, created_by)
      VALUES ('2025-2026', '2025-06-01', '2026-05-31', true, $1)
      ON CONFLICT (label) DO UPDATE SET is_current = true
      RETURNING academic_year_id
    `, [hodUserId]);
    const ayId = ayResult.rows[0].academic_year_id;

    for (let sem = 1; sem <= 8; sem++) {
      const year = Math.ceil(sem / 2);
      await client.query(`
        INSERT INTO semesters (academic_year_id, semester_number, year_of_study, status)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (academic_year_id, semester_number) DO NOTHING
      `, [ayId, sem, year, 'ACTIVE']);
    }

    const sem3Result = await client.query('SELECT semester_id FROM semesters WHERE academic_year_id = $1 AND semester_number = 3', [ayId]);
    const sem5Result = await client.query('SELECT semester_id FROM semesters WHERE academic_year_id = $1 AND semester_number = 5', [ayId]);
    const sem3Id = sem3Result.rows[0]?.semester_id;
    const sem5Id = sem5Result.rows[0]?.semester_id;

    // ── Sections ─────────────────────────────────────────────────────────
    const secResult = await client.query(`
      INSERT INTO sections (academic_year_id, semester_id, name, year_of_study, department_id)
      VALUES ($1, $2, 'A', 2, $3)
      ON CONFLICT (academic_year_id, semester_id, name, year_of_study) DO NOTHING
      RETURNING section_id
    `, [ayId, sem3Id, deptId]);
    let sectionId = secResult.rows[0]?.section_id;
    if (!sectionId) {
      const existing = await client.query('SELECT section_id FROM sections WHERE academic_year_id = $1 LIMIT 1', [ayId]);
      sectionId = existing.rows[0]?.section_id;
    }

    // ── Staff Members (ST001 to ST007) ────────────────────────────────────
    const staffNames = [
      'Dr. Priya Sharma', 'Prof. Rahul Kumar', 'Dr. Anand V',
      'Prof. Sunita R', 'Dr. Rajesh Kannan', 'Prof. Meenakshi S', 'Dr. Vikramaditya M'
    ];

    const staffIds: string[] = [];
    for (let i = 1; i <= 7; i++) {
      const empId = `ST00${i}`;
      const username = empId.toLowerCase();
      const email = `${username}@erp.local`;
      const name = staffNames[i - 1];

      const uRes = await client.query(`
        INSERT INTO users (email, username, password_hash, role)
        VALUES ($1, $2, $3, 'STAFF')
        ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash
        RETURNING user_id
      `, [email, username, defaultPasswordHash]);

      const sRes = await client.query(`
        INSERT INTO staff (user_id, employee_id, name, designation, department_id)
        VALUES ($1, $2, $3, 'Assistant Professor', $4)
        ON CONFLICT (employee_id) DO UPDATE SET name = EXCLUDED.name
        RETURNING staff_id
      `, [uRes.rows[0].user_id, empId, name, deptId]);

      staffIds.push(sRes.rows[0].staff_id);
    }
    logger.info('✅ Created Staff ST001 - ST007 (Password: 123)');

    // ── 2nd Year Students (CS2001 to CS2049) ──────────────────────────────
    const sampleParentPhone = fieldEncrypt('+919876543210');

    for (let i = 1; i <= 49; i++) {
      const numStr = i < 10 ? `0${i}` : `${i}`;
      const regNo = `CS20${numStr}`;
      const username = regNo.toLowerCase();
      const email = `${username}@erp.local`;
      const name = `Student ${regNo}`;

      const uRes = await client.query(`
        INSERT INTO users (email, username, password_hash, role)
        VALUES ($1, $2, $3, 'STUDENT')
        ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash
        RETURNING user_id
      `, [email, username, defaultPasswordHash]);

      await client.query(`
        INSERT INTO students (user_id, register_number, name, programme, department_id, batch, admission_year, current_year, current_semester, section_id, parent_name, parent_whatsapp_encrypted, gender, created_by)
        VALUES ($1, $2, $3, 'B.E. Cybersecurity', $4, '2024-2028', 2024, 2, 3, $5, 'Parent of ' || $2, $6, $7, $8)
        ON CONFLICT (register_number) DO UPDATE SET name = EXCLUDED.name
      `, [uRes.rows[0].user_id, regNo, name, deptId, sectionId, sampleParentPhone, i % 2 === 0 ? 'Female' : 'Male', hodUserId]);
    }
    logger.info('✅ Created 2nd Year Students CS2001 - CS2049 (Password: 123)');

    // ── 3rd Year Students (CS3001 to CS3048) ──────────────────────────────
    for (let i = 1; i <= 48; i++) {
      const numStr = i < 10 ? `0${i}` : `${i}`;
      const regNo = `CS30${numStr}`;
      const username = regNo.toLowerCase();
      const email = `${username}@erp.local`;
      const name = `Student ${regNo}`;

      const uRes = await client.query(`
        INSERT INTO users (email, username, password_hash, role)
        VALUES ($1, $2, $3, 'STUDENT')
        ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash
        RETURNING user_id
      `, [email, username, defaultPasswordHash]);

      await client.query(`
        INSERT INTO students (user_id, register_number, name, programme, department_id, batch, admission_year, current_year, current_semester, section_id, parent_name, parent_whatsapp_encrypted, gender, created_by)
        VALUES ($1, $2, $3, 'B.E. Cybersecurity', $4, '2023-2027', 2023, 3, 5, $5, 'Parent of ' || $2, $6, $7, $8)
        ON CONFLICT (register_number) DO UPDATE SET name = EXCLUDED.name
      `, [uRes.rows[0].user_id, regNo, name, deptId, sectionId, sampleParentPhone, i % 2 === 0 ? 'Female' : 'Male', hodUserId]);
    }
    logger.info('✅ Created 3rd Year Students CS3001 - CS3048 (Password: 123)');

    // Also include staff_test_a, staff_test_b, student_26cs001 for backward compatibility
    await client.query(`
      INSERT INTO users (email, username, password_hash, role)
      VALUES ('staff_a@erp.local', 'staff_test_a', $1, 'STAFF')
      ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash
    `, [defaultPasswordHash]);

    await client.query('COMMIT');

    logger.info('🎉 Database seed completed successfully!');
    logger.info('🔑 All accounts default password: 123');

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

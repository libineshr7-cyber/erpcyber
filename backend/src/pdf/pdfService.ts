import { PDFDocument, StandardFonts, rgb, degrees, PDFPage, PDFFont } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { config } from '../config/env';
import { AppErr } from '../middleware/errorHandler';
import { fieldDecrypt } from '../utils/crypto';
import logger from '../utils/logger';

if (!fs.existsSync(config.pdf.outputDir)) {
  fs.mkdirSync(config.pdf.outputDir, { recursive: true });
}

interface StudentReportData {
  studentName: string;
  registerNumber: string;
  programme: string;
  year: number;
  semester: number;
  section: string;
  academicYear: string;
  examName: string;
  examDate: string;
  reportDate: string;
  reportId: string;
  collegeName: string;
  collegeAddress: string;
  departmentName: string;
  watermarkText: string;
  subjects: Array<{
    code: string;
    name: string;
    maxMarks: number;
    marksObtained: number | null;
    grade: string;
    result: string;
    isAbsent: boolean;
  }>;
  attendance: Array<{
    subjectName: string;
    percentage: number;
  }>;
}

function drawText(page: PDFPage, text: string, x: number, y: number, font: PDFFont, size: number, colorVal = 0): void {
  page.drawText(String(text || ''), {
    x, y, size, font,
    color: rgb(colorVal, colorVal, colorVal),
  });
}

export async function generateStudentReport(studentId: string, examId: string, generatedByUserId: string): Promise<{
  reportId: string;
  filePath: string;
}> {
  const [studentResult, examResult] = await Promise.all([
    pool.query(
      `SELECT s.register_number, s.name, s.programme, s.current_year, s.current_semester,
              sec.name AS section_name,
              ay.label AS academic_year,
              d.name AS department_name
       FROM students s
       LEFT JOIN sections sec ON s.section_id = sec.section_id
       LEFT JOIN departments d ON s.department_id = d.department_id
       LEFT JOIN academic_years ay ON ay.is_current = true
       WHERE s.student_id = $1`,
      [studentId]
    ),
    pool.query('SELECT exam_name, exam_date FROM exams WHERE exam_id = $1', [examId]),
  ]);

  if (studentResult.rows.length === 0) throw new AppErr('Student not found', 404);
  if (examResult.rows.length === 0) throw new AppErr('Exam not found', 404);

  const student = studentResult.rows[0];
  const exam = examResult.rows[0];

  const marksResult = await pool.query(
    `SELECT sub.subject_code, sub.subject_name, sub.maximum_marks,
            m.marks_obtained, m.grade, m.result, m.is_absent
     FROM marks m
     JOIN subjects sub ON m.subject_id = sub.subject_id
     WHERE m.student_id = $1 AND m.exam_id = $2 AND m.status = 'APPROVED'
     ORDER BY sub.subject_code`,
    [studentId, examId]
  );

  const attendanceResult = await pool.query(
    `SELECT sub.subject_name,
            ROUND(COUNT(*) FILTER (WHERE a.status IN ('PRESENT','LATE')) * 100.0 / NULLIF(COUNT(*),0), 1) AS percentage
     FROM attendance a
     JOIN subjects sub ON a.subject_id = sub.subject_id
     WHERE a.student_id = $1
     GROUP BY sub.subject_id, sub.subject_name
     ORDER BY sub.subject_name`,
    [studentId]
  );

  const reportId = uuidv4();
  const reportData: StudentReportData = {
    studentName: student.name,
    registerNumber: student.register_number,
    programme: student.programme || 'Cybersecurity',
    year: student.current_year,
    semester: student.current_semester,
    section: student.section_name || 'A',
    academicYear: student.academic_year || '2025-2026',
    examName: exam.exam_name,
    examDate: exam.exam_date ? new Date(exam.exam_date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
    reportDate: new Date().toLocaleDateString('en-IN'),
    reportId,
    collegeName: 'PRATHYUSHA ENGINEERING COLLEGE',
    collegeAddress: '(An Autonomous Institution)',
    departmentName: 'PERFORMANCE REVIEW OF STUDENTS (PROS)',
    watermarkText: config.pdf.watermarkText,
    subjects: marksResult.rows.map(r => ({
      code: r.subject_code,
      name: r.subject_name,
      maxMarks: r.maximum_marks,
      marksObtained: r.marks_obtained,
      grade: r.grade,
      result: r.result,
      isAbsent: r.is_absent,
    })),
    attendance: attendanceResult.rows.map(r => ({
      subjectName: r.subject_name,
      percentage: r.percentage || 0,
    })),
  };

  const pdfBytes = await buildPdf(reportData);

  const filename = `${reportId}.pdf`;
  const filePath = path.join(config.pdf.outputDir, filename);
  fs.writeFileSync(filePath, pdfBytes);

  await pool.query(
    `INSERT INTO reports (report_id, student_id, exam_id, academic_year_id, file_path, file_size_bytes, status, generated_by, watermark_text)
     SELECT $1, $2, $3,
            (SELECT academic_year_id FROM academic_years WHERE is_current = true LIMIT 1),
            $4, $5, 'READY', $6, $7`,
    [reportId, studentId, examId, filePath, pdfBytes.length, generatedByUserId, config.pdf.watermarkText]
  );

  logger.info('PDF report generated with PROS template', { reportId, studentId, examId });

  return { reportId, filePath };
}

async function buildPdf(data: StudentReportData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 Standard

  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const { width, height } = page.getSize();
  const margin = 40;
  const contentWidth = width - 2 * margin;
  let y = height - margin;

  // ── Header — PRATHYUSHA ENGINEERING COLLEGE ─────────────────────────────
  const mainHeader = 'PRATHYUSHA ENGINEERING COLLEGE';
  const mainHeaderWidth = boldFont.widthOfTextAtSize(mainHeader, 16);
  drawText(page, mainHeader, (width - mainHeaderWidth) / 2, y, boldFont, 16);
  y -= 16;

  const subHeader = '(An Autonomous Institution)';
  const subHeaderWidth = regularFont.widthOfTextAtSize(subHeader, 10);
  drawText(page, subHeader, (width - subHeaderWidth) / 2, y, regularFont, 10);
  y -= 18;

  const prosTitle = 'PERFORMANCE REVIEW OF STUDENTS (PROS)';
  const prosTitleWidth = boldFont.widthOfTextAtSize(prosTitle, 12);
  drawText(page, prosTitle, (width - prosTitleWidth) / 2, y, boldFont, 12);
  y -= 18;

  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
  const monthHeader = `For the Month of [ ${currentMonth} ] — Academic Year [ ${data.academicYear} ]`;
  const monthHeaderWidth = boldFont.widthOfTextAtSize(monthHeader, 10);
  drawText(page, monthHeader, (width - monthHeaderWidth) / 2, y, boldFont, 10);
  y -= 25;

  // ── Student Info Grid (Matching Template Border Box) ─────────────────────
  const infoBoxHeight = 55;
  page.drawRectangle({
    x: margin,
    y: y - infoBoxHeight,
    width: contentWidth,
    height: infoBoxHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  // Vertical dividers inside Student Info Grid
  const colDivider1 = margin + 280;
  page.drawLine({ start: { x: colDivider1, y }, end: { x: colDivider1, y: y - infoBoxHeight }, thickness: 1, color: rgb(0,0,0) });
  page.drawLine({ start: { x: margin, y: y - 27.5 }, end: { x: width - margin, y: y - 27.5 }, thickness: 1, color: rgb(0,0,0) });

  // Row 1: Student Name
  drawText(page, 'Student Name', margin + 8, y - 18, boldFont, 9);
  drawText(page, `[ ${data.studentName} ]`, margin + 95, y - 18, regularFont, 9);

  // Row 2: Reg. No. / Section & Branch
  drawText(page, 'Reg. No. / Section', margin + 8, y - 45, boldFont, 9);
  drawText(page, `[ ${data.registerNumber} / ${data.section} ]`, margin + 110, y - 45, regularFont, 9);

  drawText(page, 'Branch', colDivider1 + 8, y - 45, boldFont, 9);
  drawText(page, `[ ${data.programme} ]`, colDivider1 + 60, y - 45, regularFont, 9);

  y = y - infoBoxHeight - 20;

  // ── Academic Performance Table Header ──────────────────────────────────────
  const tableX = margin;
  const colWidths = [35, 80, 215, 75, 55, 55]; // Sum = 515
  const colPositions = [tableX];
  for (let i = 0; i < colWidths.length - 1; i++) {
    colPositions.push(colPositions[i] + colWidths[i]);
  }

  // Header Box
  const tableTitleHeight = 22;
  page.drawRectangle({
    x: tableX,
    y: y - tableTitleHeight,
    width: contentWidth,
    height: tableTitleHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });
  const sectionTitle = 'ACADEMIC PERFORMANCE';
  const secTitleWidth = boldFont.widthOfTextAtSize(sectionTitle, 11);
  drawText(page, sectionTitle, (width - secTitleWidth) / 2, y - 16, boldFont, 11);
  y -= tableTitleHeight;

  // Table Column Headers
  const tableHeaderHeight = 30;
  page.drawRectangle({
    x: tableX,
    y: y - tableHeaderHeight,
    width: contentWidth,
    height: tableHeaderHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  const headers = ['S. No', 'Subject Code', 'Subject Name', 'Marks\n(Out of 100)', 'Grade', 'Pass/ Fail\n(P/F)'];

  for (let i = 0; i < headers.length; i++) {
    const xPos = colPositions[i] + 4;
    if (i > 0) {
      page.drawLine({ start: { x: colPositions[i], y }, end: { x: colPositions[i], y: y - tableHeaderHeight }, thickness: 1, color: rgb(0,0,0) });
    }
    const lines = headers[i].split('\n');
    if (lines.length > 1) {
      drawText(page, lines[0], xPos, y - 12, boldFont, 8);
      drawText(page, lines[1], xPos, y - 22, boldFont, 8);
    } else {
      drawText(page, headers[i], xPos, y - 18, boldFont, 8);
    }
  }
  y -= tableHeaderHeight;

  // Table Rows (6 rows matching PDF template grid)
  const rowCount = Math.max(6, data.subjects.length);
  const rowHeight = 25;

  for (let r = 0; r < rowCount; r++) {
    const sub = data.subjects[r];
    page.drawRectangle({
      x: tableX,
      y: y - rowHeight,
      width: contentWidth,
      height: rowHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    for (let c = 1; c < colPositions.length; c++) {
      page.drawLine({ start: { x: colPositions[c], y }, end: { x: colPositions[c], y: y - rowHeight }, thickness: 1, color: rgb(0,0,0) });
    }

    if (sub) {
      const marksStr = sub.isAbsent ? 'AB' : (sub.marksObtained !== null ? String(sub.marksObtained) : '-');
      const passFail = sub.result === 'PASS' ? 'P' : (sub.result === 'FAIL' ? 'F' : 'P');

      drawText(page, String(r + 1), colPositions[0] + 12, y - 16, regularFont, 8);
      drawText(page, `[ ${sub.code} ]`, colPositions[1] + 4, y - 16, regularFont, 8);
      drawText(page, `[ ${sub.name} ]`, colPositions[2] + 4, y - 16, regularFont, 8);
      drawText(page, `[ ${marksStr} ]`, colPositions[3] + 15, y - 16, regularFont, 8);
      drawText(page, `[ ${sub.grade} ]`, colPositions[4] + 15, y - 16, regularFont, 8);
      drawText(page, `[ ${passFail} ]`, colPositions[5] + 18, y - 16, boldFont, 8, passFail === 'F' ? 0.8 : 0);
    } else {
      drawText(page, String(r + 1), colPositions[0] + 12, y - 16, regularFont, 8);
      drawText(page, '[ ]', colPositions[1] + 4, y - 16, regularFont, 8);
      drawText(page, '[ ]', colPositions[2] + 4, y - 16, regularFont, 8);
      drawText(page, '[ ]', colPositions[3] + 15, y - 16, regularFont, 8);
      drawText(page, '[ ]', colPositions[4] + 15, y - 16, regularFont, 8);
      drawText(page, '[ ]', colPositions[5] + 18, y - 16, regularFont, 8);
    }

    y -= rowHeight;
  }

  // ── Attendance % & Remarks Grid ──────────────────────────────────────────
  const attRowHeight = 25;
  page.drawRectangle({
    x: tableX,
    y: y - attRowHeight,
    width: contentWidth,
    height: attRowHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  const avgAttendance = data.attendance.length > 0
    ? Math.round(data.attendance.reduce((acc, curr) => acc + curr.percentage, 0) / data.attendance.length)
    : 85;

  drawText(page, `Attendance % As on [ ${data.reportDate} ]:`, tableX + 8, y - 16, boldFont, 8.5);
  drawText(page, `[ ${avgAttendance}% ]`, tableX + 220, y - 16, boldFont, 8.5, avgAttendance < 75 ? 0.8 : 0);

  y -= attRowHeight;

  const remarksRowHeight = 35;
  page.drawRectangle({
    x: tableX,
    y: y - remarksRowHeight,
    width: contentWidth,
    height: remarksRowHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  drawText(page, 'Remarks on\nAttendance', tableX + 8, y - 14, boldFont, 8);
  page.drawLine({ start: { x: tableX + 110, y }, end: { x: tableX + 110, y: y - remarksRowHeight }, thickness: 1, color: rgb(0,0,0) });
  const remarksText = avgAttendance >= 75 ? '[ Good attendance record. Keep up the consistent performance. ]' : '[ WARNING: Low attendance. Minimum 75% required for exam eligibility. ]';
  drawText(page, remarksText, tableX + 118, y - 20, regularFont, 8);

  y -= remarksRowHeight + 20;

  // ── Notes Section (Exact template matching) ──────────────────────────────
  const note1 = 'Note on attendance: Students secured less than 75% of attendance will not be permitted to appear current semester exams and detained for next semester.';
  drawText(page, note1, margin, y, boldFont, 7.5);
  y -= 18;

  const note2 = 'Note: No digital note is circulated to the students for exam preparation. Kindly advice your ward to keep mobile phones away while studying and preparing for exams.';
  drawText(page, note2, margin, y, regularFont, 7.5);

  const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
  return pdfBytes;
}

export async function getReportById(reportId: string) {
  const result = await pool.query(
    'SELECT * FROM reports WHERE report_id = $1',
    [reportId]
  );
  return result.rows[0] || null;
}

export async function authorizeReportDownload(reportId: string, userId: string, userRole: string, studentId?: string): Promise<string> {
  const report = await getReportById(reportId);
  if (!report) throw new AppErr('Report not found', 404);

  if (userRole === 'STUDENT') {
    if (report.student_id !== studentId) throw new AppErr('Access denied', 403);
  }

  await pool.query(
    'INSERT INTO report_access_log (report_id, accessed_by) VALUES ($1, $2)',
    [reportId, userId]
  );

  return report.file_path;
}

export async function getStudentParentPhone(studentId: string): Promise<string | null> {
  const result = await pool.query(
    'SELECT parent_whatsapp_encrypted FROM students WHERE student_id = $1',
    [studentId]
  );
  if (!result.rows[0]?.parent_whatsapp_encrypted) return null;
  return fieldDecrypt(Buffer.from(result.rows[0].parent_whatsapp_encrypted));
}

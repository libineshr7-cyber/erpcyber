import { PDFDocument, StandardFonts, rgb, degrees, PDFPage, PDFFont } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { config } from '../config/env';
import { AppErr } from '../middleware/errorHandler';
import { fieldDecrypt } from '../utils/crypto';
import logger from '../utils/logger';

// Ensure output directory exists
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
  page.drawText(String(text), {
    x, y, size, font,
    color: rgb(colorVal, colorVal, colorVal),
  });
}

export async function generateStudentReport(studentId: string, examId: string, generatedByUserId: string): Promise<{
  reportId: string;
  filePath: string;
}> {
  // Fetch student + exam data
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

  // Fetch approved marks for this student+exam
  const marksResult = await pool.query(
    `SELECT sub.subject_code, sub.subject_name, sub.maximum_marks,
            m.marks_obtained, m.grade, m.result, m.is_absent
     FROM marks m
     JOIN subjects sub ON m.subject_id = sub.subject_id
     WHERE m.student_id = $1 AND m.exam_id = $2 AND m.status = 'APPROVED'
     ORDER BY sub.subject_code`,
    [studentId, examId]
  );

  // Fetch attendance summary
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
    programme: student.programme,
    year: student.current_year,
    semester: student.current_semester,
    section: student.section_name || 'N/A',
    academicYear: student.academic_year || 'N/A',
    examName: exam.exam_name,
    examDate: exam.exam_date ? new Date(exam.exam_date).toLocaleDateString('en-IN') : 'N/A',
    reportDate: new Date().toLocaleDateString('en-IN'),
    reportId,
    collegeName: config.department.collegeName,
    collegeAddress: config.department.collegeAddress,
    departmentName: student.department_name || config.department.name,
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

  // Store in DB
  await pool.query(
    `INSERT INTO reports (report_id, student_id, exam_id, academic_year_id, file_path, file_size_bytes, status, generated_by, watermark_text)
     SELECT $1, $2, $3,
            (SELECT academic_year_id FROM academic_years WHERE is_current = true LIMIT 1),
            $4, $5, 'READY', $6, $7`,
    [reportId, studentId, examId, filePath, pdfBytes.length, generatedByUserId, config.pdf.watermarkText]
  );

  logger.info('PDF report generated', { reportId, studentId, examId });

  return { reportId, filePath };
}

async function buildPdf(data: StudentReportData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4

  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const { width, height } = page.getSize();
  const margin = 40;
  let y = height - margin;

  // ── College Header ─────────────────────────────────────────────────────────
  drawText(page, data.collegeName.toUpperCase(), margin, y, boldFont, 14);
  y -= 18;
  drawText(page, data.collegeAddress, margin, y, regularFont, 9);
  y -= 14;
  drawText(page, data.departmentName, margin, y, regularFont, 9);
  y -= 20;

  // Header line
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1.5, color: rgb(0, 0, 0) });
  y -= 16;

  // ── Report Title ───────────────────────────────────────────────────────────
  const title = 'ACADEMIC PERFORMANCE REPORT';
  const titleWidth = boldFont.widthOfTextAtSize(title, 13);
  drawText(page, title, (width - titleWidth) / 2, y, boldFont, 13);
  y -= 20;

  const subtitle = data.examName;
  const subtitleWidth = regularFont.widthOfTextAtSize(subtitle, 11);
  drawText(page, subtitle, (width - subtitleWidth) / 2, y, regularFont, 11);
  y -= 22;

  // ── Student Info Table ─────────────────────────────────────────────────────
  page.drawRectangle({ x: margin, y: y - 66, width: width - 2 * margin, height: 72, borderColor: rgb(0, 0, 0), borderWidth: 0.75 });

  const col2 = margin + 200;
  const rowH = 16;
  const infoRows = [
    ['Name:', data.studentName, 'Academic Year:', data.academicYear],
    ['Register Number:', data.registerNumber, 'Exam Date:', data.examDate],
    ['Programme:', data.programme, 'Report Date:', data.reportDate],
    ['Year / Semester:', `Year ${data.year} / Semester ${data.semester}`, 'Section:', data.section],
  ];

  let infoY = y - 12;
  for (const row of infoRows) {
    drawText(page, row[0], margin + 4, infoY, boldFont, 8);
    drawText(page, row[1], margin + 70, infoY, regularFont, 8);
    drawText(page, row[2], col2, infoY, boldFont, 8);
    drawText(page, row[3], col2 + 80, infoY, regularFont, 8);
    infoY -= rowH;
  }

  y = y - 72 - 14;

  // ── Marks Table ────────────────────────────────────────────────────────────
  drawText(page, 'MARKS DETAILS', margin, y, boldFont, 10);
  y -= 14;

  const colWidths = [30, 60, 200, 60, 70, 45, 50];
  const colX = [margin];
  for (let i = 0; i < colWidths.length - 1; i++) colX.push(colX[i] + colWidths[i]);

  const headers = ['S.No', 'Code', 'Subject Name', 'Max Marks', 'Marks Obtained', 'Grade', 'Result'];

  // Header row
  page.drawRectangle({ x: margin, y: y - 14, width: width - 2 * margin, height: 16, color: rgb(0.85, 0.85, 0.85), borderColor: rgb(0,0,0), borderWidth: 0.5 });
  for (let i = 0; i < headers.length; i++) {
    drawText(page, headers[i], colX[i] + 2, y - 11, boldFont, 7.5);
  }
  y -= 14;

  // Data rows
  for (let idx = 0; idx < data.subjects.length; idx++) {
    const sub = data.subjects[idx];
    const rowColor = idx % 2 === 0 ? rgb(1, 1, 1) : rgb(0.97, 0.97, 0.97);
    page.drawRectangle({ x: margin, y: y - 13, width: width - 2 * margin, height: 15, color: rowColor, borderColor: rgb(0.8,0.8,0.8), borderWidth: 0.3 });

    const marks = sub.isAbsent ? 'AB' : (sub.marksObtained !== null ? String(sub.marksObtained) : '-');
    const cells = [String(idx + 1), sub.code, sub.name, String(sub.maxMarks), marks, sub.grade, sub.result];

    for (let i = 0; i < cells.length; i++) {
      const textColor = sub.result === 'FAIL' && i === 6 ? 0.8 : 0;
      drawText(page, cells[i], colX[i] + 2, y - 10, i === 2 ? regularFont : regularFont, 7.5, textColor);
    }
    y -= 15;
  }

  // Table bottom border
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.75, color: rgb(0,0,0) });
  y -= 18;

  // ── Attendance Summary ─────────────────────────────────────────────────────
  if (data.attendance.length > 0) {
    drawText(page, 'ATTENDANCE SUMMARY', margin, y, boldFont, 10);
    y -= 14;

    for (const att of data.attendance) {
      const pct = att.percentage;
      const color = pct >= 75 ? 0 : 0.6;
      drawText(page, `${att.subjectName}: ${pct}%`, margin + 4, y, regularFont, 8, color);
      y -= 12;
    }
    y -= 6;
  }

  // ── Watermark ─────────────────────────────────────────────────────────────
  page.drawText(data.watermarkText, {
    x: 80,
    y: height / 2,
    size: 40,
    font: boldFont,
    color: rgb(0.9, 0.9, 0.9),
    rotate: degrees(45),
    opacity: 0.15,
  });

  // ── Footer ─────────────────────────────────────────────────────────────────
  y = margin + 30;
  page.drawLine({ start: { x: margin, y: y + 10 }, end: { x: width - margin, y: y + 10 }, thickness: 0.5, color: rgb(0.5,0.5,0.5) });
  drawText(page, `Report ID: ${data.reportId}`, margin, y, regularFont, 7, 0.5);
  drawText(page, `Generated: ${data.reportDate} | ${data.collegeName}`, margin, y - 10, regularFont, 7, 0.5);
  drawText(page, 'OFFICIAL DOCUMENT — DO NOT TAMPER', width - 220, y, regularFont, 7, 0.5);

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
  if (report.status !== 'READY') throw new AppErr('Report is not ready', 400);

  if (userRole === 'STUDENT') {
    if (report.student_id !== studentId) throw new AppErr('Access denied', 403);
  }

  // Log access
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

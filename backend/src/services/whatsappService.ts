import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { config } from '../config/env';
import { getStudentParentPhone } from '../pdf/pdfService';
import { createSecurityEvent } from './securityService';
import { AppErr } from '../middleware/errorHandler';
import logger from '../utils/logger';
import { fieldEncrypt } from '../utils/crypto';

const WA_API_URL = `${config.whatsapp.apiBaseUrl}/${config.whatsapp.apiVersion}/${config.whatsapp.phoneNumberId}/messages`;

interface SendResult {
  success: boolean;
  waMessageId?: string;
  error?: string;
}

async function callWhatsAppApi(phoneNumber: string, reportId: string, studentName: string, registerNumber: string): Promise<SendResult> {
  if (!config.whatsapp.accessToken || config.whatsapp.accessToken === 'test_token_replace_with_real') {
    logger.warn('WhatsApp API token not configured — skipping actual send', { reportId });
    return { success: false, error: 'WhatsApp API not configured. Please set WHATSAPP_ACCESS_TOKEN in .env' };
  }

  try {
    // NOTE: In production, you'd upload the PDF to a public URL first,
    // or use Media Upload API to get a media_id, then send using that ID.
    // Here we send a template message referencing the report ID.
    const response = await fetch(WA_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.whatsapp.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: {
          body: `📊 Academic Report for ${studentName} (${registerNumber})\n\nReport ID: ${reportId}\n\nPlease contact the college to download your student's official academic report.\n\n${config.department.collegeName}`,
        },
      }),
    });

    const data = await response.json() as { messages?: Array<{ id: string }>; error?: { message: string } };

    if (!response.ok) {
      return { success: false, error: data.error?.message || 'API call failed' };
    }

    return { success: true, waMessageId: data.messages?.[0]?.id };
  } catch (err) {
    logger.error('WhatsApp API call failed', { error: err });
    return { success: false, error: 'Network error calling WhatsApp API' };
  }
}

export async function sendReportViaWhatsApp(
  reportId: string,
  sentByUserId: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // 1. Fetch report
  const reportResult = await pool.query(
    `SELECT r.report_id, r.student_id, r.status, r.file_path,
            s.name AS student_name, s.register_number
     FROM reports r
     JOIN students s ON r.student_id = s.student_id
     WHERE r.report_id = $1`,
    [reportId]
  );
  if (reportResult.rows.length === 0) throw new AppErr('Report not found', 404);
  const report = reportResult.rows[0];

  // 2. Check report is READY
  if (report.status !== 'READY') throw new AppErr('Report is not ready', 400);

  // 3. Check idempotency — don't send duplicate
  const dupCheck = await pool.query(
    `SELECT message_id, status FROM whatsapp_messages
     WHERE report_id = $1 AND status NOT IN ('FAILED')`,
    [reportId]
  );
  if (dupCheck.rows.length > 0) {
    const existing = dupCheck.rows[0];
    throw new AppErr(`Report already sent (status: ${existing.status}). Use RESEND if needed.`, 409);
  }

  // 4. Get parent phone number (backend only — never returned to client)
  const phoneNumber = await getStudentParentPhone(report.student_id);
  if (!phoneNumber) throw new AppErr('No parent WhatsApp number on file for this student', 400);

  // 5. Create idempotency key
  const idempotencyKey = `${reportId}-${sentByUserId}-${Date.now()}`;

  // 6. Create message record (SENDING state)
  const msgResult = await pool.query(
    `INSERT INTO whatsapp_messages (report_id, student_id, recipient_phone_encrypted, idempotency_key, status, sent_by)
     VALUES ($1, $2, $3, $4, 'SENDING', $5)
     RETURNING message_id`,
    [reportId, report.student_id, fieldEncrypt(phoneNumber), idempotencyKey, sentByUserId]
  );
  const messageId = msgResult.rows[0].message_id;

  // 7. Call WhatsApp API
  const result = await callWhatsAppApi(phoneNumber, reportId, report.student_name, report.register_number);

  // 8. Update status
  if (result.success) {
    await pool.query(
      `UPDATE whatsapp_messages SET status = 'SENT', wa_message_id = $1, sent_at = NOW()
       WHERE message_id = $2`,
      [result.waMessageId, messageId]
    );
    logger.info('WhatsApp report sent', { reportId, messageId, studentId: report.student_id });
    return { success: true, messageId };
  } else {
    await pool.query(
      `UPDATE whatsapp_messages SET status = 'FAILED', failed_at = NOW(), failure_reason = $1
       WHERE message_id = $2`,
      [result.error, messageId]
    );
    await createSecurityEvent({
      eventType: 'WHATSAPP_SEND_FAILED',
      severity: 'LOW',
      userId: sentByUserId,
      description: `WhatsApp send failed for report ${reportId}: ${result.error}`,
    });
    return { success: false, error: result.error };
  }
}

export async function handleWhatsAppWebhook(payload: Record<string, unknown>): Promise<void> {
  // Store raw webhook
  await pool.query(
    'INSERT INTO whatsapp_webhooks (event_type, raw_payload) VALUES ($1, $2)',
    ['delivery_status', JSON.stringify(payload)]
  );

  // Parse delivery status update
  try {
    const entry = (payload.entry as Array<Record<string, unknown>>)?.[0];
    const changes = (entry?.changes as Array<Record<string, unknown>>)?.[0];
    const value = changes?.value as Record<string, unknown>;
    const statuses = value?.statuses as Array<Record<string, unknown>>;

    if (!statuses?.length) return;

    for (const status of statuses) {
      const waMessageId = String(status.id);
      const statusVal = String(status.status).toUpperCase();

      const updateMap: Record<string, string> = {
        SENT: "status = 'SENT', sent_at = NOW()",
        DELIVERED: "status = 'DELIVERED', delivered_at = NOW()",
        READ: "status = 'READ', read_at = NOW()",
        FAILED: "status = 'FAILED', failed_at = NOW()",
      };

      const updateSql = updateMap[statusVal];
      if (updateSql) {
        await pool.query(
          `UPDATE whatsapp_messages SET ${updateSql} WHERE wa_message_id = $1`,
          [waMessageId]
        );
      }
    }

    // Mark webhook as processed
    await pool.query(
      `UPDATE whatsapp_webhooks SET processed = true WHERE raw_payload->>'entry' IS NOT NULL ORDER BY received_at DESC LIMIT 1`
    );
  } catch (err) {
    logger.error('WhatsApp webhook processing error', { error: err });
  }
}

export async function getWhatsAppLogs(query: Record<string, unknown>) {
  const { limit = 50, offset = 0 } = query;

  const result = await pool.query(
    `SELECT wm.message_id, wm.status, wm.sent_at, wm.delivered_at, wm.read_at, wm.failed_at,
            wm.failure_reason, wm.retry_count, wm.created_at,
            s.register_number, s.name AS student_name,
            r.report_id,
            u.username AS sent_by_username
     FROM whatsapp_messages wm
     JOIN students s ON wm.student_id = s.student_id
     JOIN reports r ON wm.report_id = r.report_id
     JOIN users u ON wm.sent_by = u.user_id
     ORDER BY wm.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
}

export async function bulkSendPreview(examId: string, subjectId?: string) {
  const result = await pool.query(
    `SELECT r.report_id, s.student_id, s.register_number, s.name AS student_name,
            s.parent_whatsapp_encrypted IS NOT NULL AS has_parent_phone,
            r.status AS report_status,
            (SELECT status FROM whatsapp_messages wm WHERE wm.report_id = r.report_id AND wm.status != 'FAILED' LIMIT 1) AS already_sent_status
     FROM reports r
     JOIN students s ON r.student_id = s.student_id
     WHERE r.exam_id = $1 AND r.status = 'READY'`,
    [examId]
  );

  const valid: unknown[] = [];
  const missingPhone: unknown[] = [];
  const alreadySent: unknown[] = [];

  for (const row of result.rows) {
    if (row.already_sent_status) {
      alreadySent.push(row);
    } else if (!row.has_parent_phone) {
      missingPhone.push(row);
    } else {
      valid.push(row);
    }
  }

  return {
    total: result.rows.length,
    valid: valid.length,
    missingPhone: missingPhone.length,
    alreadySent: alreadySent.length,
    validItems: valid,
    missingPhoneItems: missingPhone,
  };
}

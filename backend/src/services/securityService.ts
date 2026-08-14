import pool from '../config/database';
import logger from '../utils/logger';

export interface SecurityEventData {
  eventType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId?: string;
  username?: string;
  ipAddress?: string;
  description: string;
  metadata?: unknown;
}

export async function createSecurityEvent(data: SecurityEventData): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO security_events (event_type, severity, user_id, username, ip_address, description, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        data.eventType,
        data.severity,
        data.userId || null,
        data.username || null,
        data.ipAddress || null,
        data.description,
        data.metadata ? JSON.stringify(data.metadata) : null,
      ]
    );

    // Log high/critical events to application log as well
    if (data.severity === 'HIGH' || data.severity === 'CRITICAL') {
      logger.warn(`[SECURITY ${data.severity}] ${data.eventType}: ${data.description}`, {
        username: data.username,
        ipAddress: data.ipAddress,
      });
    }
  } catch (err) {
    logger.error('Failed to create security event', { error: err });
  }
}

export async function getSecurityEvents(
  filters: { severity?: string; resolved?: boolean; limit?: number; offset?: number }
) {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  if (filters.severity) {
    conditions.push(`severity = $${i++}`);
    params.push(filters.severity);
  }
  if (filters.resolved !== undefined) {
    conditions.push(`is_resolved = $${i++}`);
    params.push(filters.resolved);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;

  params.push(limit, offset);

  const [events, countResult] = await Promise.all([
    pool.query(
      `SELECT * FROM security_events ${where} ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i++}`,
      params
    ),
    pool.query(`SELECT COUNT(*) FROM security_events ${where}`, params.slice(0, -2)),
  ]);

  return {
    events: events.rows,
    total: parseInt(countResult.rows[0].count),
  };
}

export async function resolveSecurityEvent(eventId: string, resolvedBy: string): Promise<void> {
  await pool.query(
    `UPDATE security_events SET is_resolved = true, resolved_by = $1, resolved_at = NOW() WHERE event_id = $2`,
    [resolvedBy, eventId]
  );
}

export async function getSecurityOverview() {
  const result = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE NOT is_resolved) AS total_open,
      COUNT(*) FILTER (WHERE severity = 'CRITICAL' AND NOT is_resolved) AS critical,
      COUNT(*) FILTER (WHERE severity = 'HIGH' AND NOT is_resolved) AS high,
      COUNT(*) FILTER (WHERE severity = 'MEDIUM' AND NOT is_resolved) AS medium,
      COUNT(*) FILTER (WHERE severity = 'LOW' AND NOT is_resolved) AS low,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') AS last_24h
    FROM security_events
  `);
  return result.rows[0];
}

// ─── Anomaly Detection Rules ─────────────────────────────────────────────────

/** Rule 1: 10+ failed logins for same account in 1 hour */
export async function checkFailedLoginAnomaly(username: string, ipAddress: string): Promise<void> {
  const result = await pool.query(
    `SELECT COUNT(*) FROM login_attempts
     WHERE username = $1 AND success = false AND attempted_at >= NOW() - INTERVAL '1 hour'`,
    [username]
  );

  const count = parseInt(result.rows[0].count);
  if (count >= 10) {
    await createSecurityEvent({
      eventType: 'BRUTE_FORCE_DETECTED',
      severity: 'HIGH',
      username,
      ipAddress,
      description: `${count} failed login attempts for account "${username}" in the past hour.`,
      metadata: { failedAttempts: count, timeWindow: '1 hour' },
    });
  }
}

/** Rule 2: 10+ 403 responses from same IP in 5 minutes */
export async function checkRepeatedUnauthorized(ipAddress: string): Promise<void> {
  const result = await pool.query(
    `SELECT COUNT(*) FROM audit_logs
     WHERE ip_address = $1
       AND action = 'UNAUTHORIZED_ACCESS'
       AND created_at >= NOW() - INTERVAL '5 minutes'`,
    [ipAddress]
  );

  const count = parseInt(result.rows[0].count);
  if (count >= 10) {
    await createSecurityEvent({
      eventType: 'REPEATED_UNAUTHORIZED_ACCESS',
      severity: 'HIGH',
      ipAddress,
      description: `${count} unauthorized access attempts from IP ${ipAddress} in 5 minutes.`,
      metadata: { attemptCount: count, ipAddress },
    });
  }
}

/** Rule 3: Same staff changes >20 marks in 10 minutes */
export async function checkBulkMarkChange(userId: string, username: string): Promise<void> {
  const result = await pool.query(
    `SELECT COUNT(*) FROM audit_logs
     WHERE user_id = $1
       AND action IN ('MARK_CREATED', 'MARK_UPDATED')
       AND created_at >= NOW() - INTERVAL '10 minutes'`,
    [userId]
  );

  const count = parseInt(result.rows[0].count);
  if (count > 20) {
    await createSecurityEvent({
      eventType: 'UNUSUAL_BULK_MARK_CHANGE',
      severity: 'MEDIUM',
      userId,
      username,
      description: `Staff "${username}" changed ${count} marks in the past 10 minutes.`,
      metadata: { markChangeCount: count, timeWindow: '10 minutes' },
    });
  }
}

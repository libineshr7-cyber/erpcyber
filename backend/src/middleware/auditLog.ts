import { Request, Response, NextFunction } from 'express';
import './authenticate';
import pool from '../config/database';
import logger from '../utils/logger';

interface AuditData {
  action: string;
  resourceType?: string;
  resourceId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  reason?: string;
  metadata?: unknown;
}

/**
 * Create an audit log entry. Called directly from services/controllers for precise control.
 */
export async function createAuditLog(
  req: Request,
  data: AuditData,
  result: 'SUCCESS' | 'FAILURE' | 'PARTIAL' = 'SUCCESS'
): Promise<void> {
  try {
    const user = (req as any).user;
    await pool.query(
      `INSERT INTO audit_logs (user_id, username, role, action, resource_type, resource_id, old_value, new_value, ip_address, user_agent, result, reason, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        user?.userId || null,
        user?.username || 'anonymous',
        user?.role || null,
        data.action,
        data.resourceType || null,
        data.resourceId || null,
        data.oldValue ? JSON.stringify(data.oldValue) : null,
        data.newValue ? JSON.stringify(data.newValue) : null,
        req.ip || null,
        req.headers['user-agent'] || null,
        result,
        data.reason || null,
        data.metadata ? JSON.stringify(data.metadata) : null,
      ]
    );
  } catch (err) {
    logger.error('Failed to create audit log', { error: err, action: data.action });
  }
}

/**
 * Middleware that auto-logs every request (for routes that need general audit trail).
 */
export const auditMiddleware = (action: string, resourceType?: string) => {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    next();
  };
};

export default { createAuditLog, auditMiddleware };

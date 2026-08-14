import { Request, Response, NextFunction } from 'express';
import { unauthorized } from '../utils/response';
import pool from '../config/database';
import { config } from '../config/env';

// Extend Express session type
declare module 'express-session' {
  interface SessionData {
    userId: string;
    role: string;
    username: string;
    lastActivity: number;
    loginAt: number;
    mfaVerified?: boolean;
  }
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
        username: string;
        studentId?: string;
        staffId?: string;
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.session?.userId) {
    unauthorized(res);
    return;
  }

  // Idle timeout check
  const lastActivity = req.session.lastActivity || 0;
  const isHod = req.session.role === 'HOD' || req.session.role === 'SUPER_ADMIN';
  const timeout = isHod ? config.session.hodIdleTimeout : config.session.idleTimeout;

  if (Date.now() - lastActivity > timeout) {
    req.session.destroy(() => {});
    unauthorized(res, 'Session expired due to inactivity. Please log in again.');
    return;
  }

  // Update last activity
  req.session.lastActivity = Date.now();

  // Build base user object
  req.user = {
    userId: req.session.userId,
    role: req.session.role,
    username: req.session.username,
  };

  // For STUDENT role: attach their studentId
  if (req.session.role === 'STUDENT') {
    try {
      const result = await pool.query(
        'SELECT student_id FROM students WHERE user_id = $1 LIMIT 1',
        [req.session.userId]
      );
      if (result.rows[0]) {
        req.user.studentId = result.rows[0].student_id;
      }
    } catch {
      // Non-blocking — student ID lookup failure shouldn't break the request
    }
  }

  // For STAFF role: attach their staffId
  if (req.session.role === 'STAFF') {
    try {
      const result = await pool.query(
        'SELECT staff_id FROM staff WHERE user_id = $1 LIMIT 1',
        [req.session.userId]
      );
      if (result.rows[0]) {
        req.user.staffId = result.rows[0].staff_id;
      }
    } catch {
      // Non-blocking
    }
  }

  next();
};

/**
 * Require MFA to be verified for HOD/SUPER_ADMIN who have MFA enabled.
 */
export const requireMfa = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const isPrivilegedRole = ['HOD', 'SUPER_ADMIN'].includes(req.session?.role || '');
  if (!isPrivilegedRole) {
    next();
    return;
  }

  // Check if user has MFA enabled
  const result = await pool.query(
    'SELECT mfa_enabled FROM users WHERE user_id = $1',
    [req.session!.userId]
  );
  const mfaEnabled = result.rows[0]?.mfa_enabled;

  if (mfaEnabled && !req.session!.mfaVerified) {
    unauthorized(res, 'MFA verification required');
    return;
  }

  next();
};

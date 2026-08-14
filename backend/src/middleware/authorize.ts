import { Request, Response, NextFunction } from 'express';
import { forbidden } from '../utils/response';
import pool from '../config/database';
import { Permission } from '../config/constants';
import { createSecurityEvent } from '../services/securityService';

/**
 * Check that the current user's role has a specific permission.
 * Usage: router.get('/path', authenticate, authorize('marks:approve'), handler)
 */
export const authorize = (permission: Permission) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      forbidden(res, 'Authentication required');
      return;
    }

    const { role } = req.user;

    // SUPER_ADMIN bypasses all permission checks
    if (role === 'SUPER_ADMIN') {
      next();
      return;
    }

    const result = await pool.query(
      `SELECT rp.permission_id FROM role_permissions rp
       JOIN permissions p ON rp.permission_id = p.permission_id
       WHERE rp.role = $1 AND p.name = $2
       LIMIT 1`,
      [role, permission]
    );

    if (result.rows.length === 0) {
      await createSecurityEvent({
        eventType: 'UNAUTHORIZED_ACCESS',
        severity: 'MEDIUM',
        userId: req.user.userId,
        username: req.user.username,
        ipAddress: req.ip || '',
        description: `User ${req.user.username} (${role}) attempted action requiring permission: ${permission}`,
        metadata: { permission, path: req.path, method: req.method },
      });
      forbidden(res);
      return;
    }

    next();
  };
};

/**
 * Verify that STUDENT can only access their own data.
 * Verify that STAFF can only access data for subjects/sections they're assigned to.
 */
export const authorizeStudentAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) { forbidden(res); return; }

  const { role, userId, studentId } = req.user;

  // HOD/SUPER_ADMIN: no restriction
  if (role === 'HOD' || role === 'SUPER_ADMIN') { next(); return; }

  if (role === 'STUDENT') {
    const requestedStudentId = req.params.studentId || req.params.id;

    if (!requestedStudentId || requestedStudentId !== studentId) {
      // Log IDOR attempt
      await createSecurityEvent({
        eventType: 'IDOR_ATTEMPT',
        severity: 'HIGH',
        userId,
        username: req.user.username,
        ipAddress: req.ip || '',
        description: `Student ${req.user.username} attempted to access data for student ID: ${requestedStudentId}`,
        metadata: { ownStudentId: studentId, attemptedId: requestedStudentId, path: req.path },
      });
      forbidden(res, 'Access denied');
      return;
    }
    next();
    return;
  }

  // STAFF: verify assignment
  if (role === 'STAFF') {
    const subjectId = req.query.subjectId || req.body.subjectId;
    const sectionId = req.query.sectionId || req.body.sectionId;

    if (subjectId) {
      const assigned = await pool.query(
        `SELECT 1 FROM staff_assignments sa
         JOIN staff s ON sa.staff_id = s.staff_id
         WHERE s.user_id = $1 AND sa.subject_id = $2 AND sa.is_active = true
         LIMIT 1`,
        [userId, subjectId]
      );
      if (assigned.rows.length === 0) {
        forbidden(res, 'You are not assigned to this subject');
        return;
      }
    }

    next();
    return;
  }

  next();
};

/**
 * Role-based guard — only allows specified roles.
 * Usage: authorize roles(['HOD', 'SUPER_ADMIN'])
 */
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      forbidden(res, `Access restricted to: ${roles.join(', ')}`);
      return;
    }
    next();
  };
};

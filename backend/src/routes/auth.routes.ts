import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validateRequest';
import { loginLimiter, mfaLimiter, passwordResetLimiter } from '../middleware/rateLimiter';
import { createAuditLog } from '../middleware/auditLog';
import * as authService from '../services/authService';
import { success, error, unauthorized } from '../utils/response';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscores'),
  password: z.string().min(1).max(128),
});

const mfaTokenSchema = z.object({ token: z.string().length(6).regex(/^\d{6}$/) });

const passwordResetRequestSchema = z.object({
  email: z.string().email(),
});

const passwordResetSchema = z.object({
  token: z.string().min(32),
  newPassword: z.string().min(8).max(128)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/\d/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
});

// POST /api/auth/login
router.post('/login', loginLimiter, validate(loginSchema), async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body as { username: string; password: string };

  const result = await authService.login(username, password, req);

  if (!result.success || !result.user) {
    await createAuditLog(req, { action: 'LOGIN_FAILED', metadata: { username } }, 'FAILURE');
    error(res, result.error || 'Invalid credentials.', 401);
    return;
  }

  // If MFA is required, don't create full session yet
  if (result.user.mfaRequired) {
    req.session.regenerate((err) => {
      if (err) { error(res, 'Session error', 500); return; }
      req.session.userId = result.user!.userId;
      req.session.role = result.user!.role;
      req.session.username = result.user!.username;
      req.session.loginAt = Date.now();
      req.session.lastActivity = Date.now();
      req.session.mfaVerified = false;
      success(res, { requiresMfa: true, role: result.user!.role });
    });
    return;
  }

  // Full session
  req.session.regenerate((err) => {
    if (err) { error(res, 'Session error', 500); return; }
    req.session.userId = result.user!.userId;
    req.session.role = result.user!.role;
    req.session.username = result.user!.username;
    req.session.loginAt = Date.now();
    req.session.lastActivity = Date.now();
    req.session.mfaVerified = true;
    success(res, {
      userId: result.user!.userId,
      username: result.user!.username,
      role: result.user!.role,
      requiresMfa: false,
    });
  });
});

// POST /api/auth/mfa/validate
router.post('/mfa/validate', mfaLimiter, async (req: Request, res: Response): Promise<void> => {
  if (!req.session?.userId) { unauthorized(res); return; }

  const parse = mfaTokenSchema.safeParse(req.body);
  if (!parse.success) { error(res, 'Invalid MFA token format', 400); return; }

  const valid = await authService.verifyMfaToken(req.session.userId, parse.data.token);

  if (!valid) {
    error(res, 'Invalid or expired MFA code.', 401);
    return;
  }

  req.session.mfaVerified = true;
  req.session.lastActivity = Date.now();
  success(res, { verified: true, role: req.session.role });
});

// POST /api/auth/mfa/setup
router.post('/mfa/setup', authenticate, async (req: Request, res: Response): Promise<void> => {
  const result = await authService.setupMfa(req.user!.userId, req.user!.username);
  success(res, { qrCodeUrl: result.qrCodeUrl, recoveryCodes: result.recoveryCodes });
});

// POST /api/auth/mfa/enable
router.post('/mfa/enable', authenticate, validate(mfaTokenSchema), async (req: Request, res: Response): Promise<void> => {
  const { token } = req.body as { token: string };
  const valid = await authService.verifyMfaToken(req.user!.userId, token);
  if (!valid) { error(res, 'Invalid MFA token', 401); return; }
  await authService.enableMfa(req.user!.userId);
  success(res, { mfaEnabled: true });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  const user = await authService.getCurrentUser(req.user!.userId);
  if (!user) { unauthorized(res); return; }
  // Never return password_hash
  const { password_hash: _, ...safeUser } = user as Record<string, unknown> & { password_hash: string };
  success(res, safeUser);
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req: Request, res: Response): Promise<void> => {
  await createAuditLog(req, { action: 'LOGOUT' });
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    success(res, null, 'Logged out successfully');
  });
});

// DELETE /api/auth/logout-all
router.delete('/logout-all', authenticate, async (req: Request, res: Response): Promise<void> => {
  await authService.terminateAllSessions(req.user!.userId);
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    success(res, null, 'Logged out from all devices');
  });
});

// GET /api/auth/sessions
router.get('/sessions', authenticate, async (req: Request, res: Response): Promise<void> => {
  const sessions = await authService.getActiveSessions(req.user!.userId);
  success(res, sessions);
});

// DELETE /api/auth/sessions/:sid
router.delete('/sessions/:sid', authenticate, async (req: Request, res: Response): Promise<void> => {
  await authService.terminateSession(req.params.sid);
  await createAuditLog(req, { action: 'SESSION_TERMINATED', resourceId: req.params.sid });
  success(res, null, 'Session terminated');
});

// POST /api/auth/password/reset-request
router.post('/password/reset-request', passwordResetLimiter, validate(passwordResetRequestSchema), async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email: string };
  const token = await authService.requestPasswordReset(email);
  // Always return success to prevent email enumeration
  success(res, null, 'If that email is registered, a reset link has been sent.');
  // In production: send token via email
  if (token && process.env.NODE_ENV === 'development') {
    console.log(`[DEV] Password reset token for ${email}: ${token}`);
  }
});

// POST /api/auth/password/reset
router.post('/password/reset', passwordResetLimiter, validate(passwordResetSchema), async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword } = req.body as { token: string; newPassword: string };
  const ok = await authService.resetPassword(token, newPassword);
  if (!ok) { error(res, 'Invalid or expired reset token.', 400); return; }
  success(res, null, 'Password reset successfully.');
});

export default router;

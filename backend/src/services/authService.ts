import { hash, verify, Algorithm } from '@node-rs/argon2';
import { Request } from 'express';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import crypto from 'crypto';
import pool from '../config/database';
import { config } from '../config/env';
import {
  generateSecureToken,
  hashToken,
  fieldEncrypt,
} from '../utils/crypto';
import { createAuditLog } from '../middleware/auditLog';
import {
  checkFailedLoginAnomaly,
} from './securityService';
import logger from '../utils/logger';

const argon2Options = {
  algorithm: Algorithm.Argon2id,
  memoryCost: config.argon2.memoryCost,
  timeCost: config.argon2.timeCost,
  parallelism: config.argon2.parallelism,
};

export async function hashPassword(password: string): Promise<string> {
  return hash(password, argon2Options);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return verify(hash, password, argon2Options);
}

// ─── Login ───────────────────────────────────────────────────────────────────

export interface LoginResult {
  success: boolean;
  user?: {
    userId: string;
    username: string;
    role: string;
    mfaEnabled: boolean;
    mfaRequired: boolean;
  };
  error?: string;
}

export async function login(
  username: string,
  password: string,
  req: Request
): Promise<LoginResult> {
  const ip = req.ip || '';
  const userAgent = req.headers['user-agent'] || '';

  // Record attempt
  const recordAttempt = async (success: boolean, reason?: string) => {
    await pool.query(
      `INSERT INTO login_attempts (username, ip_address, user_agent, success, failure_reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [username, ip, userAgent, success, reason || null]
    );
  };

  // Fetch user
  const userResult = await pool.query(
    `SELECT user_id, username, password_hash, role, account_status, failed_login_attempts, locked_until, mfa_enabled
     FROM users WHERE username = $1 LIMIT 1`,
    [username]
  );

  if (userResult.rows.length === 0) {
    await recordAttempt(false, 'USER_NOT_FOUND');
    // Perform dummy verification to prevent timing attacks
    await hash('dummy_password_for_timing', argon2Options);
    return { success: false, error: 'Invalid credentials.' };
  }

  const user = userResult.rows[0];

  // Check account status
  if (user.account_status !== 'ACTIVE') {
    await recordAttempt(false, 'ACCOUNT_INACTIVE');
    return { success: false, error: 'Invalid credentials.' };
  }

  // Check lockout
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    await recordAttempt(false, 'ACCOUNT_LOCKED');
    return { success: false, error: 'Account temporarily locked due to too many failed attempts. Please try again later.' };
  }

  // Verify password
  const passwordValid = await verifyPassword(user.password_hash, password);

  if (!passwordValid) {
    const newFailCount = (user.failed_login_attempts || 0) + 1;
    const lockedUntil = newFailCount >= 10
      ? new Date(Date.now() + 30 * 60 * 1000) // Lock for 30 minutes after 10 failures
      : null;

    await pool.query(
      `UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE user_id = $3`,
      [newFailCount, lockedUntil, user.user_id]
    );

    await recordAttempt(false, 'WRONG_PASSWORD');
    await checkFailedLoginAnomaly(username, ip);

    return { success: false, error: 'Invalid credentials.' };
  }

  // Success — reset failed attempts
  await pool.query(
    `UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = NOW(), last_login_ip = $1
     WHERE user_id = $2`,
    [ip, user.user_id]
  );

  await recordAttempt(true);
  await createAuditLog(req, { action: 'LOGIN_SUCCESS', metadata: { username } });

  const mfaRequired = user.mfa_enabled && ['HOD', 'SUPER_ADMIN'].includes(user.role);

  return {
    success: true,
    user: {
      userId: user.user_id,
      username: user.username,
      role: user.role,
      mfaEnabled: user.mfa_enabled,
      mfaRequired,
    },
  };
}

// ─── MFA ─────────────────────────────────────────────────────────────────────

function encryptMfaSecret(secret: string): Buffer {
  const key = crypto.createHash('sha256').update(config.mfa.encryptionKey).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv) as crypto.CipherGCM;
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]);
}

function decryptMfaSecret(buf: Buffer): string {
  const key = crypto.createHash('sha256').update(config.mfa.encryptionKey).digest();
  const iv = buf.slice(0, 16);
  const tag = buf.slice(16, 32);
  const encrypted = buf.slice(32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv) as crypto.DecipherGCM;
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

export async function setupMfa(userId: string, username: string): Promise<{ qrCodeUrl: string; secret: string; recoveryCodes: string[] }> {
  const totp = new OTPAuth.TOTP({
    issuer: config.mfa.issuer,
    label: username,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: new OTPAuth.Secret({ size: 20 }),
  });

  const secretStr = totp.secret.base32;
  const otpauthUrl = totp.toString();

  // Generate recovery codes
  const recoveryCodes = Array.from({ length: 8 }, () =>
    crypto.randomBytes(5).toString('hex').toUpperCase().match(/.{5}/g)!.join('-')
  );

  // Hash recovery codes for storage
  const hashedCodes = recoveryCodes.map(code =>
    crypto.createHash('sha256').update(code).digest('hex')
  );

  // Encrypt TOTP secret
  const encryptedSecret = encryptMfaSecret(secretStr);

  // Upsert MFA credential
  await pool.query(
    `INSERT INTO mfa_credentials (user_id, secret_encrypted, recovery_codes_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE SET
       secret_encrypted = EXCLUDED.secret_encrypted,
       recovery_codes_hash = EXCLUDED.recovery_codes_hash,
       updated_at = NOW()`,
    [userId, encryptedSecret, hashedCodes]
  );

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

  return { qrCodeUrl, secret: secretStr, recoveryCodes };
}

export async function verifyMfaToken(userId: string, token: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT secret_encrypted FROM mfa_credentials WHERE user_id = $1',
    [userId]
  );

  if (result.rows.length === 0) return false;

  const secretStr = decryptMfaSecret(result.rows[0].secret_encrypted);

  const totp = new OTPAuth.TOTP({
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretStr),
  });

  const delta = totp.validate({ token, window: 1 });
  return delta !== null;
}

export async function enableMfa(userId: string): Promise<void> {
  await pool.query('UPDATE users SET mfa_enabled = true WHERE user_id = $1', [userId]);
}

// ─── Password Reset ───────────────────────────────────────────────────────────

export async function requestPasswordReset(email: string): Promise<string | null> {
  const result = await pool.query(
    'SELECT user_id FROM users WHERE email = $1 LIMIT 1',
    [email]
  );
  if (result.rows.length === 0) return null;

  const userId = result.rows[0].user_id;
  const token = generateSecureToken(32);
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + config.passwordReset.expiryMinutes * 60 * 1000);

  await pool.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );

  return token; // Caller is responsible for sending this token to user
}

export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const tokenHash = hashToken(token);

  const result = await pool.query(
    `SELECT prt.token_id, prt.user_id, prt.expires_at, prt.used_at
     FROM password_reset_tokens prt
     WHERE prt.token_hash = $1 LIMIT 1`,
    [tokenHash]
  );

  if (result.rows.length === 0) return false;

  const tokenRecord = result.rows[0];

  if (tokenRecord.used_at) return false; // Already used
  if (new Date(tokenRecord.expires_at) < new Date()) return false; // Expired

  const newHash = await hashPassword(newPassword);

  // Update password and mark token as used in a transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'UPDATE users SET password_hash = $1, password_changed_at = NOW() WHERE user_id = $2',
      [newHash, tokenRecord.user_id]
    );
    await client.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE token_id = $1',
      [tokenRecord.token_id]
    );
    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Password reset transaction failed', { error: err });
    return false;
  } finally {
    client.release();
  }
}

// ─── Session Management ───────────────────────────────────────────────────────

export async function getActiveSessions(userId: string) {
  const result = await pool.query(
    `SELECT sid, sess, expire FROM sessions WHERE sess->>'userId' = $1 AND expire > NOW()`,
    [userId]
  );

  return result.rows.map(row => ({
    sid: row.sid,
    loginAt: row.sess.loginAt,
    lastActivity: row.sess.lastActivity,
    userAgent: row.sess.userAgent,
    role: row.sess.role,
    expire: row.expire,
  }));
}

export async function terminateSession(sid: string): Promise<void> {
  await pool.query('DELETE FROM sessions WHERE sid = $1', [sid]);
}

export async function terminateAllSessions(userId: string, exceptSid?: string): Promise<void> {
  if (exceptSid) {
    await pool.query(
      `DELETE FROM sessions WHERE sess->>'userId' = $1 AND sid != $2`,
      [userId, exceptSid]
    );
  } else {
    await pool.query(`DELETE FROM sessions WHERE sess->>'userId' = $1`, [userId]);
  }
}

export async function getCurrentUser(userId: string) {
  const result = await pool.query(
    `SELECT user_id, username, email, role, account_status, mfa_enabled, last_login_at
     FROM users WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

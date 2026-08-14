import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getEncryptionKey(): Buffer {
  const key = process.env.FIELD_ENCRYPTION_KEY || '';
  const keyBuffer = Buffer.from(key, 'hex');
  if (keyBuffer.length < KEY_LENGTH) {
    // Derive 32-byte key using SHA-256 if not hex
    return crypto.createHash('sha256').update(key).digest();
  }
  return keyBuffer.slice(0, KEY_LENGTH);
}

/**
 * Encrypt a plaintext string (e.g., phone number).
 * Returns a Buffer: IV (16) + AuthTag (16) + Ciphertext
 */
export function fieldEncrypt(plaintext: string): Buffer {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv) as crypto.CipherGCM;

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]);
}

/**
 * Decrypt a Buffer that was encrypted with fieldEncrypt.
 * Returns the original plaintext string.
 */
export function fieldDecrypt(encryptedBuffer: Buffer): string {
  const key = getEncryptionKey();
  const iv = encryptedBuffer.slice(0, IV_LENGTH);
  const tag = encryptedBuffer.slice(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = encryptedBuffer.slice(IV_LENGTH + TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv) as crypto.DecipherGCM;
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Generate a cryptographically secure random token.
 */
export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Hash a token for safe storage (one-way, for comparison).
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Mask a phone number for display in staff/HOD UIs.
 * +919876543210 → +91 ******3210
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return '******';
  const visible = phone.slice(-4);
  const prefix = phone.startsWith('+') ? phone.slice(0, 3) : '';
  return `${prefix} ******${visible}`;
}

/**
 * Sanitize a filename to prevent path traversal.
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '_')
    .slice(0, 100);
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

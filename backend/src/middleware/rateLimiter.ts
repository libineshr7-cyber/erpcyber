import rateLimit from 'express-rate-limit';
import { config } from '../config/env';

const createLimiter = (max: number, windowMs: number, message: string) =>
  rateLimit({
    max,
    windowMs,
    message: { success: false, error: message },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => {
      return req.ip || req.socket?.remoteAddress || 'unknown';
    },
  });

/** Strict limiter for login endpoint — 5 attempts per 15 minutes per IP */
export const loginLimiter = createLimiter(
  config.rateLimit.login.max,
  config.rateLimit.login.windowMs,
  'Too many login attempts. Please wait 15 minutes before trying again.'
);

/** General API limiter — 100 requests per minute per IP */
export const apiLimiter = createLimiter(
  config.rateLimit.api.max,
  config.rateLimit.api.windowMs,
  'Too many requests. Please slow down.'
);

/** Strict limiter for password reset — 3 per hour */
export const passwordResetLimiter = createLimiter(
  3,
  60 * 60 * 1000,
  'Too many password reset requests. Please wait 1 hour.'
);

/** WhatsApp send limiter — 10 per minute per IP */
export const whatsappLimiter = createLimiter(
  config.rateLimit.whatsapp.max,
  config.rateLimit.whatsapp.windowMs,
  'Too many WhatsApp send requests. Please wait before sending again.'
);

/** File upload limiter — 5 per minute per IP */
export const uploadLimiter = createLimiter(
  5,
  60 * 1000,
  'Too many file uploads. Please wait a moment.'
);

/** PDF generation limiter — 20 per minute per IP */
export const pdfLimiter = createLimiter(
  20,
  60 * 1000,
  'Too many PDF generation requests. Please wait.'
);

/** MFA limiter — 10 attempts per 15 minutes */
export const mfaLimiter = createLimiter(
  10,
  15 * 60 * 1000,
  'Too many MFA attempts. Please wait 15 minutes.'
);

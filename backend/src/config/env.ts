import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.string().default('3000').transform(Number),
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  DATABASE_URL: z.string().optional(),

  POSTGRES_HOST: z.string().default('localhost'),
  POSTGRES_PORT: z.string().default('5432').transform(Number),
  POSTGRES_DB: z.string().default('erp_db'),
  POSTGRES_USER: z.string().default('erp_user'),
  POSTGRES_PASSWORD: z.string().default('erp_dev_password'),
  POSTGRES_SSL: z.string().default('false').transform(v => v === 'true'),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379').transform(Number),
  REDIS_PASSWORD: z.string().optional(),

  SESSION_SECRET: z.string().default('dev_session_secret_change_in_production_64_chars_minimum_length_xyz'),
  SESSION_MAX_AGE_MS: z.string().default('1800000').transform(Number),
  SESSION_IDLE_TIMEOUT_MS: z.string().default('1800000').transform(Number),
  SESSION_HOD_IDLE_TIMEOUT_MS: z.string().default('900000').transform(Number),

  ARGON2_MEMORY_COST: z.string().default('65536').transform(Number),
  ARGON2_TIME_COST: z.string().default('3').transform(Number),
  ARGON2_PARALLELISM: z.string().default('4').transform(Number),

  MFA_ISSUER: z.string().default('Department ERP'),
  MFA_ENCRYPTION_KEY: z.string().default('00000000000000000000000000000001'),

  PASSWORD_RESET_TOKEN_EXPIRY_MINUTES: z.string().default('30').transform(Number),

  RATE_LIMIT_LOGIN_MAX: z.string().default('5').transform(Number),
  RATE_LIMIT_LOGIN_WINDOW_MS: z.string().default('900000').transform(Number),
  RATE_LIMIT_API_MAX: z.string().default('100').transform(Number),
  RATE_LIMIT_API_WINDOW_MS: z.string().default('60000').transform(Number),
  RATE_LIMIT_WHATSAPP_MAX: z.string().default('10').transform(Number),
  RATE_LIMIT_WHATSAPP_WINDOW_MS: z.string().default('60000').transform(Number),

  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE_BYTES: z.string().default('10485760').transform(Number),

  PDF_OUTPUT_DIR: z.string().default('./storage/reports'),
  PDF_WATERMARK_TEXT: z.string().default('OFFICIAL ACADEMIC REPORT'),

  WHATSAPP_ACCESS_TOKEN: z.string().default(''),
  WHATSAPP_PHONE_NUMBER_ID: z.string().default(''),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().default(''),
  WHATSAPP_API_VERSION: z.string().default('v20.0'),
  WHATSAPP_API_BASE_URL: z.string().default('https://graph.facebook.com'),

  DEPARTMENT_NAME: z.string().default('Department of Computer Science'),
  DEPARTMENT_SHORT: z.string().default('CS'),
  COLLEGE_NAME: z.string().default('College Name'),
  COLLEGE_ADDRESS: z.string().default('College Address'),

  LOG_LEVEL: z.string().default('info'),
  LOG_FILE: z.string().default('./logs/app.log'),

  FIELD_ENCRYPTION_KEY: z.string().default('00000000000000000000000000000002'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const config = {
  nodeEnv: parsed.data.NODE_ENV,
  port: parsed.data.PORT,
  frontendUrl: parsed.data.FRONTEND_URL,
  isProduction: parsed.data.NODE_ENV === 'production',

  databaseUrl: parsed.data.DATABASE_URL,

  db: {
    host: parsed.data.POSTGRES_HOST,
    port: parsed.data.POSTGRES_PORT,
    database: parsed.data.POSTGRES_DB,
    user: parsed.data.POSTGRES_USER,
    password: parsed.data.POSTGRES_PASSWORD,
    ssl: parsed.data.POSTGRES_SSL,
  },

  redis: {
    host: parsed.data.REDIS_HOST,
    port: parsed.data.REDIS_PORT,
    password: parsed.data.REDIS_PASSWORD,
  },

  session: {
    secret: parsed.data.SESSION_SECRET,
    maxAge: parsed.data.SESSION_MAX_AGE_MS,
    idleTimeout: parsed.data.SESSION_IDLE_TIMEOUT_MS,
    hodIdleTimeout: parsed.data.SESSION_HOD_IDLE_TIMEOUT_MS,
  },

  argon2: {
    memoryCost: parsed.data.ARGON2_MEMORY_COST,
    timeCost: parsed.data.ARGON2_TIME_COST,
    parallelism: parsed.data.ARGON2_PARALLELISM,
  },

  mfa: {
    issuer: parsed.data.MFA_ISSUER,
    encryptionKey: parsed.data.MFA_ENCRYPTION_KEY,
  },

  passwordReset: {
    expiryMinutes: parsed.data.PASSWORD_RESET_TOKEN_EXPIRY_MINUTES,
  },

  rateLimit: {
    login: { max: parsed.data.RATE_LIMIT_LOGIN_MAX, windowMs: parsed.data.RATE_LIMIT_LOGIN_WINDOW_MS },
    api: { max: parsed.data.RATE_LIMIT_API_MAX, windowMs: parsed.data.RATE_LIMIT_API_WINDOW_MS },
    whatsapp: { max: parsed.data.RATE_LIMIT_WHATSAPP_MAX, windowMs: parsed.data.RATE_LIMIT_WHATSAPP_WINDOW_MS },
  },

  upload: {
    dir: parsed.data.UPLOAD_DIR,
    maxFileSize: parsed.data.MAX_FILE_SIZE_BYTES,
  },

  pdf: {
    outputDir: parsed.data.PDF_OUTPUT_DIR,
    watermarkText: parsed.data.PDF_WATERMARK_TEXT,
  },

  whatsapp: {
    accessToken: parsed.data.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: parsed.data.WHATSAPP_PHONE_NUMBER_ID,
    webhookVerifyToken: parsed.data.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
    apiVersion: parsed.data.WHATSAPP_API_VERSION,
    apiBaseUrl: parsed.data.WHATSAPP_API_BASE_URL,
  },

  department: {
    name: parsed.data.DEPARTMENT_NAME,
    shortName: parsed.data.DEPARTMENT_SHORT,
    collegeName: parsed.data.COLLEGE_NAME,
    collegeAddress: parsed.data.COLLEGE_ADDRESS,
  },

  logging: {
    level: parsed.data.LOG_LEVEL,
    file: parsed.data.LOG_FILE,
  },

  fieldEncryptionKey: parsed.data.FIELD_ENCRYPTION_KEY,
};

export type Config = typeof config;

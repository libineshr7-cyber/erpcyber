import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env';
import { sanitizeFilename } from '../utils/crypto';

// Ensure upload directory exists
if (!fs.existsSync(config.upload.dir)) {
  fs.mkdirSync(config.upload.dir, { recursive: true });
}

const ALLOWED_EXCEL_MIMES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
];

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

const ALLOWED_PDF_MIMES = ['application/pdf'];

// Magic bytes for file type verification
const MAGIC_BYTES: Record<string, Buffer[]> = {
  xlsx: [Buffer.from('504B0304', 'hex')], // ZIP (xlsx is a zip)
  pdf: [Buffer.from('25504446', 'hex')],  // %PDF
  jpg: [Buffer.from('FFD8FF', 'hex')],
  png: [Buffer.from('89504E47', 'hex')],
};

function checkMagicBytes(buffer: Buffer, ext: string): boolean {
  const normalizedExt = ext.replace('.', '').toLowerCase();
  const magics = MAGIC_BYTES[normalizedExt];
  if (!magics) return true; // Unknown extension — skip magic byte check
  return magics.some(magic => buffer.slice(0, magic.length).equals(magic));
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.upload.dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${uuidv4()}${ext}`;
    cb(null, safeName);
  },
});

const fileFilter = (allowedMimes: string[], allowedExts: string[]) =>
  (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ): void => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeOk = allowedMimes.includes(file.mimetype);
    const extOk = allowedExts.includes(ext);

    if (!mimeOk || !extOk) {
      cb(new Error(`Invalid file type. Allowed: ${allowedExts.join(', ')}`));
      return;
    }

    // Sanitize the original filename (stored in metadata, not used for saving)
    file.originalname = sanitizeFilename(file.originalname);

    cb(null, true);
  };

/** For Excel/CSV mark imports */
export const excelUpload = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSize, files: 1 },
  fileFilter: fileFilter(ALLOWED_EXCEL_MIMES, ['.xlsx', '.csv']),
});

/** For event poster image uploads */
export const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }, // 5MB for images
  fileFilter: fileFilter(ALLOWED_IMAGE_MIMES, ['.jpg', '.jpeg', '.png', '.webp']),
});

/** General upload for PDF templates */
export const pdfUpload = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSize, files: 1 },
  fileFilter: fileFilter(ALLOWED_PDF_MIMES, ['.pdf']),
});

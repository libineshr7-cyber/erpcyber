import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(3, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const markEntrySchema = z.object({
  marksObtained: z.number().min(0, 'Cannot be negative').max(100, 'Cannot exceed 100'),
  isAbsent: z.boolean(),
});

import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function success<T>(res: Response, data: T, message?: string, statusCode = 200): Response {
  const response: ApiResponse<T> = { success: true, data };
  if (message) response.message = message;
  return res.status(statusCode).json(response);
}

export function created<T>(res: Response, data: T, message?: string): Response {
  return success(res, data, message, 201);
}

export function noContent(res: Response): Response {
  return res.status(204).send();
}

export function paginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number
): Response {
  const totalPages = Math.ceil(total / limit);
  const pagination: PaginationMeta = {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
  const response: ApiResponse<T[]> = { success: true, data, pagination };
  return res.status(200).json(response);
}

export function error(res: Response, message: string, statusCode = 400, details?: unknown): Response {
  const response: ApiResponse = { success: false, error: message };
  if (details && process.env.NODE_ENV === 'development') {
    (response as Record<string, unknown>).details = details;
  }
  return res.status(statusCode).json(response);
}

export function unauthorized(res: Response, message = 'Authentication required'): Response {
  return error(res, message, 401);
}

export function forbidden(res: Response, message = 'Insufficient permissions'): Response {
  return error(res, message, 403);
}

export function notFound(res: Response, message = 'Resource not found'): Response {
  return error(res, message, 404);
}

export function validationError(res: Response, details: unknown): Response {
  return res.status(422).json({ success: false, error: 'Validation failed', details });
}

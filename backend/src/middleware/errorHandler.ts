import { Request, Response, NextFunction } from 'express';
import { error } from '../utils/response';
import logger from '../utils/logger';
import { config } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;

  // Log the full error server-side
  logger.error('Unhandled error', {
    error: err.message,
    stack: config.isProduction ? undefined : err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.userId,
  });

  // In production: never expose internal error details
  const message = config.isProduction && statusCode === 500
    ? 'An internal server error occurred. Please try again later.'
    : err.message || 'An unexpected error occurred';

  error(res, message, statusCode);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  error(res, `Route ${req.method} ${req.path} not found`, 404);
};

export class AppErr extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode = 400, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppErr.prototype);
  }
}

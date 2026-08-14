import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { validationError } from '../utils/response';

type ValidateTarget = 'body' | 'query' | 'params';

/**
 * Validate request data against a Zod schema.
 * Attaches validated, typed data back to req.body / req.query / req.params.
 */
export const validate = (schema: ZodSchema, target: ValidateTarget = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const formatted = (result.error as ZodError).errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      validationError(res, formatted);
      return;
    }

    // Replace with validated/transformed data
    if (target === 'body') req.body = result.data;
    else if (target === 'query') req.query = result.data as Record<string, string>;
    else if (target === 'params') req.params = result.data as Record<string, string>;

    next();
  };
};

import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../errors/app.error';

export function parseBody<T>(schema: ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (err) {
    if (err instanceof ZodError) {
      const first = err.issues[0];
      throw new AppError(first?.message ?? 'Invalid request', 400);
    }
    throw err;
  }
}

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app.error';
import { logger } from '../config/logger';

export function errorMiddleware(
  err: Error,
  _request: Request,
  res: Response,
  _next: NextFunction, //eslint-disable-line
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
    });
  }

  logger.error('Unhandled error: ', err);

  return res.status(500).json({
    message: 'Internal server error',
    info: err.message,
  });
}

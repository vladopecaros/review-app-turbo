import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app.error';
import { logger } from '../config/logger';
import { EnvironmentVariables } from '../helpers/env/environmentVariables';

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

  const isDev = EnvironmentVariables.Environment === 'development';
  return res.status(500).json({
    message: 'Internal server error',
    ...(isDev && { info: err.message }),
  });
}

import { NextFunction, Request, Response } from 'express';
import { logger } from '../config/logger';

export function requestLogMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const level =
      res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger[level](`${req.method} ${req.path}`, {
      statusCode: res.statusCode,
      durationMs,
    });
  });

  next();
}

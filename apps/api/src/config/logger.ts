import winston from 'winston';
import { EnvironmentVariables } from '../helpers/env/environmentVariables';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const isProduction = EnvironmentVariables.Environment === 'production';

/**
 * Human-readable format for development
 */
const devFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  return `${timestamp} [${level}]: ${stack || message} ${
    Object.keys(meta).length ? JSON.stringify(meta) : ''
  }`;
});

/**
 * Create logger
 */
export const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: combine(
    timestamp(),
    errors({ stack: true }),
    isProduction ? json() : combine(colorize(), devFormat),
  ),
  transports: [
    new winston.transports.Console(),

    // File logging (production-safe)
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),

    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
  exitOnError: false,
});

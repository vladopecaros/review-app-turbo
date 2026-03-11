import { Request } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test';

const apiKeyGenerator = (req: Request): string => {
  const apiKey = req.headers['x-api-key'];
  if (typeof apiKey === 'string' && apiKey.length > 0) {
    return apiKey;
  }
  return ipKeyGenerator(req.ip ?? '');
};

const rateLimitMessage = (msg: string) => ({ message: msg });

export const publicReviewSubmitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: apiKeyGenerator,
  skip: () => isTest,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage('Too many requests, please try again later.'),
});

export const publicReviewListLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  keyGenerator: apiKeyGenerator,
  skip: () => isTest,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage('Too many requests, please try again later.'),
});

export const publicProductsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: apiKeyGenerator,
  skip: () => isTest,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage('Too many requests, please try again later.'),
});

export const authLoginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  skip: () => isTest,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage('Too many login attempts, please try again later.'),
});

export const authRegisterLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  skip: () => isTest,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage(
    'Too many registration attempts, please try again later.',
  ),
});

export const authVerifyEmailLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  skip: () => isTest,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage(
    'Too many verification attempts, please try again later.',
  ),
});

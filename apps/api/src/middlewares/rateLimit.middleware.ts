import { Request } from 'express';
import rateLimit, { ipKeyGenerator, Store } from 'express-rate-limit';
import { logger } from '../config/logger';

const isTest = process.env.NODE_ENV === 'test';

// ---------------------------------------------------------------------------
// Optional Redis store — only activated when REDIS_URL is present.
// Falls back to the default in-memory store so the app runs without Redis.
// ---------------------------------------------------------------------------
function buildStore(): Store | undefined {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    logger.info(
      'REDIS_URL not set — using in-memory rate-limit store (single-instance only)',
    );
    return undefined; // express-rate-limit defaults to memory store
  }

  try {
    // Dynamic require so the module is only loaded when Redis is configured.
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- conditional import to avoid loading Redis when not needed
    const { default: RedisStore } = require('rate-limit-redis') as {
      default: new (opts: {
        sendCommand: (...args: string[]) => Promise<unknown>;
        prefix?: string;
      }) => Store;
    };
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- conditional import
    const { Redis } = require('ioredis') as {
      Redis: new (url: string) => {
        call: (...args: string[]) => Promise<unknown>;
      };
    };

    const client = new Redis(redisUrl);

    logger.info('Rate-limit store: Redis', {
      url: redisUrl.replace(/:\/\/[^@]*@/, '://***@'),
    });

    return new RedisStore({
      sendCommand: (...args: string[]) =>
        client.call(...args) as Promise<unknown>,
      prefix: 'rl:',
    });
  } catch (err) {
    logger.error(
      'Failed to initialise Redis rate-limit store — falling back to memory',
      { err },
    );
    return undefined;
  }
}

const store = buildStore();

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
  store,
  message: rateLimitMessage('Too many requests, please try again later.'),
});

export const publicReviewListLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  keyGenerator: apiKeyGenerator,
  skip: () => isTest,
  standardHeaders: true,
  legacyHeaders: false,
  store,
  message: rateLimitMessage('Too many requests, please try again later.'),
});

export const publicProductsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: apiKeyGenerator,
  skip: () => isTest,
  standardHeaders: true,
  legacyHeaders: false,
  store,
  message: rateLimitMessage('Too many requests, please try again later.'),
});

export const authLoginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  skip: () => isTest,
  standardHeaders: true,
  legacyHeaders: false,
  store,
  message: rateLimitMessage('Too many login attempts, please try again later.'),
});

export const authRegisterLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  skip: () => isTest,
  standardHeaders: true,
  legacyHeaders: false,
  store,
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
  store,
  message: rateLimitMessage(
    'Too many verification attempts, please try again later.',
  ),
});

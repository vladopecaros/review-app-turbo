import { Router } from 'express';
import { AuthController } from './auth.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import {
  authLoginLimiter,
  authRegisterLimiter,
  authVerifyEmailLimiter,
} from '../../middlewares/rateLimit.middleware';

export function createAuthRoutes(controller: AuthController): Router {
  const router = Router();

  router.post('/register', authRegisterLimiter, controller.register.bind(controller));
  router.post('/login', authLoginLimiter, controller.login.bind(controller));
  router.post('/refresh', controller.refresh.bind(controller));
  router.post('/logout', requireAuth, controller.logout.bind(controller));
  router.post('/verify-email', authVerifyEmailLimiter, controller.verifyEmail.bind(controller));

  return router;
}

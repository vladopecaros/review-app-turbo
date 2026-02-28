import { Router } from 'express';
import { AuthController } from './auth.controller';
import { requireAuth } from '../../middlewares/auth.middleware';

export function createAuthRoutes(controller: AuthController): Router {
  const router = Router();

  router.post('/register', controller.register.bind(controller));
  router.post('/login', controller.login.bind(controller));
  router.post('/refresh', controller.refresh.bind(controller));
  router.post('/logout', requireAuth, controller.logout.bind(controller));
  router.post('/verify-email', controller.verifyEmail.bind(controller));

  return router;
}

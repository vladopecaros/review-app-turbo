import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { AnalyticsController } from './analytics.controller';

export function createAnalyticsRoutes(controller: AnalyticsController): Router {
  const router = Router({ mergeParams: true });

  router.get('/summary', requireAuth, controller.getSummary.bind(controller));

  return router;
}

import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { AnalyticsController } from './analytics.controller';

export function createAnalyticsRoutes(controller: AnalyticsController): Router {
  const router = Router({ mergeParams: true });

  router.get('/summary', requireAuth, controller.getSummary.bind(controller));
  router.get('/trends', requireAuth, controller.getTrends.bind(controller));
  router.get('/export', requireAuth, controller.getExport.bind(controller));

  return router;
}

import { Router } from 'express';
import { ReviewController } from './review.controller';
import { requireAuth } from '../../middlewares/auth.middleware';

export function createReviewRoutes(controller: ReviewController): Router {
  const router = Router({ mergeParams: true });

  router.get('/', requireAuth, controller.listForOrg.bind(controller));
  router.get('/:reviewId', requireAuth, controller.getOne.bind(controller));
  router.patch(
    '/:reviewId/status',
    requireAuth,
    controller.updateStatus.bind(controller),
  );

  return router;
}

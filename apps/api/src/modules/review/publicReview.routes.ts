import { Router } from 'express';
import { PublicReviewController } from './publicReview.controller';

export function createPublicReviewRoutes(
  controller: PublicReviewController,
): Router {
  const router = Router();

  router.post('/', controller.create.bind(controller));
  router.get('/', controller.list.bind(controller));

  return router;
}

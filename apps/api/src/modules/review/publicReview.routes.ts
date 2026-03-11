import { Router } from 'express';
import { PublicReviewController } from './publicReview.controller';
import {
  publicReviewSubmitLimiter,
  publicReviewListLimiter,
} from '../../middlewares/rateLimit.middleware';

export function createPublicReviewRoutes(
  controller: PublicReviewController,
): Router {
  const router = Router();

  router.post(
    '/',
    publicReviewSubmitLimiter,
    controller.create.bind(controller),
  );
  router.get('/', publicReviewListLimiter, controller.list.bind(controller));

  return router;
}

import { Router } from 'express';
import { ProductController } from './product.controller';
import { publicProductsLimiter } from '../../middlewares/rateLimit.middleware';

export function createPublicProductRoutes(
  controller: ProductController,
): Router {
  const router = Router();

  router.post(
    '/bulk',
    publicProductsLimiter,
    controller.createBulkWithApiKey.bind(controller),
  );

  return router;
}

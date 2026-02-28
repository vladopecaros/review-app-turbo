import { Router } from 'express';
import { ProductController } from './product.controller';

export function createPublicProductRoutes(
  controller: ProductController,
): Router {
  const router = Router();

  router.post('/bulk', controller.createBulkWithApiKey.bind(controller));

  return router;
}

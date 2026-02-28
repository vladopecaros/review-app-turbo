import { Router } from 'express';
import { ProductController } from './product.controller';
import { requireAuth } from '../../middlewares/auth.middleware';

export function createProductRoutes(controller: ProductController): Router {
  const router = Router({ mergeParams: true });

  router.get('/', requireAuth, controller.listForOrganization.bind(controller));
  router.get(
    '/:externalProductId',
    requireAuth,
    controller.getByExternalId.bind(controller),
  );
  router.post('/', requireAuth, controller.create.bind(controller));
  router.put(
    '/:externalProductId',
    requireAuth,
    controller.updateByExternalId.bind(controller),
  );
  router.delete(
    '/:externalProductId',
    requireAuth,
    controller.deleteByExternalId.bind(controller),
  );

  return router;
}

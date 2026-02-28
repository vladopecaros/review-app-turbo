import { Router } from 'express';
import { OrganizationController } from './organization.controller';
import { requireAuth } from '../../middlewares/auth.middleware';

export function createOrganizationRoutes(
  controller: OrganizationController,
): Router {
  const router = Router();

  router.post('/', requireAuth, controller.create.bind(controller));
  router.get('/', requireAuth, controller.getAllForUser.bind(controller));
  router.get('/:id', requireAuth, controller.getById.bind(controller));
  router.post(
    '/:id/invite-user',
    requireAuth,
    controller.inviteUser.bind(controller),
  );
  router.get(
    '/:id/create-api-key',
    requireAuth,
    controller.getApiKey.bind(controller),
  );

  return router;
}

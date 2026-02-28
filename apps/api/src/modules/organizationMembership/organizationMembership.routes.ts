import { Router } from 'express';
import { OrganizationMembershipController } from './organizationMembership.controller';
import { requireAuth } from '../../middlewares/auth.middleware';

export function createOrganizationMembershipRoutes(
  controller: OrganizationMembershipController,
): Router {
  const router = Router();

  router.put(
    '/invitations/:id/accept',
    requireAuth,
    controller.acceptInvite.bind(controller),
  );
  router.put(
    '/invitations/:id/decline',
    requireAuth,
    controller.declineInvite.bind(controller),
  );

  return router;
}

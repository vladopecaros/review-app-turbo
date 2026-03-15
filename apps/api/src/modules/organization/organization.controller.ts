import { Request, Response } from 'express';
import { OrganizationService } from './organization.service';
import { Types } from 'mongoose';
import { logger } from '../../config/logger';
import { AppError } from '../../errors/app.error';
import { parseBody } from '../../validation/parseBody';
import { createOrganizationSchema, inviteUserSchema } from '../../validation/organization.schema';

export class OrganizationController {
  constructor(private readonly org: OrganizationService) {}

  async create(req: Request, res: Response) {
    const { user } = req;
    if (!user?.id) throw new AppError('Unauthorized', 401);

    const { name, slug } = parseBody(createOrganizationSchema, req.body);

    const organization = await this.org.create({
      name,
      slug,
      ownerUserId: new Types.ObjectId(user.id),
    });

    logger.info('Organization Created Successfully', organization);

    return res.status(200).json({ data: { organization } });
  }

  async getAllForUser(req: Request, res: Response) {
    const { user } = req;

    if (!user?.id) throw new AppError('Unauthorized', 401);

    const organizations = await this.org.getAllForUser(
      new Types.ObjectId(user.id),
    );

    return res.status(200).json({ data: { organizations } });
  }

  async getById(req: Request, res: Response) {
    const { user } = req;
    const { id } = req.params;

    if (!user?.id) throw new AppError('Unauthorized', 401);

    if (!Types.ObjectId.isValid(id.toString())) {
      throw new AppError('Organization ID is not in correct format', 400);
    }

    const result = await this.org.getById(
      new Types.ObjectId(id.toString()),
      new Types.ObjectId(user?.id),
    );

    return res.status(200).json({
      data: {
        organization: result.organization,
        membershipStatus: result.membershipStatus,
        invitationId: result.invitationId,
      },
    });
  }

  async inviteUser(req: Request, res: Response) {
    const { user } = req;
    const { id: organizationId } = req.params;

    if (!user?.id) throw new AppError('Unauthorized', 401);

    if (!Types.ObjectId.isValid(organizationId.toString())) {
      throw new AppError('Organization ID is not in correct format', 400);
    }

    const { invitedUserId, invitedUserEmail, invitedUserRole } = parseBody(inviteUserSchema, req.body);

    if (invitedUserId && !Types.ObjectId.isValid(invitedUserId.toString())) {
      throw new AppError('Invited user ID is not in correct format', 400);
    }

    const returnedInvitation = await this.org.inviteUser(
      new Types.ObjectId(user.id),
      invitedUserId ? new Types.ObjectId(invitedUserId) : null,
      invitedUserEmail ? invitedUserEmail.trim() : null,
      new Types.ObjectId(organizationId.toString()),
      invitedUserRole,
    );

    return res.status(200).json({ data: { invitation: returnedInvitation } });
  }

  async getApiKey(req: Request, res: Response) {
    const { user } = req;
    const { id: organizationId } = req.params;

    if (!user?.id) throw new AppError('Unauthorized', 401);

    if (!Types.ObjectId.isValid(organizationId.toString())) {
      throw new AppError('Organization Id not in correct format', 400);
    }

    const key = await this.org.getApiKey(
      new Types.ObjectId(organizationId.toString()),
      new Types.ObjectId(user.id),
    );

    return res.status(200).json({ data: { key } });
  }
}

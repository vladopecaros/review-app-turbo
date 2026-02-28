import { Request, Response } from 'express';
import { OrganizationService } from './organization.service';
import { Types } from 'mongoose';
import { logger } from '../../config/logger';
import { AppError } from '../../errors/app.error';

export class OrganizationController {
  constructor(private readonly org: OrganizationService) {}

  async create(req: Request, res: Response) {
    const { name, slug } = req.body;
    const { user } = req;

    if (!user?.id) {
      return res.status(401).json({
        organization: null,
        message: 'Unauthorized',
      });
    }

    if (!name || !slug) {
      return res.status(400).json({
        organization: null,
        message: 'Organization name and slug are required',
      });
    } else {
      if (name.length < 3) {
        return res.status(400).json({
          organization: null,
          message: 'Organization name must be more than 3 characters long',
        });
      }
      if (slug.length < 3) {
        return res.status(400).json({
          organization: null,
          message: 'Organization slug must be more than 3 characters long',
        });
      }
    }

    const organization = await this.org.create({
      name,
      slug,
      ownerUserId: new Types.ObjectId(user.id),
    });

    logger.info('Organization Created Successfully', organization);

    return res.status(200).json({
      organization,
      message: 'Organization successfully created',
    });
  }

  async getAllForUser(req: Request, res: Response) {
    const { user } = req;

    if (!user?.id) {
      return res.status(401).json({
        organization: null,
        message: 'Unauthorized',
      });
    }

    const organizations = await this.org.getAllForUser(
      new Types.ObjectId(user.id),
    );

    return res.status(200).json({
      organizations,
      message: 'Organizations successfully retrieved for this user',
    });
  }

  async getById(req: Request, res: Response) {
    const { user } = req;
    const { id } = req.params;

    if (!user?.id) {
      return res.status(401).json({
        organization: null,
        message: 'Unauthorized',
      });
    }

    if (!Types.ObjectId.isValid(id.toString())) {
      throw new AppError('Organization ID is not in correct format', 400);
    }

    const organization = await this.org.getById(
      new Types.ObjectId(id.toString()),
      new Types.ObjectId(user?.id),
    );

    return res.status(200).json({
      organization,
      message: 'Successfully retrieved organization',
    });
  }

  async inviteUser(req: Request, res: Response) {
    const { user } = req;
    const { invitedUserId, invitedUserEmail, invitedUserRole } = req.body;
    const { id: organizationId } = req.params;

    if (!user?.id) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    if (
      (!invitedUserId && !invitedUserEmail) ||
      !invitedUserRole ||
      !organizationId
    ) {
      throw new AppError('Missing required fields', 400);
    }

    if (invitedUserRole !== 'admin' && invitedUserRole !== 'member') {
      throw new AppError('Invited user role must be admin or member', 400);
    }

    if (!Types.ObjectId.isValid(organizationId.toString())) {
      throw new AppError('Organization ID is not in correct format', 400);
    }

    if (
      invitedUserEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invitedUserEmail.toString().trim())
    ) {
      throw new AppError('Invited user email is not in correct format', 400);
    }
    if (invitedUserId && !Types.ObjectId.isValid(invitedUserId.toString())) {
      throw new AppError('Invited user ID is not in correct format', 400);
    }

    const returnedInvitation = await this.org.inviteUser(
      new Types.ObjectId(user.id),
      invitedUserId ? new Types.ObjectId(invitedUserId) : null,
      invitedUserEmail
        ? invitedUserEmail.toString().trim().toLowerCase()
        : null,
      new Types.ObjectId(organizationId.toString()),
      invitedUserRole as 'admin' | 'member',
    );

    return res.status(200).json({
      invitation: returnedInvitation,
      message: 'Member invited successfully',
    });
  }

  async getApiKey(req: Request, res: Response) {
    const { user } = req;
    const { id: organizationId } = req.params;

    if (!user?.id) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    if (!Types.ObjectId.isValid(organizationId.toString())) {
      return res.status(400).json({
        message: 'Organization Id not in correct format',
      });
    }

    const key = await this.org.getApiKey(
      new Types.ObjectId(organizationId.toString()),
      new Types.ObjectId(user.id),
    );

    return res.status(200).json({
      key,
      message: 'Api key generated successfully',
    });
  }
}

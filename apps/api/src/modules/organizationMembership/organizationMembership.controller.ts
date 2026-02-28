import { Request, Response } from 'express';
import { OrganizationMembershipService } from './organizationMembership.service';
import { Types } from 'mongoose';

export class OrganizationMembershipController {
  constructor(
    private readonly organizationMembershipService: OrganizationMembershipService,
  ) {}

  async acceptInvite(req: Request, res: Response) {
    const { user } = req;
    const { id } = req.params;

    if (!user?.id) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    if (!id) {
      return res.status(400).json({
        message: 'ID not provided',
      });
    }

    if (!Types.ObjectId.isValid(id.toString())) {
      return res.status(400).json({
        message: 'ID in invalid format',
      });
    }

    await this.organizationMembershipService.acceptInvite(
      new Types.ObjectId(id.toString()),
      new Types.ObjectId(user.id),
    );

    return res.status(200).json({
      message: 'Invitation accepted successfully',
    });
  }

  async declineInvite(req: Request, res: Response) {
    const { user } = req;
    const { id } = req.params;

    if (!user?.id) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    if (!id) {
      return res.status(400).json({
        message: 'ID not provided',
      });
    }

    if (!Types.ObjectId.isValid(id.toString())) {
      return res.status(400).json({
        message: 'ID in invalid format',
      });
    }

    await this.organizationMembershipService.deleteInvitation(
      new Types.ObjectId(id.toString()),
      new Types.ObjectId(user.id),
    );

    return res.status(200).json({
      message: 'Invitation declined successfully',
    });
  }
}

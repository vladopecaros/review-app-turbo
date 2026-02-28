import { Types } from 'mongoose';
import { OrganizationMembershipRepository } from './organizationMembership.repository';
import { AppError } from '../../errors/app.error';

export class OrganizationMembershipService {
  constructor(
    private readonly organizationMemberships: OrganizationMembershipRepository,
  ) {}

  async acceptInvite(invitationId: Types.ObjectId, userId: Types.ObjectId) {
    const result = await this.organizationMemberships.acceptInvite(
      invitationId,
      userId,
    );

    if (result.modifiedCount === 0) {
      throw new AppError('Invitation not found or already processed', 404);
    }
  }

  async deleteInvitation(invitationId: Types.ObjectId, userId: Types.ObjectId) {
    const result = await this.organizationMemberships.deleteMembership(
      invitationId,
      userId,
    );

    if (result.deletedCount === 0) {
      throw new AppError('Invitation not found or already processed', 404);
    }
  }
}

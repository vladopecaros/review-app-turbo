import { ClientSession, Types } from 'mongoose';
import {
  OrganizationMembershipDocument,
  OrganizationMembershipModel,
} from './organizationMembership.model';
import { OrganizationMembership } from './organizationMembership.types';
import { AppError } from '../../errors/app.error';

export class OrganizationMembershipRepository {
  async create(
    data: {
      organizationId: Types.ObjectId;
      userId: Types.ObjectId;
      role: 'owner' | 'admin' | 'member';
      status: 'active' | 'invited';
    },
    session?: ClientSession,
  ) {
    try {
      const organizationMembership = session
        ? (await OrganizationMembershipModel.create([data], { session }))[0]
        : await OrganizationMembershipModel.create(data);

      return this.toDomain(organizationMembership);
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new AppError('This person is already invited', 409);
      }
      throw error;
    }
  }

  //eslint-disable-next-line
  private toDomain(doc: any): OrganizationMembership {
    return {
      _id: doc._id,
      userId: doc.userId.toString(),
      role: doc.role,
      status: doc.status,
    };
  }

  public mapToDomain(
    doc: OrganizationMembershipDocument,
  ): OrganizationMembership {
    return this.toDomain(doc);
  }

  async findForUserId(userId: Types.ObjectId) {
    return OrganizationMembershipModel.find({
      userId: userId,
    });
  }

  async findByIdForUserId(
    organizationId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<OrganizationMembershipDocument | null> {
    const org = await OrganizationMembershipModel.findOne({
      organizationId,
      userId,
      status: 'active',
    });

    return org;
  }

  private isDuplicateKeyError(error: unknown): error is { code: number } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: number }).code === 11000
    );
  }

  async acceptInvite(invitationId: Types.ObjectId, userId: Types.ObjectId) {
    return OrganizationMembershipModel.updateOne(
      { _id: invitationId, userId: userId, status: 'invited' },
      {
        status: 'active',
      },
    );
  }

  async deleteMembership(invitationId: Types.ObjectId, userId: Types.ObjectId) {
    return OrganizationMembershipModel.deleteOne({
      _id: invitationId,
      userId,
      status: 'invited',
    });
  }
}

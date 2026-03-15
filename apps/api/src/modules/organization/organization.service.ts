import mongoose, { Types } from 'mongoose';
import { OrganizationRepository } from './organization.repository';
import { OrganizationMembershipRepository } from '../organizationMembership/organizationMembership.repository';
import { AppError } from '../../errors/app.error';
import { OrganizationMembershipDocument } from '../organizationMembership/organizationMembership.model';
import { EmailService } from '../email/email.service';
import { UserService } from '../user/user.service';
import { logger } from '../../config/logger';

export class OrganizationService {
  private transactionsSupported: boolean | null = null;

  constructor(
    private readonly organizations: OrganizationRepository,
    private readonly organizationMemberships: OrganizationMembershipRepository,
    private readonly emailService: EmailService,
    private readonly userService: UserService,
  ) {}

  async create(input: {
    name: string;
    slug: string;
    ownerUserId: Types.ObjectId;
  }) {
    if (this.transactionsSupported === false) {
      return this.createWithoutTransaction(input);
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const organization = await this.organizations.create(input, session);
      await this.organizationMemberships.create(
        {
          organizationId: organization._id,
          userId: input.ownerUserId,
          role: 'owner',
          status: 'active',
        },
        session,
      );
      await session.commitTransaction();
      this.transactionsSupported = true;
      return organization;
    } catch (error) {
      if (this.isTransactionNotSupportedError(error)) {
        this.transactionsSupported = false;
        return this.createWithoutTransaction(input);
      }
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      await session.endSession();
    }
  }

  private async createWithoutTransaction(input: {
    name: string;
    slug: string;
    ownerUserId: Types.ObjectId;
  }) {
    const organization = await this.organizations.create(input);
    try {
      await this.organizationMemberships.create({
        organizationId: organization._id,
        userId: input.ownerUserId,
        role: 'owner',
        status: 'active',
      });
    } catch (error) {
      try {
        await this.organizations.deleteById(organization._id);
      } catch (rollbackErr) {
        // Best-effort rollback; original error is more actionable.
        logger.error('Orphaned organization after failed membership creation', {
          organizationId: organization._id.toString(),
          rollbackError: rollbackErr instanceof Error ? rollbackErr.message : String(rollbackErr),
        });
      }
      throw error;
    }

    return organization;
  }

  private isTransactionNotSupportedError(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
      return false;
    }
    if (
      !('message' in error) ||
      typeof (error as { message: string }).message !== 'string'
    ) {
      return false;
    }

    const message = (error as { message: string }).message;
    return message.includes(
      'Transaction numbers are only allowed on a replica set member or mongos',
    );
  }

  async getAllForUser(userId: Types.ObjectId) {
    const organizationsForUser =
      await this.organizationMemberships.findForUserId(userId);
    const organizationIds = organizationsForUser.map((m) => m.organizationId);
    return this.organizations.findMultiple(organizationIds);
  }

  async getById(organizationId: Types.ObjectId, userId: Types.ObjectId) {
    const membership =
      await this.organizationMemberships.findAnyByOrganizationIdForUserId(
        organizationId,
        userId,
      );

    if (!membership) {
      throw new AppError('Unauthorized', 403);
    }

    const organization = await this.organizations.findById(organizationId);

    if (!organization) {
      throw new AppError('Organization not found', 404);
    }

    return {
      organization,
      membershipStatus: membership.status,
      invitationId:
        membership.status === 'invited' ? membership._id.toString() : null,
    };
  }

  public async checkOrganizationMembership(
    organizationId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<OrganizationMembershipDocument | null> {
    const orgMembership = await this.organizationMemberships.findByIdForUserId(
      organizationId,
      userId,
    );
    if (!orgMembership || orgMembership.status !== 'active') {
      return null;
    }
    return orgMembership;
  }

  async inviteUser(
    currentUserId: Types.ObjectId,
    invitedUserId: Types.ObjectId | null,
    invitedUserEmail: string | null,
    organizationId: Types.ObjectId,
    invitedUserRole: 'admin' | 'member',
  ) {
    const hasAccess = await this.checkOrganizationMembership(
      organizationId,
      currentUserId,
    );

    if (!hasAccess || hasAccess.role === 'member') {
      throw new AppError('Permission denied', 403);
    }

    let userDetails = null;

    if (invitedUserEmail) {
      userDetails = await this.userService.getUserByEmail(invitedUserEmail);
    } else if (invitedUserId) {
      userDetails = await this.userService.getUserById(invitedUserId);
    }

    if (!userDetails) {
      throw new AppError('User not found', 404);
    }

    const organizationDetails = await this.getById(
      organizationId,
      currentUserId,
    );

    const created = await this.organizationMemberships.create({
      organizationId,
      userId: userDetails._id,
      role: invitedUserRole ?? 'member',
      status: 'invited',
    });

    await this.emailService.sendOrganizationInvite(
      organizationDetails.organization.name,
      invitedUserRole,
      userDetails.email,
      created._id.toString(),
    );

    return created;
  }

  async getApiKey(organizationId: Types.ObjectId, userId: Types.ObjectId) {
    const { key, hash } = this.organizations.createApiKeyPair();

    const hasAccess = await this.checkOrganizationMembership(
      organizationId,
      userId,
    );

    if (!hasAccess || hasAccess.role === 'member') {
      throw new AppError('Permission denied', 403);
    }

    await this.organizations.storeApiKey(hash, organizationId);
    return key;
  }
}

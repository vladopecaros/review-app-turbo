import { Types } from 'mongoose';
import { ProductRepository } from './product.repository';
import { OrganizationService } from '../organization/organization.service';
import { AppError } from '../../errors/app.error';

export class ProductService {
  constructor(
    private readonly products: ProductRepository,
    private readonly orgService: OrganizationService,
  ) {}

  async create(
    product: {
      externalProductId: string;
      organizationId: Types.ObjectId;
      name: string;
      slug: string;
      description?: string;
      active: boolean;
      metadata?: Record<string, unknown>;
    },
    userId: Types.ObjectId,
  ) {
    const hasAccess = await this.orgService.checkOrganizationMembership(
      product.organizationId,
      userId,
    );

    if (!hasAccess) {
      throw new AppError('Unauthorized', 403);
    }

    if (hasAccess.role === 'member') {
      throw new AppError('Permission denied', 403);
    }

    return this.products.create(product);
  }

  async deleteByExternalId(
    externalProductId: string,
    organizationId: Types.ObjectId,
    userId: Types.ObjectId,
  ) {
    const hasAccess = await this.orgService.checkOrganizationMembership(
      organizationId,
      userId,
    );

    if (!hasAccess) {
      throw new AppError('Unauthorized', 403);
    }

    if (hasAccess.role === 'member') {
      throw new AppError('Permission denied', 403);
    }

    const result = await this.products.deleteByExternalId(
      externalProductId,
      organizationId,
    );

    if (result.deletedCount === 0) {
      throw new AppError('Product not found', 404);
    }

    return result;
  }

  async updateByExternalId(
    externalProductId: string,
    organizationId: Types.ObjectId,
    product: {
      name: string;
      slug: string;
      description?: string;
      active: boolean;
      metadata?: Record<string, unknown>;
    },
    userId: Types.ObjectId,
  ) {
    const hasAccess = await this.orgService.checkOrganizationMembership(
      organizationId,
      userId,
    );

    if (!hasAccess) {
      throw new AppError('Unauthorized', 403);
    }

    if (hasAccess.role === 'member') {
      throw new AppError('Permission denied', 403);
    }

    const result = await this.products.updateByExternalId(
      externalProductId,
      organizationId,
      product,
    );

    if (result.matchedCount === 0) {
      throw new AppError('Product not found', 404);
    }

    return result;
  }

  async listForOrganization(
    organizationId: Types.ObjectId,
    userId: Types.ObjectId,
  ) {
    const hasAccess = await this.orgService.checkOrganizationMembership(
      organizationId,
      userId,
    );

    if (!hasAccess) {
      throw new AppError('Unauthorized', 403);
    }

    return this.products.findAllForOrganization(organizationId);
  }

  async getByExternalId(
    externalProductId: string,
    organizationId: Types.ObjectId,
    userId: Types.ObjectId,
  ) {
    const hasAccess = await this.orgService.checkOrganizationMembership(
      organizationId,
      userId,
    );

    if (!hasAccess) {
      throw new AppError('Unauthorized', 403);
    }

    const product = await this.products.findByExternalId(
      externalProductId,
      organizationId,
    );

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return product;
  }
}

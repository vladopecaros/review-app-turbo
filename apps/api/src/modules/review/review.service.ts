import { Types } from 'mongoose';
import { AppError } from '../../errors/app.error';
import { OrganizationService } from '../organization/organization.service';
import { ProductRepository } from '../product/product.repository';
import { ReviewRepository } from './review.repository';
import { ReviewStatus } from './review.types';

export type ReviewScope = 'all' | 'org' | 'product';

export class ReviewService {
  constructor(
    private readonly reviews: ReviewRepository,
    private readonly orgService: OrganizationService,
    private readonly products: ProductRepository,
  ) {}

  async createPublicReview(
    input: {
      productId?: Types.ObjectId;
      rating: number;
      text: string;
      reviewerName: string;
      reviewerEmail: string;
    },
    organizationId: Types.ObjectId,
  ) {
    if (input.productId) {
      const exists = await this.products.existsByIdAndOrganizationId(
        input.productId,
        organizationId,
      );
      if (!exists) {
        throw new AppError('Product not found', 404);
      }
    }

    return this.reviews.create({
      organizationId,
      productId: input.productId,
      rating: input.rating,
      text: input.text,
      reviewerName: input.reviewerName,
      reviewerEmail: input.reviewerEmail,
      status: 'published',
    });
  }

  async listPublic(
    organizationId: Types.ObjectId,
    scope: ReviewScope,
    productId: Types.ObjectId | undefined,
    page: number,
    limit: number,
  ) {
    const filter = {
      organizationId,
      status: 'published',
      ...this.buildScopeFilter(scope, productId),
    };

    return this.reviews.listPublic(filter, page, limit);
  }

  async listForOrg(
    organizationId: Types.ObjectId,
    scope: ReviewScope,
    productId: Types.ObjectId | undefined,
    status: ReviewStatus | undefined,
    page: number,
    limit: number,
    userId: Types.ObjectId,
  ) {
    const hasAccess = await this.orgService.checkOrganizationMembership(
      organizationId,
      userId,
    );

    if (!hasAccess) {
      throw new AppError('Unauthorized', 403);
    }

    const filter: Record<string, unknown> = {
      organizationId,
      ...this.buildScopeFilter(scope, productId),
    };

    if (status) {
      filter.status = status;
    }

    return this.reviews.listForOrg(filter, page, limit);
  }

  async updateStatus(
    organizationId: Types.ObjectId,
    reviewId: Types.ObjectId,
    status: ReviewStatus,
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

    const updated = await this.reviews.updateStatus(
      organizationId,
      reviewId,
      status,
    );

    if (!updated) {
      throw new AppError('Review not found', 404);
    }

    return updated;
  }

  private buildScopeFilter(scope: ReviewScope, productId?: Types.ObjectId) {
    if (scope === 'org') {
      return {
        $or: [{ productId: { $exists: false } }, { productId: null }],
      };
    }

    if (scope === 'product') {
      if (productId) {
        return { productId };
      }
      return { productId: { $exists: true } };
    }

    return {};
  }
}

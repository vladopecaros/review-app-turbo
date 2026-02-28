import { Types } from 'mongoose';
import { AppError } from '../../errors/app.error';
import { OrganizationService } from '../organization/organization.service';
import { ProductRepository } from '../product/product.repository';
import { ReviewRepository } from './review.repository';
import { PublicReview, Review, ReviewStatus } from './review.types';

export type ReviewScope = 'all' | 'org' | 'product';

export class ReviewService {
  constructor(
    private readonly reviews: ReviewRepository,
    private readonly orgService: OrganizationService,
    private readonly products: ProductRepository,
  ) {}

  async createPublicReview(
    input: {
      externalProductId?: string;
      rating: number;
      text: string;
      reviewerName: string;
      reviewerEmail: string;
    },
    organizationId: Types.ObjectId,
  ): Promise<PublicReview> {
    let productId: Types.ObjectId | undefined;

    if (input.externalProductId) {
      const product = await this.products.findByExternalId(
        input.externalProductId,
        organizationId,
      );
      if (!product) {
        throw new AppError('Product not found', 404);
      }
      productId = product._id;
    }

    const created = await this.reviews.create({
      organizationId,
      productId,
      rating: input.rating,
      text: input.text,
      reviewerName: input.reviewerName,
      reviewerEmail: input.reviewerEmail,
      status: 'published',
    });

    return this.toPublicReview(created, input.externalProductId);
  }

  async listPublic(
    organizationId: Types.ObjectId,
    scope: ReviewScope,
    externalProductId: string | undefined,
    page: number,
    limit: number,
  ) {
    const productId = await this.resolveProductId(
      organizationId,
      externalProductId,
    );
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
    externalProductId: string | undefined,
    status: ReviewStatus | undefined,
    rating: number | undefined,
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

    const productId = await this.resolveProductId(
      organizationId,
      externalProductId,
    );
    const filter: Record<string, unknown> = {
      organizationId,
      ...this.buildScopeFilter(scope, productId),
    };

    if (status) {
      filter.status = status;
    }

    if (rating !== undefined) {
      filter.rating = rating;
    }

    return this.reviews.listForOrg(filter, page, limit);
  }

  async getOne(
    organizationId: Types.ObjectId,
    reviewId: Types.ObjectId,
    userId: Types.ObjectId,
  ) {
    const hasAccess = await this.orgService.checkOrganizationMembership(
      organizationId,
      userId,
    );

    if (!hasAccess) {
      throw new AppError('Unauthorized', 403);
    }

    const review = await this.reviews.findOne(organizationId, reviewId, {
      includeProductName: true,
    });

    if (!review) {
      throw new AppError('Review not found', 404);
    }

    return review;
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

  private toPublicReview(
    review: Review,
    externalProductId?: string,
  ): PublicReview {
    return {
      _id: review._id,
      externalProductId: externalProductId ?? review.externalProductId,
      rating: review.rating,
      text: review.text,
      reviewerName: review.reviewerName,
      createdAt: review.createdAt,
    };
  }

  private async resolveProductId(
    organizationId: Types.ObjectId,
    externalProductId: string | undefined,
  ): Promise<Types.ObjectId | undefined> {
    if (!externalProductId) {
      return undefined;
    }

    const product = await this.products.findByExternalId(
      externalProductId,
      organizationId,
    );

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return product._id;
  }
}

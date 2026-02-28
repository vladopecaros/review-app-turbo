import { Types } from 'mongoose';
import { ReviewDocument, ReviewModel } from './review.model';
import { PublicReview, Review } from './review.types';

type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type ListResult<T> = {
  reviews: T[];
  pagination: Pagination;
};

export class ReviewRepository {
  async create(data: {
    organizationId: Types.ObjectId;
    productId?: Types.ObjectId;
    rating: number;
    text: string;
    reviewerName: string;
    reviewerEmail: string;
    status: 'published' | 'pending' | 'rejected';
  }): Promise<Review> {
    const created = await ReviewModel.create(data);
    return this.toDomain(created);
  }

  async listForOrg(
    filter: Record<string, unknown>,
    page: number,
    limit: number,
  ): Promise<ListResult<Review>> {
    const { items, pagination } = await this.listInternal(filter, page, limit);
    return {
      reviews: items.map((doc) => this.toDomain(doc)),
      pagination,
    };
  }

  async listPublic(
    filter: Record<string, unknown>,
    page: number,
    limit: number,
  ): Promise<ListResult<PublicReview>> {
    const { items, pagination } = await this.listInternal(filter, page, limit);
    return {
      reviews: items.map((doc) => this.toPublicDomain(doc)),
      pagination,
    };
  }

  async findOne(
    organizationId: Types.ObjectId,
    reviewId: Types.ObjectId,
  ): Promise<Review | null> {
    const doc = await ReviewModel.findOne({ _id: reviewId, organizationId });
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async updateStatus(
    organizationId: Types.ObjectId,
    reviewId: Types.ObjectId,
    status: 'published' | 'pending' | 'rejected',
  ): Promise<Review | null> {
    const updated = await ReviewModel.findOneAndUpdate(
      { _id: reviewId, organizationId },
      { $set: { status } },
      { new: true },
    );

    if (!updated) {
      return null;
    }

    return this.toDomain(updated);
  }

  private async listInternal(
    filter: Record<string, unknown>,
    page: number,
    limit: number,
  ): Promise<{ items: ReviewDocument[]; pagination: Pagination }> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, limit);
    const skip = (safePage - 1) * safeLimit;

    const [items, total] = await Promise.all([
      ReviewModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit),
      ReviewModel.countDocuments(filter),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / safeLimit);

    return {
      items,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages,
      },
    };
  }

  private toDomain(doc: ReviewDocument): Review {
    return {
      _id: doc._id,
      productId: doc.productId,
      organizationId: doc.organizationId,
      rating: doc.rating,
      text: doc.text,
      reviewerName: doc.reviewerName,
      reviewerEmail: doc.reviewerEmail,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  private toPublicDomain(doc: ReviewDocument): PublicReview {
    return {
      _id: doc._id,
      productId: doc.productId,
      rating: doc.rating,
      text: doc.text,
      reviewerName: doc.reviewerName,
      createdAt: doc.createdAt,
    };
  }
}

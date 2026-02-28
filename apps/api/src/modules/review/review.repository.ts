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
    options?: { includeProductName?: boolean },
  ): Promise<Review | null> {
    const populateFields = options?.includeProductName
      ? 'externalProductId name'
      : 'externalProductId';
    const doc = await ReviewModel.findOne({
      _id: reviewId,
      organizationId,
    }).populate('productId', populateFields);
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
    ).populate('productId', 'externalProductId');

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
        .limit(safeLimit)
        .populate('productId', 'externalProductId'),
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
    const productId = this.getInternalProductId(doc);
    return {
      _id: doc._id,
      productId,
      externalProductId: this.getExternalProductId(doc),
      productName: this.getProductName(doc),
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
      externalProductId: this.getExternalProductId(doc),
      rating: doc.rating,
      text: doc.text,
      reviewerName: doc.reviewerName,
      createdAt: doc.createdAt,
    };
  }

  private getExternalProductId(doc: ReviewDocument): string | undefined {
    const productValue = doc.productId as unknown;
    if (!productValue || typeof productValue !== 'object') {
      return undefined;
    }

    if (!('externalProductId' in productValue)) {
      return undefined;
    }

    const externalProductId = (productValue as { externalProductId?: unknown })
      .externalProductId;
    return typeof externalProductId === 'string'
      ? externalProductId
      : undefined;
  }

  private getProductName(doc: ReviewDocument): string | undefined {
    const productValue = doc.productId as unknown;
    if (!productValue || typeof productValue !== 'object') {
      return undefined;
    }

    if (!('name' in productValue)) {
      return undefined;
    }

    const nameValue = (productValue as { name?: unknown }).name;
    return typeof nameValue === 'string' ? nameValue : undefined;
  }

  private getInternalProductId(
    doc: ReviewDocument,
  ): Types.ObjectId | undefined {
    const productValue = doc.productId as unknown;
    if (!productValue) {
      return undefined;
    }

    if (productValue instanceof Types.ObjectId) {
      return productValue;
    }

    if (
      typeof productValue === 'object' &&
      productValue !== null &&
      '_id' in productValue
    ) {
      const idValue = (productValue as { _id?: unknown })._id;
      if (idValue instanceof Types.ObjectId) {
        return idValue;
      }
      if (typeof idValue === 'string' && Types.ObjectId.isValid(idValue)) {
        return new Types.ObjectId(idValue);
      }
    }

    return undefined;
  }
}

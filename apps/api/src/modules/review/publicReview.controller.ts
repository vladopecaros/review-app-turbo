import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { ReviewService, ReviewScope } from './review.service';
import { Review } from './review.types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class PublicReviewController {
  constructor(private readonly reviews: ReviewService) {}

  async create(req: Request, res: Response) {
    const { apiKeyOrganizationId } = req;
    const { rating, text, reviewerName, reviewerEmail, productId } = req.body;

    if (!apiKeyOrganizationId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (typeof rating !== 'number' || !Number.isInteger(rating)) {
      return res.status(400).json({
        message: 'Rating must be an integer between 1 and 5',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: 'Rating must be an integer between 1 and 5',
      });
    }

    if (typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        message: 'Review text is required',
      });
    }

    if (text.trim().length > 5000) {
      return res.status(400).json({
        message: 'Review text must be 5000 characters or less',
      });
    }

    if (typeof reviewerName !== 'string' || reviewerName.trim().length === 0) {
      return res.status(400).json({
        message: 'Reviewer name is required',
      });
    }

    if (
      typeof reviewerEmail !== 'string' ||
      reviewerEmail.trim().length === 0 ||
      !EMAIL_REGEX.test(reviewerEmail.trim())
    ) {
      return res.status(400).json({
        message: 'Reviewer email must be a valid email address',
      });
    }

    let parsedProductId: Types.ObjectId | undefined;
    if (productId !== undefined && productId !== null) {
      if (!Types.ObjectId.isValid(productId.toString())) {
        return res.status(400).json({
          message: 'Product ID is not in correct format',
        });
      }
      parsedProductId = new Types.ObjectId(productId.toString());
    }

    const created = await this.reviews.createPublicReview(
      {
        productId: parsedProductId,
        rating,
        text: text.trim(),
        reviewerName: reviewerName.trim(),
        reviewerEmail: reviewerEmail.trim().toLowerCase(),
      },
      new Types.ObjectId(apiKeyOrganizationId),
    );

    return res.status(200).json({
      review: this.toPublic(created),
      message: 'Review submitted successfully',
    });
  }

  async list(req: Request, res: Response) {
    const { apiKeyOrganizationId } = req;

    if (!apiKeyOrganizationId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const productIdValue = req.query.productId as string | undefined;
    const scope = this.parseScope(req.query.scope, productIdValue);
    if (!scope) {
      return res.status(400).json({ message: 'Invalid scope value' });
    }

    if (productIdValue && scope !== 'product') {
      return res.status(400).json({
        message: 'productId can only be used with scope=product',
      });
    }

    let productId: Types.ObjectId | undefined;
    if (productIdValue) {
      if (!Types.ObjectId.isValid(productIdValue.toString())) {
        return res.status(400).json({
          message: 'Product ID is not in correct format',
        });
      }
      productId = new Types.ObjectId(productIdValue.toString());
    }

    const { page, limit, error } = this.parsePagination(
      req.query.page,
      req.query.limit,
    );

    if (error) {
      return res.status(400).json({ message: error });
    }

    const result = await this.reviews.listPublic(
      new Types.ObjectId(apiKeyOrganizationId),
      scope,
      productId,
      page,
      limit,
    );

    return res.status(200).json({
      reviews: result.reviews,
      pagination: result.pagination,
      message: 'Reviews fetched successfully',
    });
  }

  private parseScope(value: unknown, productId?: string): ReviewScope | null {
    if (!value) {
      return productId ? 'product' : 'all';
    }

    if (value === 'all' || value === 'org' || value === 'product') {
      return value;
    }

    return null;
  }

  private parsePagination(
    pageValue: unknown,
    limitValue: unknown,
  ): { page: number; limit: number; error?: string } {
    const page = pageValue ? Number(pageValue) : 1;
    const limit = limitValue ? Number(limitValue) : 20;

    if (!Number.isInteger(page) || page < 1) {
      return { page: 1, limit: 20, error: 'Page must be a positive integer' };
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return {
        page,
        limit: 20,
        error: 'Limit must be between 1 and 100',
      };
    }

    return { page, limit };
  }

  private toPublic(review: Review) {
    return {
      _id: review._id,
      productId: review.productId,
      rating: review.rating,
      text: review.text,
      reviewerName: review.reviewerName,
      createdAt: review.createdAt,
    };
  }
}

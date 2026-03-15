import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { AppError } from '../../errors/app.error';
import { ReviewService, ReviewScope } from './review.service';
import { Review, ReviewStatus } from './review.types';
import { parseBody } from '../../validation/parseBody';
import { updateReviewStatusSchema } from '../../validation/review.schema';

export class ReviewController {
  constructor(private readonly reviews: ReviewService) {}

  async listForOrg(req: Request, res: Response) {
    const { user } = req;
    const { organizationId } = req.params;

    if (!user?.id) {
      throw new AppError('Unauthorized', 401);
    }

    if (!organizationId) {
      throw new AppError('Organization ID is required', 400);
    }

    if (!Types.ObjectId.isValid(organizationId.toString())) {
      throw new AppError('Organization ID is not in correct format', 400);
    }

    const externalProductIdValue = req.query.externalProductId as
      | string
      | undefined;
    if (
      externalProductIdValue !== undefined &&
      (typeof externalProductIdValue !== 'string' ||
        externalProductIdValue.trim().length === 0)
    ) {
      throw new AppError('externalProductId must be a non-empty string', 400);
    }

    const externalProductId = externalProductIdValue
      ? externalProductIdValue.trim()
      : undefined;
    const scope = this.parseScope(req.query.scope, externalProductId);
    if (!scope) {
      throw new AppError('Invalid scope value', 400);
    }

    if (externalProductId && scope !== 'product') {
      throw new AppError(
        'externalProductId can only be used with scope=product',
        400,
      );
    }

    const status = this.parseStatus(req.query.status);
    if (status === null) {
      throw new AppError('Invalid status value', 400);
    }

    const rating = this.parseRating(req.query.rating);
    if (rating === null) {
      throw new AppError('Rating must be an integer between 1 and 5', 400);
    }

    const { page, limit, error } = this.parsePagination(
      req.query.page,
      req.query.limit,
    );

    if (error) {
      throw new AppError(error, 400);
    }

    const result = await this.reviews.listForOrg(
      new Types.ObjectId(organizationId.toString()),
      scope,
      externalProductId,
      status,
      rating,
      page,
      limit,
      new Types.ObjectId(user.id),
    );

    return res.status(200).json({
      data: {
        reviews: result.reviews.map((review) => this.toResponse(review)),
        pagination: result.pagination,
      },
    });
  }

  async getOne(req: Request, res: Response) {
    const { user } = req;
    const { organizationId, reviewId } = req.params;

    if (!user?.id) {
      throw new AppError('Unauthorized', 401);
    }

    if (!organizationId || !reviewId) {
      throw new AppError('Organization ID and review ID are required', 400);
    }

    if (!Types.ObjectId.isValid(organizationId.toString())) {
      throw new AppError('Organization ID is not in correct format', 400);
    }

    if (!Types.ObjectId.isValid(reviewId.toString())) {
      throw new AppError('Review ID is not in correct format', 400);
    }

    const review = await this.reviews.getOne(
      new Types.ObjectId(organizationId.toString()),
      new Types.ObjectId(reviewId.toString()),
      new Types.ObjectId(user.id),
    );

    return res.status(200).json({ data: { review: this.toResponse(review) } });
  }

  async updateStatus(req: Request, res: Response) {
    const { user } = req;
    const { organizationId, reviewId } = req.params;

    if (!user?.id) {
      throw new AppError('Unauthorized', 401);
    }

    if (!organizationId || !reviewId) {
      throw new AppError('Organization ID and review ID are required', 400);
    }

    if (!Types.ObjectId.isValid(organizationId.toString())) {
      throw new AppError('Organization ID is not in correct format', 400);
    }

    if (!Types.ObjectId.isValid(reviewId.toString())) {
      throw new AppError('Review ID is not in correct format', 400);
    }

    const { status } = parseBody(updateReviewStatusSchema, req.body);

    const updated = await this.reviews.updateStatus(
      new Types.ObjectId(organizationId.toString()),
      new Types.ObjectId(reviewId.toString()),
      status,
      new Types.ObjectId(user.id),
    );

    return res.status(200).json({ data: { review: this.toResponse(updated) } });
  }

  private parseRating(value: unknown): number | undefined | null {
    if (value === undefined || value === null || value === '') return undefined;
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1 || n > 5) return null;
    return n;
  }

  private parseScope(
    value: unknown,
    externalProductId?: string,
  ): ReviewScope | null {
    if (!value) {
      return externalProductId ? 'product' : 'all';
    }

    if (value === 'all' || value === 'org' || value === 'product') {
      return value;
    }

    return null;
  }

  private parseStatus(value: unknown): ReviewStatus | undefined | null {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (value === 'published' || value === 'pending' || value === 'rejected') {
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

  private toResponse(review: Review) {
    const { productId: _productId, ...payload } = review;
    void _productId;
    return payload;
  }
}

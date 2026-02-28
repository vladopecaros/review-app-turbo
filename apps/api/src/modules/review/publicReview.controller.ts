import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { AppError } from '../../errors/app.error';
import { ReviewService, ReviewScope } from './review.service';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class PublicReviewController {
  constructor(private readonly reviews: ReviewService) {}

  async create(req: Request, res: Response) {
    const { apiKeyOrganizationId } = req;
    const { rating, text, reviewerName, reviewerEmail, externalProductId } =
      req.body;

    if (!apiKeyOrganizationId) {
      throw new AppError('Unauthorized', 401);
    }

    if (typeof rating !== 'number' || !Number.isInteger(rating)) {
      throw new AppError('Rating must be an integer between 1 and 5', 400);
    }

    if (rating < 1 || rating > 5) {
      throw new AppError('Rating must be an integer between 1 and 5', 400);
    }

    if (typeof text !== 'string' || text.trim().length === 0) {
      throw new AppError('Review text is required', 400);
    }

    if (text.trim().length > 5000) {
      throw new AppError('Review text must be 5000 characters or less', 400);
    }

    if (typeof reviewerName !== 'string' || reviewerName.trim().length === 0) {
      throw new AppError('Reviewer name is required', 400);
    }

    if (
      typeof reviewerEmail !== 'string' ||
      reviewerEmail.trim().length === 0 ||
      !EMAIL_REGEX.test(reviewerEmail.trim())
    ) {
      throw new AppError('Reviewer email must be a valid email address', 400);
    }

    if (
      externalProductId !== undefined &&
      externalProductId !== null &&
      (typeof externalProductId !== 'string' ||
        externalProductId.trim().length === 0)
    ) {
      throw new AppError('externalProductId must be a non-empty string', 400);
    }

    const created = await this.reviews.createPublicReview(
      {
        externalProductId:
          externalProductId != null ? externalProductId.trim() : undefined,
        rating,
        text: text.trim(),
        reviewerName: reviewerName.trim(),
        reviewerEmail: reviewerEmail.trim().toLowerCase(),
      },
      new Types.ObjectId(apiKeyOrganizationId),
    );

    return res.status(200).json({
      review: created,
      message: 'Review submitted successfully',
    });
  }

  async list(req: Request, res: Response) {
    const { apiKeyOrganizationId } = req;

    if (!apiKeyOrganizationId) {
      throw new AppError('Unauthorized', 401);
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

    const { page, limit, error } = this.parsePagination(
      req.query.page,
      req.query.limit,
    );

    if (error) {
      throw new AppError(error, 400);
    }

    const result = await this.reviews.listPublic(
      new Types.ObjectId(apiKeyOrganizationId),
      scope,
      externalProductId,
      page,
      limit,
    );

    return res.status(200).json({
      reviews: result.reviews,
      pagination: result.pagination,
      message: 'Reviews fetched successfully',
    });
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

}

import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { ReviewService, ReviewScope } from './review.service';
import { ReviewStatus } from './review.types';

export class ReviewController {
  constructor(private readonly reviews: ReviewService) {}

  async listForOrg(req: Request, res: Response) {
    const { user } = req;
    const { organizationId } = req.params;

    if (!user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!organizationId) {
      return res.status(400).json({
        message: 'Organization ID is required',
      });
    }

    if (!Types.ObjectId.isValid(organizationId.toString())) {
      return res.status(400).json({
        message: 'Organization ID is not in correct format',
      });
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

    const status = this.parseStatus(req.query.status);
    if (status === null) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const { page, limit, error } = this.parsePagination(
      req.query.page,
      req.query.limit,
    );

    if (error) {
      return res.status(400).json({ message: error });
    }

    const result = await this.reviews.listForOrg(
      new Types.ObjectId(organizationId.toString()),
      scope,
      productId,
      status,
      page,
      limit,
      new Types.ObjectId(user.id),
    );

    return res.status(200).json({
      reviews: result.reviews,
      pagination: result.pagination,
      message: 'Reviews fetched successfully',
    });
  }

  async updateStatus(req: Request, res: Response) {
    const { user } = req;
    const { organizationId, reviewId } = req.params;
    const { status } = req.body;

    if (!user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!organizationId || !reviewId) {
      return res.status(400).json({
        message: 'Organization ID and review ID are required',
      });
    }

    if (!Types.ObjectId.isValid(organizationId.toString())) {
      return res.status(400).json({
        message: 'Organization ID is not in correct format',
      });
    }

    if (!Types.ObjectId.isValid(reviewId.toString())) {
      return res.status(400).json({
        message: 'Review ID is not in correct format',
      });
    }

    const parsedStatus = this.parseStatus(status);
    if (!parsedStatus) {
      return res.status(400).json({
        message: 'Status must be one of published, pending, or rejected',
      });
    }

    const updated = await this.reviews.updateStatus(
      new Types.ObjectId(organizationId.toString()),
      new Types.ObjectId(reviewId.toString()),
      parsedStatus,
      new Types.ObjectId(user.id),
    );

    return res.status(200).json({
      review: updated,
      message: 'Review status updated successfully',
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
}

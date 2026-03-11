import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { AppError } from '../../errors/app.error';
import { AnalyticsService } from './analytics.service';

export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  async getSummary(req: Request, res: Response) {
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

    const externalProductId = req.query.externalProductId as string | undefined;

    if (
      externalProductId !== undefined &&
      (typeof externalProductId !== 'string' ||
        externalProductId.trim().length === 0)
    ) {
      throw new AppError('externalProductId must be a non-empty string', 400);
    }

    const summary = await this.analytics.getSummary(
      new Types.ObjectId(organizationId.toString()),
      new Types.ObjectId(user.id),
      externalProductId?.trim(),
    );

    return res.status(200).json({
      data: summary,
      message: 'Analytics summary fetched successfully',
    });
  }
}

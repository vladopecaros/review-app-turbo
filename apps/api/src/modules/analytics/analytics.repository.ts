import { Types, PipelineStage } from 'mongoose';
import { ReviewModel } from '../review/review.model';

export type TrendsGranularity = 'day' | 'week' | 'month';

export interface RatingBucket {
  rating: number;
  count: number;
}

export interface AnalyticsSummary {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: RatingBucket[];
}

export interface TrendBucket {
  period: string;
  count: number;
  averageRating: number;
}

export interface ExportRow {
  createdAt: Date;
  rating: number;
  reviewerName: string;
  text: string;
  status: string;
  externalProductId?: string;
}

export class AnalyticsRepository {
  async getSummary(
    organizationId: Types.ObjectId,
    productId?: Types.ObjectId,
    startDate?: Date,
    endDate?: Date,
  ): Promise<AnalyticsSummary> {
    const dateFilter =
      startDate || endDate
        ? {
            createdAt: {
              ...(startDate ? { $gte: startDate } : {}),
              ...(endDate ? { $lte: endDate } : {}),
            },
          }
        : {};

    const matchStage: PipelineStage.Match = {
      $match: {
        organizationId,
        ...(productId ? { productId } : {}),
        ...dateFilter,
      },
    };

    const facetStage: PipelineStage.Facet = {
      $facet: {
        summary: [
          {
            $group: {
              _id: null,
              totalReviews: { $sum: 1 },
              averageRating: { $avg: '$rating' },
            },
          },
        ],
        distribution: [
          {
            $group: {
              _id: '$rating',
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ],
      },
    };

    const pipeline: PipelineStage[] = [matchStage, facetStage];

    const [result] = await ReviewModel.aggregate(pipeline);

    const summaryDoc = result?.summary?.[0];
    const totalReviews: number = summaryDoc?.totalReviews ?? 0;
    const rawAvg: number | undefined = summaryDoc?.averageRating;
    const averageRating = rawAvg != null ? Math.round(rawAvg * 100) / 100 : 0;

    const rawDistribution: { _id: number; count: number }[] =
      result?.distribution ?? [];
    const distributionMap = new Map(
      rawDistribution.map((d) => [d._id, d.count]),
    );
    const ratingDistribution: RatingBucket[] = [1, 2, 3, 4, 5].map(
      (rating) => ({
        rating,
        count: distributionMap.get(rating) ?? 0,
      }),
    );

    return { totalReviews, averageRating, ratingDistribution };
  }

  async getTrends(
    organizationId: Types.ObjectId,
    granularity: TrendsGranularity,
    productId?: Types.ObjectId,
    startDate?: Date,
    endDate?: Date,
  ): Promise<TrendBucket[]> {
    const dateFilter =
      startDate || endDate
        ? {
            createdAt: {
              ...(startDate ? { $gte: startDate } : {}),
              ...(endDate ? { $lte: endDate } : {}),
            },
          }
        : {};

    const matchStage: PipelineStage.Match = {
      $match: {
        organizationId,
        ...(productId ? { productId } : {}),
        ...dateFilter,
      },
    };

    let dateExpr: unknown;
    if (granularity === 'week') {
      dateExpr = {
        $concat: [
          { $toString: { $isoWeekYear: '$createdAt' } },
          '-W',
          {
            $cond: {
              if: { $lt: [{ $isoWeek: '$createdAt' }, 10] },
              then: {
                $concat: ['0', { $toString: { $isoWeek: '$createdAt' } }],
              },
              else: { $toString: { $isoWeek: '$createdAt' } },
            },
          },
        ],
      };
    } else if (granularity === 'month') {
      dateExpr = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
    } else {
      dateExpr = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    }

    const pipeline: PipelineStage[] = [
      matchStage,
      {
        $group: {
          _id: dateExpr,
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          period: '$_id',
          count: 1,
          averageRating: { $round: ['$averageRating', 2] },
        },
      },
    ];

    return ReviewModel.aggregate<TrendBucket>(pipeline);
  }

  async getExportRows(
    organizationId: Types.ObjectId,
    productId?: Types.ObjectId,
    startDate?: Date,
    endDate?: Date,
    limit = 10001,
  ): Promise<ExportRow[]> {
    const dateFilter =
      startDate || endDate
        ? {
            createdAt: {
              ...(startDate ? { $gte: startDate } : {}),
              ...(endDate ? { $lte: endDate } : {}),
            },
          }
        : {};

    const rows = await ReviewModel.find({
      organizationId,
      ...(productId ? { productId } : {}),
      ...dateFilter,
    })
      .populate<{ productId: { externalProductId: string } | null }>(
        'productId',
        'externalProductId',
      )
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('createdAt rating reviewerName text status productId')
      .lean();

    return rows.map((r) => ({
      createdAt: r.createdAt as Date,
      rating: r.rating,
      reviewerName: r.reviewerName,
      text: r.text,
      status: r.status,
      externalProductId:
        r.productId &&
        typeof r.productId === 'object' &&
        'externalProductId' in r.productId
          ? (r.productId as { externalProductId: string }).externalProductId
          : undefined,
    }));
  }
}

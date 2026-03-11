import { Types, PipelineStage } from 'mongoose';
import { ReviewModel } from '../review/review.model';

export interface RatingBucket {
  rating: number;
  count: number;
}

export interface AnalyticsSummary {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: RatingBucket[];
}

export class AnalyticsRepository {
  async getSummary(
    organizationId: Types.ObjectId,
    productId?: Types.ObjectId,
  ): Promise<AnalyticsSummary> {
    const matchStage: PipelineStage.Match = {
      $match: {
        organizationId,
        ...(productId ? { productId } : {}),
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
}

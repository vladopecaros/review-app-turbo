import { Types } from 'mongoose';
import { AppError } from '../../errors/app.error';
import { OrganizationService } from '../organization/organization.service';
import { ProductRepository } from '../product/product.repository';
import { AnalyticsRepository, AnalyticsSummary } from './analytics.repository';

export class AnalyticsService {
  constructor(
    private readonly analytics: AnalyticsRepository,
    private readonly orgService: OrganizationService,
    private readonly products: ProductRepository,
  ) {}

  async getSummary(
    organizationId: Types.ObjectId,
    userId: Types.ObjectId,
    externalProductId?: string,
  ): Promise<AnalyticsSummary> {
    const membership = await this.orgService.checkOrganizationMembership(
      organizationId,
      userId,
    );

    if (!membership) {
      throw new AppError('Forbidden', 403);
    }

    let productId: Types.ObjectId | undefined;

    if (externalProductId) {
      const product = await this.products.findByExternalId(
        externalProductId,
        organizationId,
      );
      if (!product) {
        throw new AppError('Product not found', 404);
      }
      productId = product._id;
    }

    return this.analytics.getSummary(organizationId, productId);
  }
}

import { Types } from 'mongoose';
import { AppError } from '../../errors/app.error';
import { OrganizationService } from '../organization/organization.service';
import { ProductRepository } from '../product/product.repository';
import {
  AnalyticsRepository,
  AnalyticsSummary,
  TrendBucket,
  TrendsGranularity,
  ExportRow,
} from './analytics.repository';

export class AnalyticsService {
  constructor(
    private readonly analytics: AnalyticsRepository,
    private readonly orgService: OrganizationService,
    private readonly products: ProductRepository,
  ) {}

  private async resolveProductId(
    externalProductId: string | undefined,
    organizationId: Types.ObjectId,
  ): Promise<Types.ObjectId | undefined> {
    if (!externalProductId) return undefined;
    const product = await this.products.findByExternalId(
      externalProductId,
      organizationId,
    );
    if (!product) throw new AppError('Product not found', 404);
    return product._id;
  }

  private async assertMembership(
    organizationId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<void> {
    const membership = await this.orgService.checkOrganizationMembership(
      organizationId,
      userId,
    );
    if (!membership) throw new AppError('Forbidden', 403);
  }

  async getSummary(
    organizationId: Types.ObjectId,
    userId: Types.ObjectId,
    externalProductId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<AnalyticsSummary> {
    await this.assertMembership(organizationId, userId);
    const productId = await this.resolveProductId(
      externalProductId,
      organizationId,
    );
    return this.analytics.getSummary(
      organizationId,
      productId,
      startDate,
      endDate,
    );
  }

  async getTrends(
    organizationId: Types.ObjectId,
    userId: Types.ObjectId,
    granularity: TrendsGranularity,
    externalProductId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<TrendBucket[]> {
    await this.assertMembership(organizationId, userId);
    const productId = await this.resolveProductId(
      externalProductId,
      organizationId,
    );
    return this.analytics.getTrends(
      organizationId,
      granularity,
      productId,
      startDate,
      endDate,
    );
  }

  async getExport(
    organizationId: Types.ObjectId,
    userId: Types.ObjectId,
    externalProductId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ rows: ExportRow[]; truncated: boolean }> {
    await this.assertMembership(organizationId, userId);
    const productId = await this.resolveProductId(
      externalProductId,
      organizationId,
    );
    const rows = await this.analytics.getExportRows(
      organizationId,
      productId,
      startDate,
      endDate,
      10001,
    );
    const truncated = rows.length === 10001;
    return { rows: truncated ? rows.slice(0, 10000) : rows, truncated };
  }
}

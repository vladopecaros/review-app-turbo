import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { AppError } from '../../errors/app.error';
import { AnalyticsService } from './analytics.service';
import { TrendsGranularity } from './analytics.repository';

const VALID_GRANULARITIES: TrendsGranularity[] = ['day', 'week', 'month'];
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

function toScalar(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (Array.isArray(value))
    return value.length > 0 ? String(value[0]) : undefined;
  return typeof value === 'string' ? value : String(value);
}

function parseOptionalDate(
  value: unknown,
  paramName: string,
  options?: { endOfDay?: boolean },
): Date | undefined {
  const str = toScalar(value);
  if (str === undefined) return undefined;
  const trimmed = str.trim();
  if (trimmed.length === 0)
    throw new AppError(`${paramName} must be a non-empty string`, 400);
  const d = new Date(trimmed);
  if (isNaN(d.getTime()))
    throw new AppError(`${paramName} must be a valid ISO date string`, 400);
  if (options?.endOfDay && DATE_ONLY_RE.test(trimmed)) {
    d.setUTCHours(23, 59, 59, 999);
  }
  return d;
}

function parseOptionalExternalProductId(value: unknown): string | undefined {
  const str = toScalar(value);
  if (str === undefined) return undefined;
  if (str.trim().length === 0)
    throw new AppError('externalProductId must be a non-empty string', 400);
  return str.trim();
}

function assertOrgId(organizationId: string | string[] | undefined): void {
  const id = Array.isArray(organizationId) ? organizationId[0] : organizationId;
  if (!id) throw new AppError('Organization ID is required', 400);
  if (!Types.ObjectId.isValid(id))
    throw new AppError('Organization ID is not in correct format', 400);
}

export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  async getSummary(req: Request, res: Response) {
    const { user } = req;
    const { organizationId } = req.params;

    if (!user?.id) throw new AppError('Unauthorized', 401);
    assertOrgId(organizationId);

    const externalProductId = parseOptionalExternalProductId(
      req.query.externalProductId,
    );
    const startDate = parseOptionalDate(req.query.startDate, 'startDate');
    const endDate = parseOptionalDate(req.query.endDate, 'endDate', {
      endOfDay: true,
    });

    const summary = await this.analytics.getSummary(
      new Types.ObjectId(organizationId.toString()),
      new Types.ObjectId(user.id),
      externalProductId,
      startDate,
      endDate,
    );

    return res.status(200).json({
      data: summary,
      message: 'Analytics summary fetched successfully',
    });
  }

  async getTrends(req: Request, res: Response) {
    const { user } = req;
    const { organizationId } = req.params;

    if (!user?.id) throw new AppError('Unauthorized', 401);
    assertOrgId(organizationId);

    const rawGranularity = toScalar(req.query.granularity);
    const granularity: TrendsGranularity =
      rawGranularity === undefined
        ? 'day'
        : VALID_GRANULARITIES.includes(rawGranularity as TrendsGranularity)
          ? (rawGranularity as TrendsGranularity)
          : (() => {
              throw new AppError(
                `granularity must be one of: ${VALID_GRANULARITIES.join(', ')}`,
                400,
              );
            })();

    const externalProductId = parseOptionalExternalProductId(
      req.query.externalProductId,
    );
    const startDate = parseOptionalDate(req.query.startDate, 'startDate');
    const endDate = parseOptionalDate(req.query.endDate, 'endDate', {
      endOfDay: true,
    });

    const trends = await this.analytics.getTrends(
      new Types.ObjectId(organizationId.toString()),
      new Types.ObjectId(user.id),
      granularity,
      externalProductId,
      startDate,
      endDate,
    );

    return res.status(200).json({
      data: trends,
      granularity,
      message: 'Analytics trends fetched successfully',
    });
  }

  async getExport(req: Request, res: Response) {
    const { user } = req;
    const { organizationId } = req.params;

    if (!user?.id) throw new AppError('Unauthorized', 401);
    assertOrgId(organizationId);

    const externalProductId = parseOptionalExternalProductId(
      req.query.externalProductId,
    );
    const startDate = parseOptionalDate(req.query.startDate, 'startDate');
    const endDate = parseOptionalDate(req.query.endDate, 'endDate', {
      endOfDay: true,
    });

    const { rows, truncated } = await this.analytics.getExport(
      new Types.ObjectId(organizationId.toString()),
      new Types.ObjectId(user.id),
      externalProductId,
      startDate,
      endDate,
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="reviews.csv"');
    if (truncated) res.setHeader('X-Export-Truncated', 'true');

    const sanitizeCsvCell = (value: string) => {
      if (/^\s*[=+\-@]/.test(value)) return `'${value}`;
      return value;
    };
    const escape = (v: string) => `"${sanitizeCsvCell(v).replace(/"/g, '""')}"`;

    res.write(
      'createdAt,rating,reviewerName,text,status,externalProductId\r\n',
    );
    for (const row of rows) {
      res.write(
        [
          row?.createdAt?.toISOString() ?? '/',
          row?.rating ?? '/',
          escape(row?.reviewerName ?? '/'),
          escape(row?.text ?? '/'),
          row?.status ?? '/',
          row?.externalProductId ? escape(row?.externalProductId) : '',
        ].join(',') + '\r\n',
      );
    }
    res.end();
  }
}

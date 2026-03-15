import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { ProductService } from './product.service';
import { AppError } from '../../errors/app.error';
import { parseBody } from '../../validation/parseBody';
import {
  bulkProductSchema,
  createProductSchema,
  updateProductSchema,
} from '../../validation/product.schema';

export class ProductController {
  constructor(private readonly products: ProductService) {}

  async listForOrganization(req: Request, res: Response) {
    const { user } = req;
    const { organizationId } = req.params;

    if (!user?.id) throw new AppError('Unauthorized', 401);
    if (!organizationId) throw new AppError('Organization ID is required', 400);
    if (!Types.ObjectId.isValid(organizationId.toString()))
      throw new AppError('Organization ID is not in correct format', 400);

    const products = await this.products.listForOrganization(
      new Types.ObjectId(organizationId.toString()),
      new Types.ObjectId(user.id),
    );

    return res.status(200).json({ data: { products } });
  }

  async getByExternalId(req: Request, res: Response) {
    const { user } = req;
    const { organizationId, externalProductId } = req.params;

    if (!user?.id) throw new AppError('Unauthorized', 401);
    if (!organizationId || !externalProductId)
      throw new AppError(
        'Organization ID and external product id are required',
        400,
      );
    if (!Types.ObjectId.isValid(organizationId.toString()))
      throw new AppError('Organization ID is not in correct format', 400);

    const product = await this.products.getByExternalId(
      externalProductId.toString(),
      new Types.ObjectId(organizationId.toString()),
      new Types.ObjectId(user.id),
    );

    return res.status(200).json({ data: { product } });
  }

  async create(req: Request, res: Response) {
    const { user } = req;
    const { organizationId } = req.params;

    if (!user?.id) throw new AppError('Unauthorized', 401);
    if (!organizationId) throw new AppError('Organization ID is required', 400);
    if (!Types.ObjectId.isValid(organizationId.toString()))
      throw new AppError('Organization ID is not in correct format', 400);

    const { externalProductId, name, slug, description, active, metadata } =
      parseBody(createProductSchema, req.body);

    const product = await this.products.create(
      {
        externalProductId,
        organizationId: new Types.ObjectId(organizationId.toString()),
        name,
        slug,
        description,
        active: typeof active === 'boolean' ? active : true,
        metadata,
      },
      new Types.ObjectId(user.id),
    );

    return res.status(200).json({ data: { product } });
  }

  async createBulkWithApiKey(req: Request, res: Response) {
    const { apiKeyOrganizationId } = req;

    if (!apiKeyOrganizationId) throw new AppError('Unauthorized', 401);

    const { products } = parseBody(bulkProductSchema, req.body);

    const normalizedProducts = products.map((p) => ({
      externalProductId: p.externalProductId.trim(),
      name: p.name.trim(),
      slug: p.slug.trim(),
      description:
        p.description && p.description.trim().length > 0
          ? p.description.trim()
          : undefined,
      active: typeof p.active === 'boolean' ? p.active : true,
      metadata: p.metadata,
    }));

    const result = await this.products.createBulkForOrganization(
      new Types.ObjectId(apiKeyOrganizationId),
      normalizedProducts,
    );

    return res.status(200).json({ data: { result } });
  }

  async updateByExternalId(req: Request, res: Response) {
    const { user } = req;
    const { organizationId, externalProductId } = req.params;

    if (!user?.id) throw new AppError('Unauthorized', 401);
    if (!organizationId || !externalProductId)
      throw new AppError(
        'Organization ID and external product id are required',
        400,
      );
    if (!Types.ObjectId.isValid(organizationId.toString()))
      throw new AppError('Organization ID is not in correct format', 400);

    const { name, slug, description, active, metadata } = parseBody(updateProductSchema, req.body);

    const result = await this.products.updateByExternalId(
      externalProductId.toString(),
      new Types.ObjectId(organizationId.toString()),
      {
        name,
        slug,
        description,
        active,
        metadata,
      },
      new Types.ObjectId(user.id),
    );

    return res.status(200).json({ data: { result } });
  }

  async deleteByExternalId(req: Request, res: Response) {
    const { user } = req;
    const { organizationId, externalProductId } = req.params;

    if (!user?.id) throw new AppError('Unauthorized', 401);
    if (!organizationId || !externalProductId)
      throw new AppError(
        'Organization ID and external product id are required',
        400,
      );
    if (!Types.ObjectId.isValid(organizationId.toString()))
      throw new AppError('Organization ID is not in correct format', 400);

    const result = await this.products.deleteByExternalId(
      externalProductId.toString(),
      new Types.ObjectId(organizationId.toString()),
      new Types.ObjectId(user.id),
    );

    return res.status(200).json({ data: { result } });
  }
}

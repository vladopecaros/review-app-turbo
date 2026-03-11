import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { ProductService } from './product.service';
import { AppError } from '../../errors/app.error';

type BulkProductInput = {
  externalProductId: string;
  name: string;
  slug: string;
  description?: string;
  active: boolean;
  metadata?: Record<string, unknown>;
};

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

    return res.status(200).json({
      products,
      message: 'Products fetched successfully',
    });
  }

  async getByExternalId(req: Request, res: Response) {
    const { user } = req;
    const { organizationId, externalProductId } = req.params;

    if (!user?.id) throw new AppError('Unauthorized', 401);
    if (!organizationId || !externalProductId)
      throw new AppError('Organization ID and external product id are required', 400);
    if (!Types.ObjectId.isValid(organizationId.toString()))
      throw new AppError('Organization ID is not in correct format', 400);

    const product = await this.products.getByExternalId(
      externalProductId.toString(),
      new Types.ObjectId(organizationId.toString()),
      new Types.ObjectId(user.id),
    );

    return res.status(200).json({
      product,
      message: 'Product fetched successfully',
    });
  }

  async create(req: Request, res: Response) {
    const { user } = req;
    const { organizationId } = req.params;
    const { externalProductId, name, slug, description, active, metadata } =
      req.body;

    if (!user?.id) throw new AppError('Unauthorized', 401);
    if (!organizationId) throw new AppError('Organization ID is required', 400);
    if (!Types.ObjectId.isValid(organizationId.toString()))
      throw new AppError('Organization ID is not in correct format', 400);
    if (!externalProductId || !name || !slug)
      throw new AppError('External product id, name, and slug are required', 400);
    if (name.length < 3)
      throw new AppError('Product name must be more than 3 characters long', 400);
    if (slug.length < 3)
      throw new AppError('Product slug must be more than 3 characters long', 400);
    if (active !== undefined && typeof active !== 'boolean')
      throw new AppError('Active must be a boolean value', 400);

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

    return res.status(200).json({
      product,
      message: 'Product successfully created',
    });
  }

  async createBulkWithApiKey(req: Request, res: Response) {
    const { apiKeyOrganizationId } = req;
    const body =
      req.body && typeof req.body === 'object' && !Array.isArray(req.body)
        ? (req.body as Record<string, unknown>)
        : null;
    const products = body?.products;

    if (!apiKeyOrganizationId) throw new AppError('Unauthorized', 401);
    if (!Array.isArray(products) || products.length === 0)
      throw new AppError('Products array is required', 400);
    if (products.length > 500)
      throw new AppError('Products array cannot exceed 500 items', 400);

    const normalizedProducts: BulkProductInput[] = [];

    for (let i = 0; i < products.length; i += 1) {
      const entry = products[i];

      if (typeof entry !== 'object' || entry === null || Array.isArray(entry))
        throw new AppError(`Invalid product payload at index ${i}`, 400);

      const payload = entry as Record<string, unknown>;
      const externalProductId = payload.externalProductId;
      const name = payload.name;
      const slug = payload.slug;
      const description = payload.description;
      const active = payload.active;
      const metadata = payload.metadata;

      if (
        typeof externalProductId !== 'string' ||
        externalProductId.trim().length === 0 ||
        typeof name !== 'string' ||
        name.trim().length < 3 ||
        typeof slug !== 'string' ||
        slug.trim().length < 3
      )
        throw new AppError(`Invalid product payload at index ${i}`, 400);

      if (description !== undefined && typeof description !== 'string')
        throw new AppError(`Invalid product payload at index ${i}`, 400);

      if (active !== undefined && typeof active !== 'boolean')
        throw new AppError(`Invalid product payload at index ${i}`, 400);

      if (
        metadata !== undefined &&
        (typeof metadata !== 'object' ||
          metadata === null ||
          Array.isArray(metadata))
      )
        throw new AppError(`Invalid product payload at index ${i}`, 400);

      normalizedProducts.push({
        externalProductId: externalProductId.trim(),
        name: name.trim(),
        slug: slug.trim(),
        description:
          typeof description === 'string' && description.trim().length > 0
            ? description.trim()
            : undefined,
        active: typeof active === 'boolean' ? active : true,
        metadata: metadata as Record<string, unknown> | undefined,
      });
    }

    const result = await this.products.createBulkForOrganization(
      new Types.ObjectId(apiKeyOrganizationId),
      normalizedProducts,
    );

    return res.status(200).json({
      result,
      message: 'Bulk product sync completed',
    });
  }

  async updateByExternalId(req: Request, res: Response) {
    const { user } = req;
    const { organizationId, externalProductId } = req.params;
    const { name, slug, description, active, metadata } = req.body;

    if (!user?.id) throw new AppError('Unauthorized', 401);
    if (!organizationId || !externalProductId)
      throw new AppError('Organization ID and external product id are required', 400);
    if (!Types.ObjectId.isValid(organizationId.toString()))
      throw new AppError('Organization ID is not in correct format', 400);
    if (!name || !slug)
      throw new AppError('Product name and slug are required', 400);
    if (name.length < 3)
      throw new AppError('Product name must be more than 3 characters long', 400);
    if (slug.length < 3)
      throw new AppError('Product slug must be more than 3 characters long', 400);
    if (typeof active !== 'boolean')
      throw new AppError('Active must be a boolean value', 400);

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

    return res.status(200).json({
      result,
      message: 'Product successfully updated',
    });
  }

  async deleteByExternalId(req: Request, res: Response) {
    const { user } = req;
    const { organizationId, externalProductId } = req.params;

    if (!user?.id) throw new AppError('Unauthorized', 401);
    if (!organizationId || !externalProductId)
      throw new AppError('Organization ID and external product id are required', 400);
    if (!Types.ObjectId.isValid(organizationId.toString()))
      throw new AppError('Organization ID is not in correct format', 400);

    const result = await this.products.deleteByExternalId(
      externalProductId.toString(),
      new Types.ObjectId(organizationId.toString()),
      new Types.ObjectId(user.id),
    );

    return res.status(200).json({
      result,
      message: 'Product successfully deleted',
    });
  }
}

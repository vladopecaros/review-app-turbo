import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { ProductService } from './product.service';

export class ProductController {
  constructor(private readonly products: ProductService) {}

  async listForOrganization(req: Request, res: Response) {
    const { user } = req;
    const { organizationId } = req.params;

    if (!user?.id) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
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

    if (!user?.id) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    if (!organizationId || !externalProductId) {
      return res.status(400).json({
        message: 'Organization ID and external product id are required',
      });
    }

    if (!Types.ObjectId.isValid(organizationId.toString())) {
      return res.status(400).json({
        message: 'Organization ID is not in correct format',
      });
    }

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

    if (!user?.id) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
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

    if (!externalProductId || !name || !slug) {
      return res.status(400).json({
        message: 'External product id, name, and slug are required',
      });
    }

    if (name.length < 3) {
      return res.status(400).json({
        message: 'Product name must be more than 3 characters long',
      });
    }

    if (slug.length < 3) {
      return res.status(400).json({
        message: 'Product slug must be more than 3 characters long',
      });
    }

    if (active !== undefined && typeof active !== 'boolean') {
      return res.status(400).json({
        message: 'Active must be a boolean value',
      });
    }

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

  async updateByExternalId(req: Request, res: Response) {
    const { user } = req;
    const { organizationId, externalProductId } = req.params;
    const { name, slug, description, active, metadata } = req.body;

    if (!user?.id) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    if (!organizationId || !externalProductId) {
      return res.status(400).json({
        message: 'Organization ID and external product id are required',
      });
    }

    if (!Types.ObjectId.isValid(organizationId.toString())) {
      return res.status(400).json({
        message: 'Organization ID is not in correct format',
      });
    }

    if (!name || !slug) {
      return res.status(400).json({
        message: 'Product name and slug are required',
      });
    }

    if (name.length < 3) {
      return res.status(400).json({
        message: 'Product name must be more than 3 characters long',
      });
    }

    if (slug.length < 3) {
      return res.status(400).json({
        message: 'Product slug must be more than 3 characters long',
      });
    }

    if (typeof active !== 'boolean') {
      return res.status(400).json({
        message: 'Active must be a boolean value',
      });
    }

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

    if (!user?.id) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    if (!organizationId || !externalProductId) {
      return res.status(400).json({
        message: 'Organization ID and external product id are required',
      });
    }

    if (!Types.ObjectId.isValid(organizationId.toString())) {
      return res.status(400).json({
        message: 'Organization ID is not in correct format',
      });
    }

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

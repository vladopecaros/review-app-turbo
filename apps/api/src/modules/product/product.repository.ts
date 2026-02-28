import { Types } from 'mongoose';
import { AppError } from '../../errors/app.error';
import { ProductDocument, ProductModel } from './product.model';
import { Product } from './product.types';

export class ProductRepository {
  async create(product: {
    externalProductId: string;
    organizationId: Types.ObjectId;
    name: string;
    slug: string;
    description?: string;
    active: boolean;
    metadata?: Record<string, unknown>;
  }) {
    try {
      const createdProduct = await ProductModel.create(product);
      return this.toDomain(createdProduct);
    } catch (error) {
      const duplicateMessage = this.getDuplicateKeyMessage(error);
      if (duplicateMessage) {
        throw new AppError(duplicateMessage, 409);
      }
      throw error;
    }
  }

  async deleteByExternalId(
    externalProductId: string,
    organizationId: Types.ObjectId,
  ) {
    return ProductModel.deleteOne({ externalProductId, organizationId });
  }

  async updateByExternalId(
    externalProductId: string,
    organizationId: Types.ObjectId,
    data: {
      name: string;
      slug: string;
      description?: string;
      active: boolean;
      metadata?: Record<string, unknown>;
    },
  ) {
    try {
      return await ProductModel.updateOne(
        { externalProductId, organizationId },
        { $set: data },
        { runValidators: true },
      );
    } catch (error) {
      const duplicateMessage = this.getDuplicateKeyMessage(error);
      if (duplicateMessage) {
        throw new AppError(duplicateMessage, 409);
      }
      throw error;
    }
  }

  async findAllForOrganization(organizationId: Types.ObjectId) {
    return ProductModel.find({ organizationId }).sort({ createdAt: -1 });
  }

  async findByExternalId(
    externalProductId: string,
    organizationId: Types.ObjectId,
  ) {
    return ProductModel.findOne({ externalProductId, organizationId });
  }

  async existsByIdAndOrganizationId(
    productId: Types.ObjectId,
    organizationId: Types.ObjectId,
  ): Promise<boolean> {
    const found = await ProductModel.exists({
      _id: productId,
      organizationId,
    });
    return Boolean(found);
  }

  private isDuplicateKeyError(error: unknown): error is { code: number } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: number }).code === 11000
    );
  }

  private getDuplicateKeyMessage(error: unknown): string | null {
    if (!this.isDuplicateKeyError(error)) {
      return null;
    }

    if (typeof error === 'object' && error !== null) {
      const keyPattern = (error as { keyPattern?: Record<string, unknown> })
        .keyPattern;
      if (keyPattern && typeof keyPattern === 'object') {
        if ('slug' in keyPattern) {
          return 'Product with this slug already exists';
        }
        if ('externalProductId' in keyPattern) {
          return 'Product with this external product id already exists';
        }
      }

      const keyValue = (error as { keyValue?: Record<string, unknown> })
        .keyValue;
      if (keyValue && typeof keyValue === 'object') {
        if ('slug' in keyValue) {
          return 'Product with this slug already exists';
        }
        if ('externalProductId' in keyValue) {
          return 'Product with this external product id already exists';
        }
      }
    }

    return 'Product already exists';
  }

  private toDomain(doc: ProductDocument): Product {
    return {
      _id: doc._id,
      externalProductId: doc.externalProductId,
      organizationId: doc.organizationId,
      name: doc.name,
      slug: doc.slug,
      description: doc.description,
      active: doc.active,
      metadata: doc.metadata,
    };
  }
}

import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { createMetadataField } from '../../helpers/metadataFieldHelper';

export interface ProductDocument extends Document {
  externalProductId: string;
  organizationId: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  active: boolean;
  metadata?: Record<string, unknown>;
}

const productSchema = new Schema<ProductDocument>(
  {
    externalProductId: {
      type: String,
      required: true,
      trim: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
    },
    metadata: createMetadataField({ maxBytes: 128 * 1024 }),
  },
  {
    timestamps: true,
  },
);

productSchema.index({ organizationId: 1, slug: 1 }, { unique: true });
productSchema.index(
  { organizationId: 1, externalProductId: 1 },
  { unique: true },
);

export const ProductModel: Model<ProductDocument> =
  mongoose.models.Product ||
  mongoose.model<ProductDocument>('Product', productSchema);

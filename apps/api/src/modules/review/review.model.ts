import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type ReviewStatus = 'published' | 'pending' | 'rejected';

export interface ReviewDocument extends Document {
  productId?: Types.ObjectId;
  organizationId: Types.ObjectId;
  rating: number;
  text: string;
  reviewerName: string;
  reviewerEmail: string;
  status: ReviewStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

const reviewSchema = new Schema<ReviewDocument>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: false,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    reviewerName: {
      type: String,
      required: true,
      trim: true,
    },
    reviewerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['published', 'pending', 'rejected'],
      default: 'published',
    },
  },
  {
    timestamps: true,
  },
);

reviewSchema.index({ organizationId: 1, createdAt: -1 });
reviewSchema.index(
  { organizationId: 1, productId: 1, status: 1 },
  {
    partialFilterExpression: { productId: { $exists: true } },
  },
);

export const ReviewModel: Model<ReviewDocument> =
  mongoose.models.Review ||
  mongoose.model<ReviewDocument>('Review', reviewSchema);

import { Types } from 'mongoose';

export type ReviewStatus = 'published' | 'pending' | 'rejected';

export interface Review {
  _id: Types.ObjectId;
  productId?: Types.ObjectId;
  externalProductId?: string;
  productName?: string;
  organizationId: Types.ObjectId;
  rating: number;
  text: string;
  reviewerName: string;
  reviewerEmail: string;
  status: ReviewStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PublicReview {
  _id: Types.ObjectId;
  externalProductId?: string;
  rating: number;
  text: string;
  reviewerName: string;
  createdAt?: Date;
}

import { Types } from 'mongoose';

export interface Product {
  _id: Types.ObjectId;
  externalProductId: string;
  organizationId: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  active: boolean;
  metadata?: Record<string, unknown>;
}

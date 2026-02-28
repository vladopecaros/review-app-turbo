import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export interface OrganizationDocument extends Document {
  name: string;
  ownerUserId: Types.ObjectId;
  slug: string;
  apiKey: string;
}

const organizationSchema = new Schema<OrganizationDocument>(
  {
    name: {
      type: String,
      required: true,
    },
    ownerUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    apiKey: {
      type: String,
      required: false,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

export const OrganizationModel: Model<OrganizationDocument> =
  mongoose.models.Organization ||
  mongoose.model<OrganizationDocument>('Organization', organizationSchema);

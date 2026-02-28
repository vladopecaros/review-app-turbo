import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface OrganizationMembershipDocument extends Document {
  organizationId: Types.ObjectId;
  userId: Types.ObjectId;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'invited';
}

const organizationMembershipSchema = new Schema<OrganizationMembershipDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'invited'],
      default: 'active',
    },
  },
  { timestamps: true },
);

organizationMembershipSchema.index(
  { organizationId: 1, userId: 1 },
  { unique: true },
);

export const OrganizationMembershipModel: Model<OrganizationMembershipDocument> =
  mongoose.models.OrganizationMembership ||
  mongoose.model<OrganizationMembershipDocument>(
    'OrganizationMembership',
    organizationMembershipSchema,
  );

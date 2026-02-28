import { Types } from 'mongoose';

export interface OrganizationMembership {
  _id: Types.ObjectId;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'invited';
}

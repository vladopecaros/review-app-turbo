import { Types } from 'mongoose';

export interface Organization {
  _id: Types.ObjectId;
  name: string;
  slug: string;
}

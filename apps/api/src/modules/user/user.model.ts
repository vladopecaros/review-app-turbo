import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface UserDocument extends Document {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: 'user' | 'organization-admin' | 'admin';
  comparePasswords(candidate: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
  refreshTokens: [
    {
      tokenHash: string;
      expiresAt: Date;
      createdAt: Date;
      /** All tokens from the same login session share a familyId.
       *  If a rotated-out token is replayed, the whole family is invalidated. */
      familyId: string;
    },
  ];
  /** Recently rotated-out token hashes kept to detect replay attacks (capped at 20). */
  usedTokenHashes: [
    {
      tokenHash: string;
      familyId: string;
      usedAt: Date;
    },
  ];
  emailVerified: boolean;
  emailVerificationToken: string;
  emailVerificationTokenExpiresAt: Date;
  /** Consecutive failed login attempts since the last successful login. */
  failedLoginAttempts: number;
  /** Account is locked until this timestamp; null = not locked. */
  lockedUntil: Date | null;
}

const userSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'user', 'organization-admin'],
      default: 'user',
    },
    firstName: {
      type: String,
      required: false,
    },
    lastName: {
      type: String,
      required: false,
    },
    refreshTokens: [
      {
        tokenHash: {
          type: String,
          required: true,
        },
        expiresAt: {
          type: Date,
          required: true,
        },
        createdAt: {
          type: Date,
          required: true,
          default: Date.now,
        },
        familyId: {
          type: String,
          required: true,
        },
      },
    ],
    usedTokenHashes: [
      {
        tokenHash: { type: String, required: true },
        familyId: { type: String, required: true },
        usedAt: { type: Date, required: true, default: Date.now },
      },
    ],
    emailVerified: {
      required: true,
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      required: false,
      type: String,
      select: false,
    },
    emailVerificationTokenExpiresAt: {
      required: false,
      type: Date,
      select: false,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const saltRounds = 12;
  this.password = await bcrypt.hash(this.password, saltRounds);
});

userSchema.methods.comparePasswords = async function (
  candidate: string,
): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const UserModel: Model<UserDocument> =
  mongoose.models.user || mongoose.model<UserDocument>('User', userSchema);

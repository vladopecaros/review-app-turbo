import { Types } from 'mongoose';
import { AppError } from '../../errors/app.error';
import { hashRefreshToken } from '../../utils/refreshToken';
import { UserDocument, UserModel } from './user.model';
import { User } from './user.types';
import crypto from 'crypto';

export class UserRepository {
  async create(data: { email: string; password: string }): Promise<User> {
    try {
      const user = await UserModel.create(data);
      return this.toDomain(user);
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new AppError('User with this email already exists', 409);
      }
      throw error;
    }
  }

  async findByEmail(email: string) {
    return UserModel.findOne({ email }).select('+password');
  }

  async findById(id: Types.ObjectId) {
    return UserModel.findOne({ _id: id });
  }

  async addRefreshToken(userId: string, refreshToken: string, expiresAt: Date) {
    const tokenHash = hashRefreshToken(refreshToken);
    await UserModel.updateOne(
      { _id: userId },
      { $push: { refreshTokens: { tokenHash, expiresAt } } },
    );
  }

  async findByRefreshToken(token: string) {
    const tokenHash = hashRefreshToken(token);
    return await UserModel.findOne({ 'refreshTokens.tokenHash': tokenHash });
  }

  async removeRefreshToken(userId: string, refreshToken: string) {
    const tokenHash = hashRefreshToken(refreshToken);
    await UserModel.updateOne(
      { _id: userId },
      { $pull: { refreshTokens: { tokenHash } } },
    );
  }

  async rotateRefreshToken(
    userId: string,
    oldToken: string,
    newToken: string,
    newExpiresAt: Date,
  ) {
    const oldHash = hashRefreshToken(oldToken);
    const newHash = hashRefreshToken(newToken);

    // Use an update pipeline to atomically remove + add without path conflicts.
    await UserModel.updateOne(
      { _id: userId },
      [
        {
          $set: {
            refreshTokens: {
              $concatArrays: [
                {
                  $filter: {
                    input: '$refreshTokens',
                    as: 'token',
                    cond: { $ne: ['$$token.tokenHash', oldHash] },
                  },
                },
                [{ tokenHash: newHash, expiresAt: newExpiresAt }],
              ],
            },
          },
        },
      ],
      { updatePipeline: true },
    );
  }

  async findValidRefreshToken(
    token: string,
  ): Promise<{ user: UserDocument; expiresAt: Date } | null> {
    const tokenHash = hashRefreshToken(token);

    const user = await UserModel.findOne({
      'refreshTokens.tokenHash': tokenHash,
    });

    if (!user) return null;

    const entry = user.refreshTokens.find((t) => t.tokenHash === tokenHash);

    if (!entry) return null;

    return {
      user,
      expiresAt: entry.expiresAt,
    };
  }

  //eslint-disable-next-line
  private toDomain(doc: any): User {
    return {
      id: doc._id.toString(),
      email: doc.email,
      role: doc.role,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  public mapToDomain(doc: UserDocument): User {
    return this.toDomain(doc);
  }

  async setEmailVerificationToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ) {
    await UserModel.updateOne(
      { _id: userId },
      {
        emailVerificationToken: tokenHash,
        emailVerificationTokenExpiresAt: expiresAt,
      },
    );
  }

  async findByEmailVerificationToken(token: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    return UserModel.findOne({
      emailVerificationToken: hashedToken,
    }).select('+emailVerificationToken +emailVerificationTokenExpiresAt');
  }

  async verifyEmail(userId: string) {
    await UserModel.updateOne(
      { _id: userId },
      {
        emailVerified: true,
        $unset: {
          emailVerificationToken: 1,
          emailVerificationTokenExpiresAt: 1,
        },
      },
    );
  }

  private isDuplicateKeyError(error: unknown): error is { code: number } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: number }).code === 11000
    );
  }
}

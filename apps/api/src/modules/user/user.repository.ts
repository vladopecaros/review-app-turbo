import { Types } from 'mongoose';
import { AppError } from '../../errors/app.error';
import { hashRefreshToken } from '../../utils/refreshToken';
import { UserDocument, UserModel } from './user.model';
import { User } from './user.types';
import crypto from 'crypto';

/** How many rotated-out token hashes to remember per user for replay detection. */
const MAX_USED_HASHES = 20;

/** Consecutive failures before the account is temporarily locked. */
const MAX_FAILED_ATTEMPTS = 5;

/** Lock duration in milliseconds (15 minutes). */
const LOCK_DURATION_MS = 15 * 60 * 1000;

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
    return UserModel.findOne({ email }).select(
      '+password +failedLoginAttempts +lockedUntil',
    );
  }

  async findById(id: Types.ObjectId) {
    return UserModel.findOne({ _id: id });
  }

  async addRefreshToken(
    userId: string,
    refreshToken: string,
    expiresAt: Date,
    familyId: string,
  ) {
    const tokenHash = hashRefreshToken(refreshToken);
    await UserModel.updateOne(
      { _id: userId },
      { $push: { refreshTokens: { tokenHash, expiresAt, familyId } } },
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
    familyId: string,
  ) {
    const oldHash = hashRefreshToken(oldToken);
    const newHash = hashRefreshToken(newToken);

    // Atomically: remove the old token, add the new token (same familyId),
    // and prepend the old hash to usedTokenHashes (capped at MAX_USED_HASHES).
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
                [{ tokenHash: newHash, expiresAt: newExpiresAt, familyId }],
              ],
            },
            usedTokenHashes: {
              $slice: [
                {
                  $concatArrays: [
                    [{ tokenHash: oldHash, familyId, usedAt: new Date() }],
                    '$usedTokenHashes',
                  ],
                },
                MAX_USED_HASHES,
              ],
            },
          },
        },
      ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Mongoose typings don't expose updatePipeline option
      { updatePipeline: true } as any,
    );
  }

  /** Invalidate all refresh tokens and used-hash records for a compromised family. */
  async invalidateTokenFamily(userId: string, familyId: string) {
    await UserModel.updateOne(
      { _id: userId },
      [
        {
          $set: {
            refreshTokens: {
              $filter: {
                input: '$refreshTokens',
                as: 't',
                cond: { $ne: ['$$t.familyId', familyId] },
              },
            },
            usedTokenHashes: {
              $filter: {
                input: '$usedTokenHashes',
                as: 'u',
                cond: { $ne: ['$$u.familyId', familyId] },
              },
            },
          },
        },
      ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Mongoose typings don't expose updatePipeline option
      { updatePipeline: true } as any,
    );
  }

  async findValidRefreshToken(
    token: string,
  ): Promise<{ user: UserDocument; expiresAt: Date; familyId: string } | null> {
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
      familyId: entry.familyId,
    };
  }

  /**
   * Returns the familyId if the given token hash is found in the
   * recently-rotated list, indicating a replay attack.
   */
  async findUsedTokenHash(
    token: string,
  ): Promise<{ userId: string; familyId: string } | null> {
    const tokenHash = hashRefreshToken(token);

    const user = await UserModel.findOne({
      'usedTokenHashes.tokenHash': tokenHash,
    });

    if (!user) return null;

    const entry = user.usedTokenHashes.find((t) => t.tokenHash === tokenHash);
    if (!entry) return null;

    return { userId: user._id.toString(), familyId: entry.familyId };
  }

  // ── Account lockout ───────────────────────────────────────────────────────

  async recordFailedLogin(
    userId: string,
  ): Promise<{ lockedUntil: Date | null }> {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $inc: { failedLoginAttempts: 1 } },
      { new: true },
    );

    if (!user) return { lockedUntil: null };

    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
      await UserModel.updateOne({ _id: userId }, { lockedUntil });
      return { lockedUntil };
    }

    return { lockedUntil: null };
  }

  async clearFailedLoginAttempts(userId: string): Promise<void> {
    await UserModel.updateOne(
      { _id: userId },
      { failedLoginAttempts: 0, lockedUntil: null },
    );
  }

  // ── Shared helpers ────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Mongoose lean() and populate() results lose their Document type; `any` used intentionally to map raw doc fields
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

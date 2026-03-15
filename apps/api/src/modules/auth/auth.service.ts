import { UserRepository } from '../user/user.repository';
import { signAccessToken } from '../../utils/jwt';
import { generateRefreshToken } from '../../utils/refreshToken';
import { UserRole } from '../user/user.types';
import { AppError } from '../../errors/app.error';
import { generateEmailVerificationToken } from '../../utils/emailVerification';
import { EmailService } from '../email/email.service';
import { EnvironmentVariables } from '../../helpers/env/environmentVariables';
import { logger } from '../../config/logger';
import crypto from 'crypto';

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly emailService: EmailService,
  ) {}

  async register(input: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) {
    const newUser = await this.users.create(input);

    const { token, tokenHash, expiresAt } = generateEmailVerificationToken();

    await this.users.setEmailVerificationToken(
      newUser.id,
      tokenHash,
      expiresAt,
    );

    await this.emailService.sendVerificationEmail(newUser.email, token);

    logger.info('User registered', { userId: newUser.id });
    return {
      user: newUser,
      accessToken: null,
      refreshToken: null,
    };
  }

  async login(input: { email: string; password: string }) {
    const foundUser = await this.users.findByEmail(input.email);
    if (!foundUser) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check account lockout before validating the password so we don't leak
    // whether the account exists via timing differences.
    if (foundUser.lockedUntil && foundUser.lockedUntil > new Date()) {
      throw new AppError(
        'Account temporarily locked due to too many failed attempts. Please try again later.',
        429,
      );
    }

    if (!foundUser.emailVerified) {
      throw new AppError('Email not verified', 403);
    }

    const passwordMatch = await foundUser.comparePasswords(input.password);

    if (!passwordMatch) {
      await this.users.recordFailedLogin(foundUser._id.toString());
      throw new AppError('Invalid credentials', 401);
    }

    // Successful login — reset lockout counters
    await this.users.clearFailedLoginAttempts(foundUser._id.toString());

    const userId = foundUser.id.toString();
    const familyId = crypto.randomUUID();

    const { accessToken, refreshToken, refreshTokenExpiry } = this.issueTokens({
      id: userId,
      role: foundUser.role,
    });

    await this.users.addRefreshToken(
      userId,
      refreshToken,
      refreshTokenExpiry,
      familyId,
    );

    logger.info('User logged in', { userId });
    return {
      accessToken,
      refreshToken,
      user: this.users.mapToDomain(foundUser),
    };
  }

  async refresh(refreshToken: string) {
    // Detect replay: if the token hash is in the recently-rotated list the
    // original token may have been stolen.  Invalidate the whole family.
    const usedEntry = await this.users.findUsedTokenHash(refreshToken);
    if (usedEntry) {
      logger.warn('Refresh token replay detected — invalidating family', {
        familyId: usedEntry.familyId,
        userId: usedEntry.userId,
      });
      await this.users.invalidateTokenFamily(
        usedEntry.userId,
        usedEntry.familyId,
      );
      throw new AppError('Invalid credentials', 401);
    }

    const result = await this.users.findValidRefreshToken(refreshToken);

    if (!result) {
      throw new AppError('Invalid credentials', 401);
    }

    const { user, expiresAt, familyId } = result;

    const tokenExpired = this.isExpired(expiresAt);
    const userId = user._id.toString();

    if (tokenExpired) {
      await this.users.removeRefreshToken(userId, refreshToken);
      throw new AppError('Refresh token expired', 403);
    }

    const {
      accessToken,
      refreshToken: newToken,
      refreshTokenExpiry,
    } = this.issueTokens({
      id: userId,
      role: user.role,
    });

    await this.users.rotateRefreshToken(
      userId,
      refreshToken,
      newToken,
      refreshTokenExpiry,
      familyId,
    );

    return {
      user: this.users.mapToDomain(user),
      accessToken: accessToken,
      refreshToken: newToken,
    };
  }

  async logout(refreshToken: string) {
    const result = await this.users.findValidRefreshToken(refreshToken);

    if (!result) {
      throw new AppError('Invalid credentials', 401);
    }

    const userId = result.user._id.toString();
    await this.users.removeRefreshToken(userId, refreshToken);

    logger.info('User logged out', { userId });
    return {
      success: true,
    };
  }

  private buildAccessToken(userId: string, role: UserRole) {
    return signAccessToken({ sub: userId, role });
  }

  private getRefreshExpiry() {
    const days = Number(EnvironmentVariables.REFRESH_TOKEN_DAYS ?? 7);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    return expiresAt;
  }

  private issueTokens(user: { id: string; role: UserRole }) {
    const accessToken = this.buildAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken();
    const refreshTokenExpiry = this.getRefreshExpiry();

    return { accessToken, refreshToken, refreshTokenExpiry };
  }

  private isExpired(date: Date): boolean {
    return date.getTime() < Date.now();
  }

  async verifyEmail(token: string) {
    const user = await this.users.findByEmailVerificationToken(token);
    if (!user) {
      throw new AppError('Invalid or expired token', 400);
    }

    if (user.emailVerified) {
      return;
    }

    const expiresAt = user.emailVerificationTokenExpiresAt;
    if (!expiresAt || this.isExpired(expiresAt)) {
      const {
        token: newToken,
        tokenHash,
        expiresAt: newExpiry,
      } = generateEmailVerificationToken();

      await this.users.setEmailVerificationToken(
        user._id.toString(),
        tokenHash,
        newExpiry,
      );

      await this.emailService.sendVerificationEmail(user.email, newToken);

      throw new AppError(
        'Verification link expired. A new email has been sent',
        409,
      );
    }

    await this.users.verifyEmail(user._id.toString());
  }
}

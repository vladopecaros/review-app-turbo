import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { EnvironmentVariables } from '../../helpers/env/environmentVariables';
import { AppError } from '../../errors/app.error';

const refreshCookiesOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: EnvironmentVariables.Environment === 'production',
  path: '/',
};

export class AuthController {
  constructor(private readonly auth: AuthService) {}

  async register(req: Request, res: Response) {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required fields!', 400);
    }

    const user = await this.auth.register({
      email,
      password,
      firstName,
      lastName,
    });

    if (user.refreshToken) {
      res.cookie('refreshToken', user.refreshToken, refreshCookiesOptions);
    }

    return res.status(200).json({
      user: user.user,
      accessToken: user.accessToken,
    });
  }

  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const user = await this.auth.login({ email, password });

    res.cookie('refreshToken', user.refreshToken, refreshCookiesOptions);

    return res.status(200).json({
      user: user.user,
      accessToken: user.accessToken,
    });
  }

  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new AppError('Unauthorized', 401);
    }

    const result = await this.auth.refresh(refreshToken);

    res.cookie('refreshToken', result.refreshToken, refreshCookiesOptions);

    return res.status(200).json({
      user: result.user,
      accessToken: result.accessToken,
    });
  }

  async logout(req: Request, res: Response) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new AppError('Unauthorized', 401);
    }

    await this.auth.logout(refreshToken);
    res.clearCookie('refreshToken', { path: '/' });
    return res.status(200).json({});
  }

  async verifyEmail(req: Request, res: Response) {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      throw new AppError('Invalid token', 400);
    }

    try {
      await this.auth.verifyEmail(token);
    } catch (err) {
      if (err instanceof AppError && err.statusCode === 409) {
        return res.status(409).json({
          message: err.message,
          code: 'EMAIL_VERIFICATION_EXPIRED_RESENT',
        });
      }
      throw err;
    }

    return res.status(201).json({
      message: 'Email verified successfully',
    });
  }
}

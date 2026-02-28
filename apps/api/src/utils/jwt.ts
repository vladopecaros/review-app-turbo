import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { EnvironmentVariables } from '../helpers/env/environmentVariables';

export type AccessTokenPayload = {
  sub: string;
  role: 'user' | 'admin' | 'organization-admin';
};

export function signAccessToken(payload: AccessTokenPayload) {
  const secret: Secret = EnvironmentVariables.JWT_ACCESS_SECRET!;
  const expiresIn: SignOptions['expiresIn'] =
    (EnvironmentVariables.JWT_ACCESS_EXPIRES_IN as StringValue) ?? '15m';

  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyAccessToken(token: string) {
  const secret = EnvironmentVariables.JWT_ACCESS_SECRET!;
  return jwt.verify(token, secret) as AccessTokenPayload;
}

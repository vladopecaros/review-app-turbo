import { User } from '../user/user.types';

export interface AuthTokens {
  accessToken: string;
}

export interface AuthResult {
  user: User;
  tokens: AuthTokens;
}

const env = process.env;

export interface ENVList {
  Environment: string | undefined;
  PORT: string | undefined;
  REFRESH_TOKEN_DAYS: string | undefined;
  SERVER_URL: string | undefined;
  PRODUCT_NAME: string | undefined;
  MONGODB_URL: string | undefined;
  FRONTEND_URL: string | undefined;
  JWT_ACCESS_SECRET: string | undefined;
  JWT_ACCESS_EXPIRES_IN: string | undefined;
  SMTP_HOST: string | undefined;
  SMTP_PORT: string | undefined;
  SMTP_SECURE: string | undefined;
  SMTP_USER: string | undefined;
  SMTP_PASS: string | undefined;
}

export const EnvironmentVariables: ENVList = {
  Environment: env.NODE_ENV,
  PORT: env.PORT,
  REFRESH_TOKEN_DAYS: env.REFRESH_TOKEN_DAYS,
  SERVER_URL: env.SERVER_URL,
  PRODUCT_NAME: env.PRODUCT_NAME,
  MONGODB_URL: env.MONGODB_URL,
  FRONTEND_URL: env.FRONTEND_URL,
  JWT_ACCESS_SECRET: env.JWT_ACCESS_SECRET,
  JWT_ACCESS_EXPIRES_IN: env.JWT_ACCESS_EXPIRES_IN,
  SMTP_HOST: env.SMTP_HOST,
  SMTP_PORT: env.SMTP_PORT,
  SMTP_SECURE: env.SMTP_SECURE,
  SMTP_USER: env.SMTP_USER,
  SMTP_PASS: env.SMTP_PASS,
};

export const OptionalEnvironmentVariables = new Set([
  'REFRESH_TOKEN_DAYS',
  'PRODUCT_NAME',
  'JWT_ACCESS_EXPIRES_IN',
]);

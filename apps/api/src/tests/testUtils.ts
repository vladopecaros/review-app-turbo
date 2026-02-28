import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import sinon from 'sinon';

let mongoServer: MongoMemoryServer | null = null;

export function setTestEnv() {
  process.env.NODE_ENV = 'test';
  process.env.JWT_ACCESS_SECRET = 'test-secret';
  process.env.JWT_ACCESS_EXPIRES_IN = '15m';
  process.env.FRONTEND_URL = 'http://localhost:3000';
  process.env.REFRESH_TOKEN_DAYS = '7';
  process.env.PRODUCT_NAME = 'ReviewApp';
  process.env.SMTP_HOST = 'smtp.test';
  process.env.SMTP_PORT = '2525';
  process.env.SMTP_SECURE = 'false';
  process.env.SMTP_USER = 'user';
  process.env.SMTP_PASS = 'pass';
}

export async function connectTestDb() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGODB_URL = uri;
  await mongoose.connect(uri);
}

export async function disconnectTestDb() {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
}

export async function clearDb() {
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({})),
  );
}

export async function stubMailer() {
  const { mailer } = await import('../config/mailer');
  return sinon.stub(mailer, 'sendMail').resolves();
}

export type MailerStub = sinon.SinonStub;

export function extractVerificationToken(html: string): string {
  const match = html.match(/token=([a-f0-9]{64})/i);
  if (!match) {
    throw new Error('Verification token not found in email html');
  }
  return match[1];
}

export function getCookieValue(
  setCookieHeader: string[] | string | undefined,
  name: string,
): string | null {
  if (!setCookieHeader) return null;
  const headers = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : [setCookieHeader];

  for (const header of headers) {
    const cookiePart = header.split(';')[0]?.trim();
    if (!cookiePart) continue;
    const [cookieName, ...cookieValueParts] = cookiePart.split('=');
    if (cookieName === name) {
      return cookieValueParts.join('=');
    }
  }

  return null;
}

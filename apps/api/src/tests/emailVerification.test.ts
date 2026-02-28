import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { generateEmailVerificationToken } from '../utils/emailVerification';

test('generateEmailVerificationToken returns a token and matching hash', () => {
  const { token, tokenHash, expiresAt } = generateEmailVerificationToken();

  assert.equal(typeof token, 'string');
  assert.equal(token.length, 64);
  assert.equal(typeof tokenHash, 'string');

  const expectedHash = crypto.createHash('sha256').update(token).digest('hex');
  assert.equal(tokenHash, expectedHash);

  const now = Date.now();
  const expires = expiresAt.getTime();
  assert.ok(expires > now);
  assert.ok(expires <= now + 24 * 60 * 60 * 1000 + 2000);
});

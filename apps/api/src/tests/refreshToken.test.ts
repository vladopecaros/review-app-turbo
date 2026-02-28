import test from 'node:test';
import assert from 'node:assert/strict';
import { generateRefreshToken } from '../utils/refreshToken';

test('generateRefreshToken returns random token values', () => {
  const tokenA = generateRefreshToken();
  const tokenB = generateRefreshToken();

  assert.equal(typeof tokenA, 'string');
  assert.equal(typeof tokenB, 'string');
  assert.notEqual(tokenA, tokenB);
  assert.ok(tokenA.length > 20);
});

import test, { before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import supertest from 'supertest';
import type { Express } from 'express';
import {
  setTestEnv,
  connectTestDb,
  disconnectTestDb,
  clearDb,
  stubMailer,
  extractVerificationToken,
  getCookieValue,
  type MailerStub,
} from './testUtils';
import { UserModel } from '../modules/user/user.model';
import { hashRefreshToken } from '../utils/refreshToken';

setTestEnv();

let app: Express;
let request: ReturnType<typeof supertest>;
let mailerStub: MailerStub;

before(async () => {
  await connectTestDb();
  app = (await import('../app')).default;
  request = supertest(app);
});

beforeEach(async () => {
  mailerStub = await stubMailer();
});

afterEach(async () => {
  mailerStub.restore();
  await clearDb();
});

after(async () => {
  await disconnectTestDb();
});

async function registerUser(email: string) {
  return request.post('/auth/register').send({
    email,
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'User',
  });
}

async function registerAndExtractToken(email: string) {
  const callCountBefore = mailerStub.callCount;
  const res = await registerUser(email);

  assert.equal(mailerStub.callCount, callCountBefore + 1);
  const mailArgs = mailerStub.getCall(callCountBefore).args[0] as {
    html: string;
  };
  const token = extractVerificationToken(mailArgs.html);

  return { res, token, mailArgs };
}

async function verifyEmail(token: string) {
  return request.post(`/auth/verify-email?token=${token}`);
}

async function loginUser(email: string) {
  const res = await request.post('/auth/login').send({
    email,
    password: 'Password123!',
  });
  return res;
}

async function createOrganization(accessToken: string, slug = 'test-org') {
  return request
    .post('/organization')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      name: 'Test Organization',
      slug,
    });
}

async function inviteUser(
  accessToken: string,
  organizationId: string,
  invitedUserId: string,
  invitedUserRole: 'admin' | 'member' | 'owner' | string,
) {
  return request
    .post(`/organization/${organizationId}/invite-user`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ invitedUserId, invitedUserRole });
}

async function inviteUserByEmail(
  accessToken: string,
  organizationId: string,
  invitedUserEmail: string,
  invitedUserRole: 'admin' | 'member' | 'owner' | string,
) {
  return request
    .post(`/organization/${organizationId}/invite-user`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ invitedUserEmail, invitedUserRole });
}

async function acceptInvitation(accessToken: string, invitationId: string) {
  return request
    .put(`/organization-memberships/invitations/${invitationId}/accept`)
    .set('Authorization', `Bearer ${accessToken}`);
}

async function createProduct(
  accessToken: string,
  organizationId: string,
  externalProductId: string,
) {
  return request
    .post(`/organization/${organizationId}/products`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      externalProductId,
      name: 'Product Name',
      slug: `product-${externalProductId}`,
      active: true,
    });
}

test('register returns user, null accessToken, and sends verification email', async () => {
  const email = 'user@example.com';
  const res = await registerUser(email);

  assert.equal(res.status, 200);
  assert.equal(res.body.user.email, email);
  assert.equal(res.body.accessToken, null);

  const refreshCookie = getCookieValue(
    res.headers['set-cookie'],
    'refreshToken',
  );
  assert.equal(refreshCookie, null);

  assert.equal(mailerStub.callCount, 1);
  const mailArgs = mailerStub.getCall(0).args[0] as { html: string };
  const token = extractVerificationToken(mailArgs.html);
  assert.equal(token.length, 64);
});

test('verify email succeeds and marks user as verified', async () => {
  const email = 'verified@example.com';
  const { token } = await registerAndExtractToken(email);

  const verifyRes = await verifyEmail(token);
  assert.equal(verifyRes.status, 201);

  const user = await UserModel.findOne({ email });
  assert.ok(user);
  assert.equal(user?.emailVerified, true);
});

test('login is blocked before email verification', async () => {
  const email = 'blocked@example.com';
  await registerAndExtractToken(email);

  const res = await request.post('/auth/login').send({
    email,
    password: 'Password123!',
  });

  assert.equal(res.status, 403);
});

test('login succeeds after verification and returns tokens', async () => {
  const email = 'login@example.com';
  const { token } = await registerAndExtractToken(email);
  await verifyEmail(token);

  const res = await loginUser(email);

  assert.equal(res.status, 200);
  assert.ok(res.body.accessToken);

  const refreshToken = getCookieValue(
    res.headers['set-cookie'],
    'refreshToken',
  );
  assert.ok(refreshToken);
});

test('refresh rotates refresh tokens and returns new access token', async () => {
  const email = 'refresh@example.com';
  const { token } = await registerAndExtractToken(email);
  await verifyEmail(token);

  const loginRes = await loginUser(email);

  const oldRefreshToken = getCookieValue(
    loginRes.headers['set-cookie'],
    'refreshToken',
  );
  assert.ok(oldRefreshToken);

  const refreshRes = await request
    .post('/auth/refresh')
    .set('Cookie', `refreshToken=${oldRefreshToken}`);

  assert.equal(refreshRes.status, 200);
  assert.ok(refreshRes.body.accessToken);

  const newRefreshToken = getCookieValue(
    refreshRes.headers['set-cookie'],
    'refreshToken',
  );
  assert.ok(newRefreshToken);
  assert.notEqual(newRefreshToken, oldRefreshToken);

  const user = await UserModel.findOne({ email });
  assert.ok(user);

  const oldHash = hashRefreshToken(oldRefreshToken!);
  const newHash = hashRefreshToken(newRefreshToken!);
  const hashes = user!.refreshTokens.map((t) => t.tokenHash);

  assert.ok(!hashes.includes(oldHash));
  assert.ok(hashes.includes(newHash));
  assert.equal(user!.refreshTokens.length, 1);
});

test('logout clears refresh token and removes it server-side', async () => {
  const email = 'logout@example.com';
  const { token } = await registerAndExtractToken(email);
  await verifyEmail(token);

  const loginRes = await loginUser(email);

  const accessToken = loginRes.body.accessToken as string;
  const refreshToken = getCookieValue(
    loginRes.headers['set-cookie'],
    'refreshToken',
  );
  assert.ok(accessToken);
  assert.ok(refreshToken);

  const logoutRes = await request
    .post('/auth/logout')
    .set('Authorization', `Bearer ${accessToken}`)
    .set('Cookie', `refreshToken=${refreshToken}`);

  assert.equal(logoutRes.status, 200);

  const setCookieHeader = logoutRes.headers['set-cookie'];
  const setCookie = Array.isArray(setCookieHeader)
    ? setCookieHeader.join(',')
    : (setCookieHeader ?? '');
  assert.ok(setCookie.includes('refreshToken='));
  assert.ok(setCookie.toLowerCase().includes('expires='));

  const user = await UserModel.findOne({ email });
  assert.ok(user);
  assert.equal(user!.refreshTokens.length, 0);
});

test('refresh with invalid token returns 401', async () => {
  const res = await request
    .post('/auth/refresh')
    .set('Cookie', 'refreshToken=invalid');

  assert.equal(res.status, 401);
});

test('refresh with expired token returns 403 and removes token', async () => {
  const email = 'expired-refresh@example.com';
  const { token } = await registerAndExtractToken(email);
  await verifyEmail(token);

  const loginRes = await loginUser(email);

  const refreshToken = getCookieValue(
    loginRes.headers['set-cookie'],
    'refreshToken',
  );
  assert.ok(refreshToken);

  const refreshHash = hashRefreshToken(refreshToken!);
  await UserModel.updateOne(
    { email, 'refreshTokens.tokenHash': refreshHash },
    { $set: { 'refreshTokens.$.expiresAt': new Date(Date.now() - 1000) } },
  );

  const refreshRes = await request
    .post('/auth/refresh')
    .set('Cookie', `refreshToken=${refreshToken}`);

  assert.equal(refreshRes.status, 403);

  const user = await UserModel.findOne({ email });
  assert.ok(user);
  const hashes = user!.refreshTokens.map((t) => t.tokenHash);
  assert.ok(!hashes.includes(refreshHash));
});

test('expired verification token triggers resend and returns 409', async () => {
  const email = 'expired-verify@example.com';
  const { token } = await registerAndExtractToken(email);

  await UserModel.updateOne(
    { email },
    { $set: { emailVerificationTokenExpiresAt: new Date(Date.now() - 1000) } },
  );

  const verifyRes = await verifyEmail(token);
  assert.equal(verifyRes.status, 409);
  assert.equal(verifyRes.body.code, 'EMAIL_VERIFICATION_EXPIRED_RESENT');

  assert.equal(mailerStub.callCount, 2);
  const secondMailArgs = mailerStub.getCall(1).args[0] as { html: string };
  const newToken = extractVerificationToken(secondMailArgs.html);
  assert.notEqual(newToken, token);
});

test('invalid verification token returns 400', async () => {
  const res = await verifyEmail('badtoken');
  assert.equal(res.status, 400);
});

test('protected route rejects missing access token', async () => {
  const res = await request.get('/organization');
  assert.equal(res.status, 401);
});

test('protected route rejects invalid access token', async () => {
  const res = await request
    .get('/organization')
    .set('Authorization', 'Bearer invalid');
  assert.equal(res.status, 401);
});

test('protected route rejects malformed bearer authorization header', async () => {
  const email = 'malformed-bearer@example.com';
  const { token } = await registerAndExtractToken(email);
  await verifyEmail(token);

  const loginRes = await loginUser(email);
  const accessToken = loginRes.body.accessToken as string;

  const res = await request
    .get('/organization')
    .set('Authorization', `Bearer${accessToken}`);

  assert.equal(res.status, 401);
});

test('protected route allows valid access token', async () => {
  const email = 'protected@example.com';
  const { token } = await registerAndExtractToken(email);
  await verifyEmail(token);

  const loginRes = await loginUser(email);
  const accessToken = loginRes.body.accessToken as string;

  const res = await request
    .get('/organization')
    .set('Authorization', `Bearer ${accessToken}`);
  assert.equal(res.status, 200);
});

test('organization invite rejects unsupported role values', async () => {
  const ownerEmail = 'owner-invalid-role@example.com';
  const inviteeEmail = 'invitee-invalid-role@example.com';

  const ownerToken = await registerAndExtractToken(ownerEmail);
  await verifyEmail(ownerToken.token);
  const ownerLogin = await loginUser(ownerEmail);
  const ownerAccessToken = ownerLogin.body.accessToken as string;

  const orgRes = await createOrganization(ownerAccessToken, 'org-invalid-role');
  assert.equal(orgRes.status, 200);
  const organizationId = orgRes.body.organization?._id?.toString();
  assert.ok(organizationId);

  const inviteeToken = await registerAndExtractToken(inviteeEmail);
  await verifyEmail(inviteeToken.token);

  const invitee = await UserModel.findOne({ email: inviteeEmail });
  assert.ok(invitee);

  const inviteRes = await inviteUser(
    ownerAccessToken,
    organizationId!,
    invitee!._id.toString(),
    'owner',
  );

  assert.equal(inviteRes.status, 400);
  assert.equal(
    inviteRes.body.message,
    'Invited user role must be admin or member',
  );
});

test('organization invite accepts invited user email', async () => {
  const ownerEmail = 'owner-email-invite@example.com';
  const inviteeEmail = 'invitee-by-email@example.com';

  const ownerToken = await registerAndExtractToken(ownerEmail);
  await verifyEmail(ownerToken.token);
  const ownerLogin = await loginUser(ownerEmail);
  const ownerAccessToken = ownerLogin.body.accessToken as string;

  const orgRes = await createOrganization(ownerAccessToken, 'org-email-invite');
  assert.equal(orgRes.status, 200);
  const organizationId = orgRes.body.organization?._id?.toString();
  assert.ok(organizationId);

  const inviteeToken = await registerAndExtractToken(inviteeEmail);
  await verifyEmail(inviteeToken.token);

  const inviteRes = await inviteUserByEmail(
    ownerAccessToken,
    organizationId!,
    inviteeEmail,
    'member',
  );

  assert.equal(inviteRes.status, 200);
  assert.ok(inviteRes.body.invitation?._id);
});

test('organization member cannot create or update products', async () => {
  const ownerEmail = 'owner-products-perms@example.com';
  const memberEmail = 'member-products-perms@example.com';

  const ownerToken = await registerAndExtractToken(ownerEmail);
  await verifyEmail(ownerToken.token);
  const ownerLogin = await loginUser(ownerEmail);
  const ownerAccessToken = ownerLogin.body.accessToken as string;

  const orgRes = await createOrganization(
    ownerAccessToken,
    'org-product-perms',
  );
  assert.equal(orgRes.status, 200);
  const organizationId = orgRes.body.organization?._id?.toString();
  assert.ok(organizationId);

  const memberToken = await registerAndExtractToken(memberEmail);
  await verifyEmail(memberToken.token);
  const memberLogin = await loginUser(memberEmail);
  const memberAccessToken = memberLogin.body.accessToken as string;

  const member = await UserModel.findOne({ email: memberEmail });
  assert.ok(member);

  const inviteRes = await inviteUser(
    ownerAccessToken,
    organizationId!,
    member!._id.toString(),
    'member',
  );
  assert.equal(inviteRes.status, 200);
  const invitationId = inviteRes.body.invitation?._id?.toString();
  assert.ok(invitationId);

  const acceptRes = await acceptInvitation(memberAccessToken, invitationId!);
  assert.equal(acceptRes.status, 200);

  const createForbiddenRes = await createProduct(
    memberAccessToken,
    organizationId!,
    'member-cannot-create',
  );
  assert.equal(createForbiddenRes.status, 403);
  assert.equal(createForbiddenRes.body.message, 'Permission denied');

  const ownerCreateRes = await createProduct(
    ownerAccessToken,
    organizationId!,
    'owner-can-create',
  );
  assert.equal(ownerCreateRes.status, 200);

  const updateForbiddenRes = await request
    .put(`/organization/${organizationId}/products/owner-can-create`)
    .set('Authorization', `Bearer ${memberAccessToken}`)
    .send({
      name: 'Updated Product Name',
      slug: 'updated-product-name',
      active: true,
    });

  assert.equal(updateForbiddenRes.status, 403);
  assert.equal(updateForbiddenRes.body.message, 'Permission denied');
});

test('organization access is forbidden for non-members', async () => {
  const ownerEmail = 'owner@example.com';
  const memberEmail = 'member@example.com';

  const ownerToken = await registerAndExtractToken(ownerEmail);
  await verifyEmail(ownerToken.token);
  const ownerLogin = await loginUser(ownerEmail);
  const ownerAccessToken = ownerLogin.body.accessToken as string;

  const orgRes = await createOrganization(ownerAccessToken, 'org-forbidden');
  assert.equal(orgRes.status, 200);
  const orgId = orgRes.body.organization?._id?.toString();
  assert.ok(orgId);

  const memberToken = await registerAndExtractToken(memberEmail);
  await verifyEmail(memberToken.token);
  const memberLogin = await loginUser(memberEmail);
  const memberAccessToken = memberLogin.body.accessToken as string;

  const forbiddenRes = await request
    .get(`/organization/${orgId}`)
    .set('Authorization', `Bearer ${memberAccessToken}`);

  assert.equal(forbiddenRes.status, 403);
});

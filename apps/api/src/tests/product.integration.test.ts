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
  type MailerStub,
} from './testUtils';
import { UserModel } from '../modules/user/user.model';

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

// ─── Helpers ────────────────────────────────────────────────────────────────

async function registerAndLogin(email: string) {
  const callCountBefore = mailerStub.callCount;
  await request.post('/auth/register').send({
    email,
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'User',
  });
  const mailArgs = mailerStub.getCall(callCountBefore).args[0] as {
    html: string;
  };
  const token = extractVerificationToken(mailArgs.html);
  await request.post(`/auth/verify-email?token=${token}`);
  const loginRes = await request
    .post('/auth/login')
    .send({ email, password: 'Password123!' });
  return loginRes.body.accessToken as string;
}

async function setupOrgAndKey(accessToken: string, slug: string) {
  const orgRes = await request
    .post('/organization')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ name: 'Test Org', slug });
  const orgId = orgRes.body.organization._id as string;
  const keyRes = await request
    .get(`/organization/${orgId}/create-api-key`)
    .set('Authorization', `Bearer ${accessToken}`);
  return { orgId, apiKey: keyRes.body.key as string };
}

function productPayload(
  externalProductId: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    externalProductId,
    name: `Product ${externalProductId}`,
    slug: `slug-${externalProductId}`,
    active: true,
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test('creates product successfully', async () => {
  const token = await registerAndLogin('prod-create@example.com');
  const { orgId } = await setupOrgAndKey(token, 'org-prod-create');

  const res = await request
    .post(`/organization/${orgId}/products`)
    .set('Authorization', `Bearer ${token}`)
    .send(productPayload('prod-001'));

  assert.equal(res.status, 200);
  assert.equal(res.body.product?.externalProductId, 'prod-001');
  assert.equal(res.body.product?.active, true);
});

test('returns 409 on duplicate externalProductId', async () => {
  const token = await registerAndLogin('prod-dup-extid@example.com');
  const { orgId } = await setupOrgAndKey(token, 'org-dup-extid');

  await request
    .post(`/organization/${orgId}/products`)
    .set('Authorization', `Bearer ${token}`)
    .send(productPayload('dup-ext'));

  const res = await request
    .post(`/organization/${orgId}/products`)
    .set('Authorization', `Bearer ${token}`)
    .send({ ...productPayload('dup-ext'), slug: 'different-slug' });

  assert.equal(res.status, 409);
  assert.match(res.body.message, /external product id/i);
});

test('returns 409 on duplicate slug', async () => {
  const token = await registerAndLogin('prod-dup-slug@example.com');
  const { orgId } = await setupOrgAndKey(token, 'org-dup-slug');

  await request
    .post(`/organization/${orgId}/products`)
    .set('Authorization', `Bearer ${token}`)
    .send(productPayload('ext-1'));

  const res = await request
    .post(`/organization/${orgId}/products`)
    .set('Authorization', `Bearer ${token}`)
    .send({ externalProductId: 'ext-2', name: 'Another', slug: 'slug-ext-1' });

  assert.equal(res.status, 409);
  assert.match(res.body.message, /slug/i);
});

test('lists all products for organization', async () => {
  const token = await registerAndLogin('prod-list@example.com');
  const { orgId } = await setupOrgAndKey(token, 'org-prod-list');

  for (let i = 1; i <= 3; i++) {
    await request
      .post(`/organization/${orgId}/products`)
      .set('Authorization', `Bearer ${token}`)
      .send(productPayload(`list-prod-${i}`));
  }

  const res = await request
    .get(`/organization/${orgId}/products`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.products.length, 3);
});

test('gets product by externalProductId', async () => {
  const token = await registerAndLogin('prod-get@example.com');
  const { orgId } = await setupOrgAndKey(token, 'org-prod-get');

  await request
    .post(`/organization/${orgId}/products`)
    .set('Authorization', `Bearer ${token}`)
    .send(productPayload('get-me'));

  const res = await request
    .get(`/organization/${orgId}/products/get-me`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.product.externalProductId, 'get-me');
});

test('returns 404 for non-existent externalProductId', async () => {
  const token = await registerAndLogin('prod-get-404@example.com');
  const { orgId } = await setupOrgAndKey(token, 'org-prod-get-404');

  const res = await request
    .get(`/organization/${orgId}/products/does-not-exist`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 404);
});

test('updates product by externalProductId', async () => {
  const token = await registerAndLogin('prod-update@example.com');
  const { orgId } = await setupOrgAndKey(token, 'org-prod-update');

  await request
    .post(`/organization/${orgId}/products`)
    .set('Authorization', `Bearer ${token}`)
    .send(productPayload('update-me'));

  const res = await request
    .put(`/organization/${orgId}/products/update-me`)
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Updated Name', slug: 'updated-slug', active: false });

  assert.equal(res.status, 200);
});

test('returns 404 when updating non-existent product', async () => {
  const token = await registerAndLogin('prod-update-404@example.com');
  const { orgId } = await setupOrgAndKey(token, 'org-prod-update-404');

  const res = await request
    .put(`/organization/${orgId}/products/ghost-product`)
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Ghost', slug: 'ghost', active: true });

  assert.equal(res.status, 404);
});

test('deletes product by externalProductId', async () => {
  const token = await registerAndLogin('prod-delete@example.com');
  const { orgId } = await setupOrgAndKey(token, 'org-prod-delete');

  await request
    .post(`/organization/${orgId}/products`)
    .set('Authorization', `Bearer ${token}`)
    .send(productPayload('delete-me'));

  const deleteRes = await request
    .delete(`/organization/${orgId}/products/delete-me`)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(deleteRes.status, 200);

  const getRes = await request
    .get(`/organization/${orgId}/products/delete-me`)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(getRes.status, 404);
});

test('returns 404 when deleting non-existent product', async () => {
  const token = await registerAndLogin('prod-delete-404@example.com');
  const { orgId } = await setupOrgAndKey(token, 'org-prod-delete-404');

  const res = await request
    .delete(`/organization/${orgId}/products/ghost`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 404);
});

test('bulk creates products via API key', async () => {
  const token = await registerAndLogin('prod-bulk@example.com');
  const { apiKey } = await setupOrgAndKey(token, 'org-prod-bulk');

  const res = await request
    .post('/public/products/bulk')
    .set('x-api-key', apiKey)
    .send({
      products: [
        productPayload('bulk-1'),
        productPayload('bulk-2'),
        productPayload('bulk-3'),
      ],
    });

  assert.equal(res.status, 200);
  assert.equal(res.body.result.createdCount, 3);
  assert.equal(res.body.result.failedCount, 0);
});

test('member cannot create products', async () => {
  const ownerToken = await registerAndLogin('owner-member-create@example.com');
  const memberEmail = 'member-no-create@example.com';
  const memberToken = await registerAndLogin(memberEmail);
  const { orgId } = await setupOrgAndKey(ownerToken, 'org-member-create');

  const member = await UserModel.findOne({ email: memberEmail });
  const inviteRes = await request
    .post(`/organization/${orgId}/invite-user`)
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ invitedUserId: member!._id.toString(), invitedUserRole: 'member' });
  await request
    .put(
      `/organization-memberships/invitations/${inviteRes.body.invitation._id}/accept`,
    )
    .set('Authorization', `Bearer ${memberToken}`);

  const res = await request
    .post(`/organization/${orgId}/products`)
    .set('Authorization', `Bearer ${memberToken}`)
    .send(productPayload('member-attempt'));

  assert.equal(res.status, 403);
});

test('member cannot update products', async () => {
  const ownerToken = await registerAndLogin('owner-member-update@example.com');
  const memberEmail = 'member-no-update@example.com';
  const memberToken = await registerAndLogin(memberEmail);
  const { orgId } = await setupOrgAndKey(ownerToken, 'org-member-update');

  await request
    .post(`/organization/${orgId}/products`)
    .set('Authorization', `Bearer ${ownerToken}`)
    .send(productPayload('to-update'));

  const member = await UserModel.findOne({ email: memberEmail });
  const inviteRes = await request
    .post(`/organization/${orgId}/invite-user`)
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ invitedUserId: member!._id.toString(), invitedUserRole: 'member' });
  await request
    .put(
      `/organization-memberships/invitations/${inviteRes.body.invitation._id}/accept`,
    )
    .set('Authorization', `Bearer ${memberToken}`);

  const res = await request
    .put(`/organization/${orgId}/products/to-update`)
    .set('Authorization', `Bearer ${memberToken}`)
    .send({ name: 'Sneaky Update', slug: 'sneaky', active: false });

  assert.equal(res.status, 403);
});

test('member cannot delete products', async () => {
  const ownerToken = await registerAndLogin('owner-member-delete@example.com');
  const memberEmail = 'member-no-delete@example.com';
  const memberToken = await registerAndLogin(memberEmail);
  const { orgId } = await setupOrgAndKey(ownerToken, 'org-member-delete');

  await request
    .post(`/organization/${orgId}/products`)
    .set('Authorization', `Bearer ${ownerToken}`)
    .send(productPayload('to-delete'));

  const member = await UserModel.findOne({ email: memberEmail });
  const inviteRes = await request
    .post(`/organization/${orgId}/invite-user`)
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ invitedUserId: member!._id.toString(), invitedUserRole: 'member' });
  await request
    .put(
      `/organization-memberships/invitations/${inviteRes.body.invitation._id}/accept`,
    )
    .set('Authorization', `Bearer ${memberToken}`);

  const res = await request
    .delete(`/organization/${orgId}/products/to-delete`)
    .set('Authorization', `Bearer ${memberToken}`);

  assert.equal(res.status, 403);
});

test('non-member cannot list products', async () => {
  const ownerToken = await registerAndLogin(
    'owner-nonmember-products@example.com',
  );
  const nonMemberToken = await registerAndLogin(
    'nonmember-products@example.com',
  );
  const { orgId } = await setupOrgAndKey(ownerToken, 'org-nonmember-products');

  const res = await request
    .get(`/organization/${orgId}/products`)
    .set('Authorization', `Bearer ${nonMemberToken}`);

  assert.equal(res.status, 403);
});

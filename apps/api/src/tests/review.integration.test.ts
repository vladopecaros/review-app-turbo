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
  const orgId = orgRes.body.data.organization._id as string;
  const keyRes = await request
    .get(`/organization/${orgId}/create-api-key`)
    .set('Authorization', `Bearer ${accessToken}`);
  return { orgId, apiKey: keyRes.body.data.key as string };
}

async function setupProduct(
  accessToken: string,
  orgId: string,
  externalProductId: string,
) {
  await request
    .post(`/organization/${orgId}/products`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      externalProductId,
      name: `Product ${externalProductId}`,
      slug: `product-${externalProductId}`,
      active: true,
    });
}

async function submitReview(
  apiKey: string,
  body: {
    rating: number;
    text: string;
    reviewerName: string;
    reviewerEmail: string;
    externalProductId?: string;
  },
) {
  return request.post('/public/reviews').set('x-api-key', apiKey).send(body);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test('public: submits review without product (org-level)', async () => {
  const token = await registerAndLogin('review-create@example.com');
  const { apiKey } = await setupOrgAndKey(token, 'org-review-create');

  const res = await submitReview(apiKey, {
    rating: 5,
    text: 'Excellent!',
    reviewerName: 'Alice',
    reviewerEmail: 'alice@example.com',
  });

  assert.equal(res.status, 200);
  assert.ok(res.body.data.review?._id);
  assert.equal(res.body.data.review.rating, 5);
  assert.equal(res.body.data.review.reviewerName, 'Alice');
  assert.equal(res.body.data.review.reviewerEmail, undefined);
});

test('public: submits review with externalProductId', async () => {
  const token = await registerAndLogin('review-with-product@example.com');
  const { orgId, apiKey } = await setupOrgAndKey(token, 'org-review-product');
  await setupProduct(token, orgId, 'prod-123');

  const res = await submitReview(apiKey, {
    rating: 4,
    text: 'Great product.',
    reviewerName: 'Bob',
    reviewerEmail: 'bob@example.com',
    externalProductId: 'prod-123',
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.data.review.externalProductId, 'prod-123');
});

test('public: submitting review with unknown externalProductId returns 404', async () => {
  const token = await registerAndLogin('review-bad-product@example.com');
  const { apiKey } = await setupOrgAndKey(token, 'org-review-bad-product');

  const res = await submitReview(apiKey, {
    rating: 3,
    text: 'Decent.',
    reviewerName: 'Charlie',
    reviewerEmail: 'charlie@example.com',
    externalProductId: 'does-not-exist',
  });

  assert.equal(res.status, 404);
});

test('public: lists reviews with pagination', async () => {
  const token = await registerAndLogin('review-list@example.com');
  const { apiKey } = await setupOrgAndKey(token, 'org-review-list');

  for (let i = 1; i <= 3; i++) {
    await submitReview(apiKey, {
      rating: i as 1 | 2 | 3,
      text: `Review ${i}`,
      reviewerName: `Reviewer ${i}`,
      reviewerEmail: `reviewer${i}@example.com`,
    });
  }

  const res = await request.get('/public/reviews').set('x-api-key', apiKey);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.reviews.length, 3);
  assert.ok(res.body.data.pagination.total >= 3);
});

test('public: lists reviews filtered by externalProductId', async () => {
  const token = await registerAndLogin('review-scope@example.com');
  const { orgId, apiKey } = await setupOrgAndKey(token, 'org-review-scope');
  await setupProduct(token, orgId, 'product-a');
  await setupProduct(token, orgId, 'product-b');

  await submitReview(apiKey, {
    rating: 5,
    text: 'For product A.',
    reviewerName: 'A',
    reviewerEmail: 'a@example.com',
    externalProductId: 'product-a',
  });
  await submitReview(apiKey, {
    rating: 3,
    text: 'For product B.',
    reviewerName: 'B',
    reviewerEmail: 'b@example.com',
    externalProductId: 'product-b',
  });

  const res = await request
    .get('/public/reviews?scope=product&externalProductId=product-a')
    .set('x-api-key', apiKey);

  assert.equal(res.status, 200);
  assert.equal(res.body.data.reviews.length, 1);
  assert.equal(res.body.data.reviews[0].externalProductId, 'product-a');
});

test('private: lists all reviews for organization', async () => {
  const token = await registerAndLogin('review-private-list@example.com');
  const { orgId, apiKey } = await setupOrgAndKey(token, 'org-private-list');

  await submitReview(apiKey, {
    rating: 5,
    text: 'Private listing test.',
    reviewerName: 'Dave',
    reviewerEmail: 'dave@example.com',
  });

  const res = await request
    .get(`/organization/${orgId}/reviews`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.ok(res.body.data.reviews.length >= 1);
  assert.ok(res.body.data.pagination);
});

test('private: filters reviews by status', async () => {
  const token = await registerAndLogin('review-filter-status@example.com');
  const { orgId, apiKey } = await setupOrgAndKey(token, 'org-filter-status');

  const createRes = await submitReview(apiKey, {
    rating: 4,
    text: 'Will reject.',
    reviewerName: 'Eve',
    reviewerEmail: 'eve@example.com',
  });
  const reviewId = createRes.body.data.review._id as string;

  await request
    .patch(`/organization/${orgId}/reviews/${reviewId}/status`)
    .set('Authorization', `Bearer ${token}`)
    .send({ status: 'rejected' });

  const rejectedRes = await request
    .get(`/organization/${orgId}/reviews?status=rejected`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(rejectedRes.status, 200);
  assert.ok(rejectedRes.body.data.reviews.length >= 1);
  assert.ok(
    rejectedRes.body.data.reviews.every(
      (r: { status: string }) => r.status === 'rejected',
    ),
  );

  const publishedRes = await request
    .get(`/organization/${orgId}/reviews?status=published`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(publishedRes.status, 200);
  assert.ok(
    publishedRes.body.data.reviews.every(
      (r: { status: string }) => r.status === 'published',
    ),
  );
});

test('private: filters reviews by rating', async () => {
  const token = await registerAndLogin('review-filter-rating@example.com');
  const { orgId, apiKey } = await setupOrgAndKey(token, 'org-filter-rating');

  await submitReview(apiKey, {
    rating: 5,
    text: 'Five star.',
    reviewerName: 'F',
    reviewerEmail: 'f@example.com',
  });
  await submitReview(apiKey, {
    rating: 1,
    text: 'One star.',
    reviewerName: 'O',
    reviewerEmail: 'o@example.com',
  });

  const res = await request
    .get(`/organization/${orgId}/reviews?rating=5`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.ok(res.body.data.reviews.length >= 1);
  assert.ok(
    res.body.data.reviews.every((r: { rating: number }) => r.rating === 5),
  );
});

test('private: paginates reviews correctly', async () => {
  const token = await registerAndLogin('review-pagination@example.com');
  const { orgId, apiKey } = await setupOrgAndKey(token, 'org-pagination');

  for (let i = 0; i < 15; i++) {
    await submitReview(apiKey, {
      rating: 3,
      text: `Page test ${i}`,
      reviewerName: `Reviewer ${i}`,
      reviewerEmail: `reviewer${i}@paginaion.com`,
    });
  }

  const page1 = await request
    .get(`/organization/${orgId}/reviews?page=1&limit=10`)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(page1.status, 200);
  assert.equal(page1.body.data.reviews.length, 10);
  assert.equal(page1.body.data.pagination.page, 1);
  assert.equal(page1.body.data.pagination.totalPages, 2);

  const page2 = await request
    .get(`/organization/${orgId}/reviews?page=2&limit=10`)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(page2.status, 200);
  assert.equal(page2.body.data.reviews.length, 5);
});

test('private: gets single review by id', async () => {
  const token = await registerAndLogin('review-get-one@example.com');
  const { orgId, apiKey } = await setupOrgAndKey(token, 'org-get-one');

  const createRes = await submitReview(apiKey, {
    rating: 4,
    text: 'Detail view test.',
    reviewerName: 'Grace',
    reviewerEmail: 'grace@example.com',
  });
  const reviewId = createRes.body.data.review._id as string;

  const res = await request
    .get(`/organization/${orgId}/reviews/${reviewId}`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.data.review._id, reviewId);
  assert.equal(res.body.data.review.reviewerName, 'Grace');
  assert.equal(res.body.data.review.reviewerEmail, 'grace@example.com');
});

test('private: updates review status to rejected then approved', async () => {
  const token = await registerAndLogin('review-status-update@example.com');
  const { orgId, apiKey } = await setupOrgAndKey(token, 'org-status-update');

  const createRes = await submitReview(apiKey, {
    rating: 2,
    text: 'Needs moderation.',
    reviewerName: 'Hank',
    reviewerEmail: 'hank@example.com',
  });
  const reviewId = createRes.body.data.review._id as string;

  const rejectRes = await request
    .patch(`/organization/${orgId}/reviews/${reviewId}/status`)
    .set('Authorization', `Bearer ${token}`)
    .send({ status: 'rejected' });
  assert.equal(rejectRes.status, 200);

  const checkRes = await request
    .get(`/organization/${orgId}/reviews/${reviewId}`)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(checkRes.body.data.review.status, 'rejected');

  const approveRes = await request
    .patch(`/organization/${orgId}/reviews/${reviewId}/status`)
    .set('Authorization', `Bearer ${token}`)
    .send({ status: 'published' });
  assert.equal(approveRes.status, 200);
});

test('private: non-member cannot list reviews', async () => {
  const ownerToken = await registerAndLogin(
    'owner-review-forbidden@example.com',
  );
  const nonMemberToken = await registerAndLogin(
    'non-member-review-forbidden@example.com',
  );
  const { orgId } = await setupOrgAndKey(ownerToken, 'org-review-forbidden');

  const res = await request
    .get(`/organization/${orgId}/reviews`)
    .set('Authorization', `Bearer ${nonMemberToken}`);

  assert.equal(res.status, 403);
});

test('private: member cannot update review status', async () => {
  const ownerToken = await registerAndLogin(
    'owner-review-member-perm@example.com',
  );
  const memberEmail = 'member-review-perm@example.com';
  const memberToken = await registerAndLogin(memberEmail);
  const { orgId, apiKey } = await setupOrgAndKey(
    ownerToken,
    'org-review-member-perm',
  );

  const member = await UserModel.findOne({ email: memberEmail });
  const inviteRes = await request
    .post(`/organization/${orgId}/invite-user`)
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ invitedUserId: member!._id.toString(), invitedUserRole: 'member' });
  const invitationId = inviteRes.body.data.invitation._id as string;
  await request
    .put(`/organization-memberships/invitations/${invitationId}/accept`)
    .set('Authorization', `Bearer ${memberToken}`);

  const createRes = await submitReview(apiKey, {
    rating: 3,
    text: 'Member perm test.',
    reviewerName: 'Ivan',
    reviewerEmail: 'ivan@example.com',
  });
  const reviewId = createRes.body.data.review._id as string;

  const patchRes = await request
    .patch(`/organization/${orgId}/reviews/${reviewId}/status`)
    .set('Authorization', `Bearer ${memberToken}`)
    .send({ status: 'rejected' });

  assert.equal(patchRes.status, 403);
});

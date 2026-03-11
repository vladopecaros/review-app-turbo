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

async function publishReview(
  accessToken: string,
  orgId: string,
  reviewId: string,
) {
  await request
    .patch(`/organization/${orgId}/reviews/${reviewId}/status`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ status: 'published' });
}

// ─── Summary tests ────────────────────────────────────────────────────────────

test('analytics: summary returns zeros for empty org', async () => {
  const token = await registerAndLogin('analytics-empty@example.com');
  const { orgId } = await setupOrgAndKey(token, 'org-analytics-empty');

  const res = await request
    .get(`/organization/${orgId}/analytics/summary`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.data.totalReviews, 0);
  assert.equal(res.body.data.averageRating, 0);
  assert.equal(res.body.data.ratingDistribution.length, 5);
  assert.ok(
    res.body.data.ratingDistribution.every(
      (b: { count: number }) => b.count === 0,
    ),
  );
});

test('analytics: summary calculates totalReviews and averageRating correctly', async () => {
  const token = await registerAndLogin('analytics-summary@example.com');
  const { orgId, apiKey } = await setupOrgAndKey(
    token,
    'org-analytics-summary',
  );

  const r1 = await submitReview(apiKey, {
    rating: 5,
    text: 'Great!',
    reviewerName: 'Alice',
    reviewerEmail: 'a@example.com',
  });
  const r2 = await submitReview(apiKey, {
    rating: 3,
    text: 'Okay',
    reviewerName: 'Bob',
    reviewerEmail: 'b@example.com',
  });
  await publishReview(token, orgId, r1.body.review._id);
  await publishReview(token, orgId, r2.body.review._id);

  const res = await request
    .get(`/organization/${orgId}/analytics/summary`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.data.totalReviews, 2);
  assert.equal(res.body.data.averageRating, 4);
});

test('analytics: summary ratingDistribution always has all 5 buckets', async () => {
  const token = await registerAndLogin('analytics-dist@example.com');
  const { orgId, apiKey } = await setupOrgAndKey(token, 'org-analytics-dist');

  const r = await submitReview(apiKey, {
    rating: 5,
    text: 'Perfect',
    reviewerName: 'Alice',
    reviewerEmail: 'a@example.com',
  });
  await publishReview(token, orgId, r.body.review._id);

  const res = await request
    .get(`/organization/${orgId}/analytics/summary`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  const dist = res.body.data.ratingDistribution as {
    rating: number;
    count: number;
  }[];
  assert.equal(dist.length, 5);
  assert.deepEqual(
    dist.map((b) => b.rating),
    [1, 2, 3, 4, 5],
  );
  assert.equal(dist.find((b) => b.rating === 5)?.count, 1);
  assert.equal(dist.find((b) => b.rating === 4)?.count, 0);
});

test('analytics: summary filters by externalProductId', async () => {
  const token = await registerAndLogin('analytics-product@example.com');
  const { orgId, apiKey } = await setupOrgAndKey(
    token,
    'org-analytics-product',
  );
  await setupProduct(token, orgId, 'prod-a');
  await setupProduct(token, orgId, 'prod-b');

  const rA = await submitReview(apiKey, {
    rating: 5,
    text: 'Great',
    reviewerName: 'Alice',
    reviewerEmail: 'a@example.com',
    externalProductId: 'prod-a',
  });
  const rB = await submitReview(apiKey, {
    rating: 2,
    text: 'Bad',
    reviewerName: 'Bob',
    reviewerEmail: 'b@example.com',
    externalProductId: 'prod-b',
  });
  await publishReview(token, orgId, rA.body.review._id);
  await publishReview(token, orgId, rB.body.review._id);

  const res = await request
    .get(`/organization/${orgId}/analytics/summary?externalProductId=prod-a`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.data.totalReviews, 1);
  assert.equal(res.body.data.averageRating, 5);
});

test('analytics: summary filters by startDate and endDate', async () => {
  const token = await registerAndLogin('analytics-daterange@example.com');
  const { orgId, apiKey } = await setupOrgAndKey(
    token,
    'org-analytics-daterange',
  );

  const r = await submitReview(apiKey, {
    rating: 4,
    text: 'Good',
    reviewerName: 'Alice',
    reviewerEmail: 'a@example.com',
  });
  await publishReview(token, orgId, r.body.review._id);

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const inRange = await request
    .get(
      `/organization/${orgId}/analytics/summary?startDate=${yesterday}&endDate=${tomorrow}`,
    )
    .set('Authorization', `Bearer ${token}`);
  assert.equal(inRange.status, 200);
  assert.equal(inRange.body.data.totalReviews, 1);

  const pastOnly = new Date(Date.now() - 2 * 86400000)
    .toISOString()
    .split('T')[0];
  const outOfRange = await request
    .get(
      `/organization/${orgId}/analytics/summary?startDate=${pastOnly}&endDate=${yesterday}`,
    )
    .set('Authorization', `Bearer ${token}`);
  assert.equal(outOfRange.status, 200);
  assert.equal(outOfRange.body.data.totalReviews, 0);
});

test('analytics: summary returns 403 for non-member', async () => {
  const owner = await registerAndLogin('analytics-owner@example.com');
  const nonMember = await registerAndLogin('analytics-nonmember@example.com');
  const { orgId } = await setupOrgAndKey(owner, 'org-analytics-403');

  const res = await request
    .get(`/organization/${orgId}/analytics/summary`)
    .set('Authorization', `Bearer ${nonMember}`);

  assert.equal(res.status, 403);
});

// ─── Trends tests ─────────────────────────────────────────────────────────────

test('analytics: trends returns daily buckets', async () => {
  const token = await registerAndLogin('analytics-trends-day@example.com');
  const { orgId, apiKey } = await setupOrgAndKey(token, 'org-trends-day');

  const r = await submitReview(apiKey, {
    rating: 5,
    text: 'Excellent',
    reviewerName: 'Alice',
    reviewerEmail: 'a@example.com',
  });
  await publishReview(token, orgId, r.body.review._id);

  const res = await request
    .get(`/organization/${orgId}/analytics/trends?granularity=day`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.granularity, 'day');
  assert.equal(res.body.data.length, 1);
  const bucket = res.body.data[0] as {
    period: string;
    count: number;
    averageRating: number;
  };
  assert.match(bucket.period, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(bucket.count, 1);
  assert.equal(bucket.averageRating, 5);
});

test('analytics: trends returns weekly buckets', async () => {
  const token = await registerAndLogin('analytics-trends-week@example.com');
  const { orgId, apiKey } = await setupOrgAndKey(token, 'org-trends-week');

  const r = await submitReview(apiKey, {
    rating: 3,
    text: 'Average',
    reviewerName: 'Bob',
    reviewerEmail: 'b@example.com',
  });
  await publishReview(token, orgId, r.body.review._id);

  const res = await request
    .get(`/organization/${orgId}/analytics/trends?granularity=week`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.granularity, 'week');
  assert.equal(res.body.data.length, 1);
  const bucket = res.body.data[0] as { period: string };
  assert.match(bucket.period, /^\d{4}-W\d{2}$/);
});

test('analytics: trends returns monthly buckets', async () => {
  const token = await registerAndLogin('analytics-trends-month@example.com');
  const { orgId, apiKey } = await setupOrgAndKey(token, 'org-trends-month');

  const r = await submitReview(apiKey, {
    rating: 4,
    text: 'Good',
    reviewerName: 'Carol',
    reviewerEmail: 'c@example.com',
  });
  await publishReview(token, orgId, r.body.review._id);

  const res = await request
    .get(`/organization/${orgId}/analytics/trends?granularity=month`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.granularity, 'month');
  assert.equal(res.body.data.length, 1);
  const bucket = res.body.data[0] as { period: string };
  assert.match(bucket.period, /^\d{4}-\d{2}$/);
});

test('analytics: trends filters by externalProductId', async () => {
  const token = await registerAndLogin('analytics-trends-product@example.com');
  const { orgId, apiKey } = await setupOrgAndKey(token, 'org-trends-product');
  await setupProduct(token, orgId, 'prod-trends');

  const rWithProduct = await submitReview(apiKey, {
    rating: 5,
    text: 'Great',
    reviewerName: 'Alice',
    reviewerEmail: 'a@example.com',
    externalProductId: 'prod-trends',
  });
  const rWithout = await submitReview(apiKey, {
    rating: 1,
    text: 'Bad',
    reviewerName: 'Bob',
    reviewerEmail: 'b@example.com',
  });
  await publishReview(token, orgId, rWithProduct.body.review._id);
  await publishReview(token, orgId, rWithout.body.review._id);

  const res = await request
    .get(
      `/organization/${orgId}/analytics/trends?granularity=day&externalProductId=prod-trends`,
    )
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  const total = (res.body.data as { count: number }[]).reduce(
    (s, b) => s + b.count,
    0,
  );
  assert.equal(total, 1);
});

test('analytics: trends filters by date range', async () => {
  const token = await registerAndLogin('analytics-trends-dates@example.com');
  const { orgId, apiKey } = await setupOrgAndKey(token, 'org-trends-dates');

  const r = await submitReview(apiKey, {
    rating: 4,
    text: 'Good',
    reviewerName: 'Alice',
    reviewerEmail: 'a@example.com',
  });
  await publishReview(token, orgId, r.body.review._id);

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const inRange = await request
    .get(
      `/organization/${orgId}/analytics/trends?granularity=day&startDate=${yesterday}&endDate=${tomorrow}`,
    )
    .set('Authorization', `Bearer ${token}`);
  assert.equal(inRange.status, 200);
  const total = (inRange.body.data as { count: number }[]).reduce(
    (s, b) => s + b.count,
    0,
  );
  assert.equal(total, 1);
});

// ─── Export tests ─────────────────────────────────────────────────────────────

test('analytics: export returns CSV with correct column headers', async () => {
  const token = await registerAndLogin('analytics-export@example.com');
  const { orgId, apiKey } = await setupOrgAndKey(token, 'org-export');

  const r = await submitReview(apiKey, {
    rating: 4,
    text: 'Good product',
    reviewerName: 'Alice',
    reviewerEmail: 'a@example.com',
  });
  await publishReview(token, orgId, r.body.review._id);

  const res = await request
    .get(`/organization/${orgId}/analytics/export`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.match(res.headers['content-type'], /text\/csv/);
  const lines = (res.text as string).split('\r\n').filter(Boolean);
  assert.equal(
    lines[0],
    'createdAt,rating,reviewerName,text,status,externalProductId',
  );
  assert.equal(lines.length, 2); // header + 1 row
});

test('analytics: export returns 403 for non-member', async () => {
  const owner = await registerAndLogin('export-owner@example.com');
  const nonMember = await registerAndLogin('export-nonmember@example.com');
  const { orgId } = await setupOrgAndKey(owner, 'org-export-403');

  const res = await request
    .get(`/organization/${orgId}/analytics/export`)
    .set('Authorization', `Bearer ${nonMember}`);

  assert.equal(res.status, 403);
});

# Review App API

Backend API for user authentication and organization collaboration workflows. The service is built with **TypeScript + Express + MongoDB (Mongoose)** and currently supports:

- User registration with email verification.
- Login + JWT access token authentication.
- Refresh token rotation through secure HTTP-only cookies.
- Organization creation and membership linking.
- Organization member invitation, acceptance, and decline flows.
- Email notifications for verification and organization invites.

---

## Current Readiness Snapshot

This project is in a **functional MVP/back-end readiness stage**:

- ✅ Core auth and organization collaboration flows are implemented.
- ✅ Environment validation is present at startup.
- ✅ Logging and central error middleware are wired in.
- ✅ Build/lint scripts exist and can be run locally.
- ✅ Automated smoke tests are configured for core token utilities.
- ✅ OpenAPI 3.0 spec is available at `/docs/openapi.json`.
- ✅ Key naming/typo inconsistencies in code paths/messages were cleaned up.

If you want production readiness next, priority should be: **deeper integration tests, request validation standardization, CI pipeline, and deployment templates**.

---

## Tech Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express 5
- **Database:** MongoDB with Mongoose
- **Auth:** JWT access token + persisted refresh tokens
- **Email:** Nodemailer
- **Logging:** Winston
- **Tooling:** ESLint, Prettier, Nodemon, TypeScript compiler

---

## Project Structure

```txt
src/
  app.ts                          # App composition + route mounting
  server.ts                       # Bootstrap: env checks, DB start, app listen
  config/
    database/                     # Mongo connection service
    logger.ts                     # Winston logger
    mailer.ts                     # Nodemailer transport
  middlewares/
    auth.middleware.ts            # Bearer token guard
    error.middleware.ts           # Centralized error handling
  modules/
    auth/                         # Register/login/refresh/logout/verify-email
    organization/                 # Organization CRUD-like read/create + invites
    organizationMembership/       # Accept/decline invitations
    user/                         # User model/repository/service
    email/                        # Email sending and templates
  utils/
    jwt.ts                        # JWT sign/verify helpers
    refreshToken.ts               # Refresh token generator
    emailVerification.ts          # Email verification token/hash generation
```

---

## Prerequisites

- Node.js 20+ recommended
- npm 10+ recommended
- Running MongoDB instance
- SMTP credentials for email flows

---

## Environment Variables

Copy `.env.template` to `.env` and fill all required values.

```bash
cp .env.template .env
```

Required (from template):

- `NODE_ENV`
- `PORT`
- `SERVER_URL`
- `MONGODB_URL`
- `FRONTEND_URL`
- `JWT_ACCESS_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`

Optional:

- `REFRESH_TOKEN_DAYS` (default used in code when missing)
- `PRODUCT_NAME`
- `JWT_ACCESS_EXPIRES_IN` (defaults to `15m`)

---

## Install & Run

```bash
npm install
npm run dev
```

Production build/run:

```bash
npm run build
npm run start
```

Code quality helpers:

```bash
npm run lint
npm run lint:fix
npm run format
```

---

## API Documentation

- OpenAPI JSON: `GET /docs/openapi.json`
- Docs hint endpoint: `GET /docs`

You can import the OpenAPI JSON into API tools (Postman/Insomnia) for current route discovery.

---

## Authentication Model

- Access token is returned in JSON response as `accessToken`.
- Refresh token is set in a cookie (`refreshToken`) with:
  - `httpOnly: true`
  - `sameSite: "lax"`
  - `secure: true` in production
  - cookie path restricted to `/auth/refresh`
- Protected routes require `Authorization: Bearer <accessToken>`.

---

## API Endpoints (Current)

### Health-ish

- `GET /`
  - Returns hello/status message.

### Auth

- `POST /auth/register`
  - Creates user, stores verification token hash, sends verification email.
- `POST /auth/login`
  - Requires verified email + valid credentials.
- `POST /auth/refresh`
  - Rotates refresh token and returns new access token.
- `POST /auth/logout`
  - Requires auth + refresh cookie; invalidates refresh token.
- `POST /auth/verify-email?token=<token>`
  - Verifies email token. If expired, resends and returns conflict response.

### Organizations

- `POST /organization`
  - Creates organization and owner membership.
- `GET /organization`
  - Lists organizations for authenticated user.
- `GET /organization/:id`
  - Gets organization by id if user has membership.
- `POST /organization/:id/invite-user`
  - Invites existing user to org with role.

### Organization Membership Invitations

- `PUT /organization-memberships/invitations/:id/accept`
  - Accept invitation for current user.
- `PUT /organization-memberships/invitations/:id/decline`
  - Decline invitation for current user.

---

## Error Handling & Logging

- Domain/application errors use `AppError` and return expected status + message.
- Unknown errors are logged and returned as HTTP 500.
- Winston writes to console and file logs (`logs/error.log`, `logs/combined.log`).

---

## Known Gaps / Next Steps

1. Expand test coverage to integration/e2e (auth and invitation flows).
2. Add request schema validation (e.g., Zod/Joi) for all route bodies/params.
3. Add richer OpenAPI schemas (request/response examples and auth components).
4. Add Dockerfile + docker-compose for consistent local setup.
5. Add CI (lint + build + test gates).
6. Harden security defaults (rate limiting, helmet, stricter CORS config).

---

## Notes for Contributors

- Keep route/module boundaries explicit (controller → service → repository).
- Prefer throwing `AppError` for expected failures.
- Keep environment variables in sync with `.env.template` and startup checks.

# Review App API

Backend API for user authentication and organization collaboration workflows. The service is built with **TypeScript + Express + MongoDB (Mongoose)** and currently supports:

- User registration with email verification.
- Login + JWT access token authentication.
- Refresh token rotation through secure HTTP-only cookies.
- Organization creation and membership linking.
- Organization member invitation, acceptance, and decline flows.
- Email notifications for verification and organization invites.

---

## Current Readiness Snapshot

This project is in a **functional MVP/back-end readiness stage**:

- ✅ Core auth and organization collaboration flows are implemented.
- ✅ Environment validation is present at startup.
- ✅ Logging and central error middleware are wired in.
- ✅ Build/lint scripts exist and can be run locally.
- ✅ Automated smoke tests are configured for core token utilities.
- ✅ OpenAPI 3.0 spec is available at `/docs/openapi.json`.
- ✅ Key naming/typo inconsistencies in code paths/messages were cleaned up.

If you want production readiness next, priority should be: **deeper integration tests, request validation standardization, CI pipeline, and deployment templates**.

---

## Tech Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express 5
- **Database:** MongoDB with Mongoose
- **Auth:** JWT access token + persisted refresh tokens
- **Email:** Nodemailer
- **Logging:** Winston
- **Tooling:** ESLint, Prettier, Nodemon, TypeScript compiler

---

## Project Structure

```txt
src/
  app.ts                          # App composition + route mounting
  server.ts                       # Bootstrap: env checks, DB start, app listen
  config/
    database/                     # Mongo connection service
    logger.ts                     # Winston logger
    mailer.ts                     # Nodemailer transport
  middlewares/
    auth.middleware.ts            # Bearer token guard
    error.middleware.ts           # Centralized error handling
  modules/
    auth/                         # Register/login/refresh/logout/verify-email
    organization/                 # Organization CRUD-like read/create + invites
    organizationMembership/       # Accept/decline invitations
    user/                         # User model/repository/service
    email/                        # Email sending and templates
  utils/
    jwt.ts                        # JWT sign/verify helpers
    refreshToken.ts               # Refresh token generator
    emailVerification.ts          # Email verification token/hash generation
```

---

## Prerequisites

- Node.js 20+ recommended
- npm 10+ recommended
- Running MongoDB instance
- SMTP credentials for email flows

---

## Environment Variables

Copy `.env.template` to `.env` and fill all required values.

```bash
cp .env.template .env
```

Required (from template):

- `NODE_ENV`
- `PORT`
- `SERVER_URL`
- `MONGODB_URL`
- `FRONTEND_URL`
- `JWT_ACCESS_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`

Optional:

- `REFRESH_TOKEN_DAYS` (default used in code when missing)
- `PRODUCT_NAME`
- `JWT_ACCESS_EXPIRES_IN` (defaults to `15m`)

---

## Install & Run

```bash
npm install
npm run dev
```

Production build/run:

```bash
npm run build
npm run start
```

Code quality helpers:

```bash
npm run lint
npm run lint:fix
npm run format
```

---

## API Documentation

- OpenAPI JSON: `GET /docs/openapi.json`
- Docs hint endpoint: `GET /docs`

You can import the OpenAPI JSON into API tools (Postman/Insomnia) for current route discovery.

---

## Authentication Model

- Access token is returned in JSON response as `accessToken`.
- Refresh token is set in a cookie (`refreshToken`) with:
  - `httpOnly: true`
  - `sameSite: "lax"`
  - `secure: true` in production
  - cookie path restricted to `/auth/refresh`
- Protected routes require `Authorization: Bearer <accessToken>`.

---

## API Endpoints (Current)

### Health-ish

- `GET /`
  - Returns hello/status message.

### Auth

- `POST /auth/register`
  - Creates user, stores verification token hash, sends verification email.
- `POST /auth/login`
  - Requires verified email + valid credentials.
- `POST /auth/refresh`
  - Rotates refresh token and returns new access token.
- `POST /auth/logout`
  - Requires auth + refresh cookie; invalidates refresh token.
- `POST /auth/verify-email?token=<token>`
  - Verifies email token. If expired, resends and returns conflict response.

### Organizations

- `POST /organization`
  - Creates organization and owner membership.
- `GET /organization`
  - Lists organizations for authenticated user.
- `GET /organization/:id`
  - Gets organization by id if user has membership.
- `POST /organization/:id/invite-user`
  - Invites existing user to org with role.

### Organization Membership Invitations

- `PUT /organization-memberships/invitations/:id/accept`
  - Accept invitation for current user.
- `PUT /organization-memberships/invitations/:id/decline`
  - Decline invitation for current user.

---

## Error Handling & Logging

- Domain/application errors use `AppError` and return expected status + message.
- Unknown errors are logged and returned as HTTP 500.
- Winston writes to console and file logs (`logs/error.log`, `logs/combined.log`).

---

## Roadmap

The vision is a **reviews-as-a-service platform**: organizations sign up, create API keys, register their products, and embed lightweight React components on their websites to collect and display customer reviews. Below is the detailed plan for each phase.

---

### Phase 1: API Key System

Every public API call from the embedded components needs to be scoped to an organization without requiring end-users to log in. API keys solve this: an org admin generates a key, the developer puts it in the component props, and every request carries the key in an `X-API-Key` header.

**Data model — `ApiKey`:**

| Field             | Type         | Details                                                     |
| ----------------- | ------------ | ----------------------------------------------------------- |
| `organizationId`  | ObjectId     | ref to Organization                                         |
| `keyHash`         | String       | SHA-256 hash of the raw key (unique, indexed)               |
| `keyPrefix`       | String       | First 8 chars of the raw key for display (e.g. `rk_7G3kLm`) |
| `name`            | String       | Human label (e.g. "Production Widget")                      |
| `createdByUserId` | ObjectId     | Audit trail — who generated the key                         |
| `revokedAt`       | Date or null | null = active; timestamp = revoked (soft delete)            |
| `lastUsedAt`      | Date or null | Updated on each public API call                             |

**Key lifecycle:**

1. Admin generates a key via `POST /organization/:orgId/api-keys`.
2. The backend generates 32 random bytes, prepends `rk_` (like GitHub's `ghp_`, Stripe's `sk_`), hashes with SHA-256, stores only the hash.
3. The raw key is returned **exactly once** in the response — it can never be retrieved again.
4. Revoking a key (`DELETE`) sets `revokedAt` to the current timestamp. The record stays in the DB for audit.

**Endpoints:**

| Method   | Path                                   | Auth              | Description                                      |
| -------- | -------------------------------------- | ----------------- | ------------------------------------------------ |
| `POST`   | `/organization/:orgId/api-keys`        | JWT (admin/owner) | Generate a new API key                           |
| `GET`    | `/organization/:orgId/api-keys`        | JWT (admin/owner) | List all keys (prefix + name, never the raw key) |
| `DELETE` | `/organization/:orgId/api-keys/:keyId` | JWT (admin/owner) | Revoke a key                                     |

**Middleware — `requireApiKey`:**

A separate middleware from the JWT guard. Reads the `X-API-Key` header, hashes it, looks up the hash in the DB, rejects if not found or revoked, and sets `req.apiKeyOrganizationId` so downstream handlers know which organization the request belongs to.

---

### Phase 2: Product Management

Organizations sell products and services and want reviews scoped to each one. A `Product` model lets orgs register their products through the API. Reviews can optionally reference a product — or be left at the organization level.

**Data model — `Product`:**

| Field            | Type     | Details                                                                      |
| ---------------- | -------- | ---------------------------------------------------------------------------- |
| `name`           | String   | Required (e.g. "Pro Widget")                                                 |
| `description`    | String   | Optional, defaults to empty                                                  |
| `organizationId` | ObjectId | ref to Organization (indexed)                                                |
| `slug`           | String   | Lowercase, trimmed. Unique per org (compound index `{organizationId, slug}`) |
| `isActive`       | Boolean  | Default `true`. Set to `false` for soft-delete                               |

**Slug rules:**

- Lowercased and trimmed automatically.
- At least 2 characters.
- Unique within an organization, not globally — different orgs can have a product called "widget".

**Endpoints:**

| Method   | Path                                       | Auth              | Description          |
| -------- | ------------------------------------------ | ----------------- | -------------------- |
| `POST`   | `/organization/:orgId/products`            | JWT (any member)  | Create a product     |
| `GET`    | `/organization/:orgId/products`            | JWT (any member)  | List active products |
| `GET`    | `/organization/:orgId/products/:productId` | JWT (any member)  | Get single product   |
| `PUT`    | `/organization/:orgId/products/:productId` | JWT (any member)  | Update product       |
| `DELETE` | `/organization/:orgId/products/:productId` | JWT (admin/owner) | Delete product       |

---

### Phase 3: Reviews & Public API

The core of the platform. Two distinct audiences interact with reviews:

1. **End-users on the organization's website** — submit and browse reviews via the embedded components. They authenticate with the organization's API key. They never see reviewer emails.
2. **Organization members on the dashboard** — view all reviews with full data (including emails) for customer support and analytics. They authenticate with JWT.

**Data model — `Review`:**

| Field            | Type             | Details                                            |
| ---------------- | ---------------- | -------------------------------------------------- |
| `rating`         | Number           | Required, integer 1-5                              |
| `text`           | String           | Required, max 5000 chars                           |
| `reviewerName`   | String           | Required, trimmed                                  |
| `reviewerEmail`  | String           | Required, trimmed, stored lowercase                |
| `organizationId` | ObjectId         | Required, ref to Organization                      |
| `productId`      | ObjectId or null | Optional, ref to Product. null = org-level review  |
| `status`         | Enum             | `'published'` (default), `'pending'`, `'rejected'` |

Compound index on `{ organizationId, productId, status }` for fast querying.

**Status field and future moderation:**

Reviews default to `status: 'published'` — they appear immediately. The enum includes `'pending'` and `'rejected'` so that future moderation can be added by simply changing the default to `'pending'` and building approve/reject admin endpoints. The public listing already filters by `status: 'published'`.

**Two data shapes:**

- **Full (`Review`)** — includes `reviewerEmail`, `status`, all timestamps. Returned from private JWT-authenticated endpoints.
- **Public (`PublicReview`)** — strips `reviewerEmail` and `status`. Only returns `_id`, `rating`, `text`, `reviewerName`, `productId`, `createdAt`. Returned from public API-key-authenticated endpoints. This ensures reviewer emails are never leaked.

**Pagination:**

All list endpoints return paginated results (default 20 per page, max 100):

```json
{
  "reviews": [...],
  "pagination": {
    "total": 142,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

**Validation rules (review submission):**

| Field           | Rules                                                      |
| --------------- | ---------------------------------------------------------- |
| `rating`        | Required. Integer between 1 and 5.                         |
| `text`          | Required. Non-empty after trim. Max 5000 chars.            |
| `reviewerName`  | Required. Non-empty after trim.                            |
| `reviewerEmail` | Required. Basic email format validation. Stored lowercase. |
| `productId`     | Optional. If provided, must be a valid ObjectId.           |

**Public endpoints (API key auth via `X-API-Key` header):**

| Method | Path                                      | Description                                                                        |
| ------ | ----------------------------------------- | ---------------------------------------------------------------------------------- |
| `POST` | `/public/reviews`                         | Submit a review. Body: `{ rating, text, reviewerName, reviewerEmail, productId? }` |
| `GET`  | `/public/reviews?productId=&page=&limit=` | List published reviews (email hidden). Filterable by product, paginated.           |

The `organizationId` is not in the URL — it is derived from the API key automatically.

**Private endpoints (JWT auth):**

| Method | Path                                        | Description                                                    |
| ------ | ------------------------------------------- | -------------------------------------------------------------- |
| `GET`  | `/organization/:orgId/reviews?page=&limit=` | List all reviews with full data (includes email, all statuses) |

---

### Phase 4: Embeddable NPM Component Package

The developer-facing deliverable. Organizations `npm install` a package, drop two components into their site, and reviews start flowing.

**Package:** `@review-app/components`
**Location:** `packages/review-components/` (monorepo, same git repo)
**Build:** `tsup` — outputs CJS + ESM + `.d.ts` declarations
**React:** peer dependency (>=18.0.0)
**Styling:** CSS Modules with `className` prop for overrides

**Architecture:**

```
packages/review-components/src/
  index.ts                        # Barrel export
  types.ts                        # Shared TypeScript interfaces
  api/
    client.ts                     # ReviewApiClient — fetch-based, sends X-API-Key header
  hooks/
    useReviews.ts                 # Paginated data fetching for ReviewList
    useSubmitReview.ts            # Submission state management for ReviewForm
  components/
    ReviewForm.tsx                # Review submission form
    ReviewList.tsx                # Paginated review display
  styles/
    reviewForm.module.css         # Default styles
    reviewList.module.css         # Default styles
```

**`ReviewApiClient`** — a lightweight class wrapping native `fetch`. Handles `X-API-Key` headers, JSON serialization, and error extraction. Exported for advanced users who want to build custom UI.

**`<ReviewForm />` props and behavior:**

```tsx
<ReviewForm
  apiKey="rk_..." // required — organization's API key
  apiBaseUrl="https://api.app.com" // required — backend URL
  productId="64f..." // optional — scope to a product
  onSuccess={(review) => {}} // optional — callback after success
  onError={(error) => {}} // optional — callback on failure
  className="custom-class" // optional — CSS override
/>
```

Renders: star rating selector (1-5), text area with character count, name input, email input (type="email"), submit button with loading state, error display, and a thank-you message on success.

Client-side validation before API call: rating selected, text non-empty, name non-empty, email format check.

**`<ReviewList />` props and behavior:**

```tsx
<ReviewList
  apiKey="rk_..."
  apiBaseUrl="https://api.app.com"
  productId="64f..." // optional — omit for all org reviews
  pageSize={10} // optional — default 10
  className="custom-class"
/>
```

Renders: review cards (star rating, reviewer name, date, text), Previous/Next pagination controls, loading skeleton, empty state ("No reviews yet"), and error state with retry button.

**Consumer usage example:**

```tsx
import { ReviewForm, ReviewList } from '@review-app/components';

function ProductPage({ productId }: { productId: string }) {
  return (
    <div>
      <ReviewList
        apiKey="rk_7G3kLm9xQp..."
        apiBaseUrl="https://api.myapp.com"
        productId={productId}
        pageSize={10}
      />
      <ReviewForm
        apiKey="rk_7G3kLm9xQp..."
        apiBaseUrl="https://api.myapp.com"
        productId={productId}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
```

**Package exports:**

- Components: `ReviewForm`, `ReviewList`
- API client: `ReviewApiClient` (for custom integrations)
- Types: `ReviewFormProps`, `ReviewListProps`, `PublicReview`, `PaginatedResponse`, `SubmitReviewPayload`

---

### Phase 5: Analytics (Future)

Detailed analytics derived from review data, planned for a later stage once the review collection pipeline is established:

- **Rating distributions** — histograms per product and per organization.
- **Trend analysis** — average rating over time, review volume trends.
- **Sentiment insights** — text analysis to surface common themes and sentiment shifts.
- **Product comparisons** — side-by-side rating and volume metrics across products.
- **Reviewer patterns** — repeat reviewers, geographic or temporal patterns.
- **Dashboard widgets** — embeddable analytics components for the organization admin panel.

---

### Infrastructure & Quality Improvements

- Expand test coverage to integration/e2e (auth, invitation, and review flows).
- Add request schema validation (e.g., Zod/Joi) for all route bodies/params.
- Add richer OpenAPI schemas (request/response examples and auth components).
- Add Dockerfile + docker-compose for consistent local setup.
- Add CI (lint + build + test gates).
- Harden security defaults (rate limiting, helmet, stricter CORS config).
- Review moderation workflow for organization admins.
- Webhook notifications for new reviews.

---

## Notes for Contributors

- Keep route/module boundaries explicit (controller → service → repository).
- Prefer throwing `AppError` for expected failures.
- Keep environment variables in sync with `.env.template` and startup checks.

# AGENTS.md

This file provides guidance for coding agents working in this repository.

> Whenever you discover something useful about this codebase — a pattern, a gotcha, a convention, or a workflow detail that is likely to help in future sessions — add it to **Gotchas & Lessons Learned** under the appropriate section.

---

## Session Initialization

At the start of each session:

1. Run `git status` and summarize the repo state in one sentence
2. State the current active phase from the **Roadmap**
3. If the user has already given a concrete task, begin immediately
4. If the task is unclear, ask what we are working on today before making changes

---

## Core Working Style

Follow this workflow for implementation tasks:

1. Read the minimum relevant existing files in the affected area first
2. Summarize what you are about to change and why
3. If something is genuinely ambiguous and blocks correct implementation, ask for clarification
4. Otherwise proceed
5. Keep changes scoped to the requested task and current roadmap phase

After finishing:

* If you learned something durable and useful about the codebase, add it to **Gotchas & Lessons Learned**
* Do not add trivial observations or temporary debugging notes

---

## Agent Delegation Rules

Use subagents when the environment supports them and the task clearly benefits from parallel exploration, isolated review, or separate research threads.

Examples where subagents are preferred:

* Broad research across multiple modules
* Parallel workstreams with little overlap
* Independent code review after implementation
* Consistency checks across several modules

If subagents are **not** available in the current environment:

* Continue in a single thread
* Read only the most relevant files first
* Summarize findings before expanding scope
* Avoid blocking progress solely because delegation is unavailable

Do **not** stop work just because a preferred delegation mechanism is unavailable.

---

## Automatic Behaviors

### When asked to create a new API module

Prefer first studying an existing module with a similar shape, such as `product` or `review`.

Then:

* Create the full layer structure
* Mount routes in `app.ts`
* Update OpenAPI docs
* Create a test file at `apps/api/src/tests/<module>.test.ts`

Expected layer structure:

```txt
modules/<feature>/
  <feature>.controller.ts
  <feature>.service.ts
  <feature>.repository.ts
  <feature>.model.ts
  <feature>.routes.ts
```

### When asked to add an API endpoint

Work bottom-up in this order:

1. repository
2. service
3. controller
4. routes
5. OpenAPI docs

Ask questions only if a real API contract or business-rule ambiguity prevents correct implementation.

### When asked to create a frontend page

Before implementing:

* Identify the correct route group
* Preserve existing auth and routing conventions

Always enforce:

* `hydrated` flag checks before reading auth state on the client
* `apps/web/src/lib/api.ts` for API calls
* no manual locale prefixes in links

### Before every response involving code changes

Check the planned change against the **Hard No's**.

If something violates a rule:

* fix it before presenting the result
* do not preserve invalid patterns just because they appeared in a draft

---

## Current Focus

Active phase: **Phase 3 — Reviews & Public API**

Do not scaffold or implement future roadmap phases unless explicitly requested.

---

## Hard No's

Never do any of the following:

* Query MongoDB directly in controllers
* Use Mongoose queries outside the repository layer
* Store or log raw API keys
* Use `any` in TypeScript without an inline comment explaining why
* Bypass `AppError` for expected application failures
* Throw raw `Error` objects in controllers or services for expected failures
* Add a new env var without updating both `.env.template` and the startup validation helper
* Use React class components
* Manually construct error response payloads in controllers or services

Always:

* use the repository layer for data access
* use `throw new AppError(message, statusCode)` for expected failures
* let centralized error middleware produce error responses

---

## Gotchas & Lessons Learned

### Backend

* MongoDB transactions only work on replica sets — always handle the fallback path (manual rollback). See org creation service for a reference pattern.
* Raw API key is shown exactly once on creation — it is never stored, only the SHA-256 hash and the first 8-character `keyPrefix` are persisted.
* `reviewerEmail` and `status` must always be stripped before returning public review responses — enforce this in the service layer, not the controller.

### Frontend

* Zustand auth store has a `hydrated` flag — always check it before reading auth state on the client to avoid SSR mismatches.
* Refresh token is an HTTP-only cookie scoped to path `/auth/refresh` only — do not expect it to be available elsewhere.
* `next-intl` locale prefix is `'never'` — URLs are `/page`, not `/en/page`; never add locale prefixes manually to links or redirects.

---

## Repository Overview

Turborepo monorepo for a reviews-as-a-service platform. Two apps share an npm workspace:

* `apps/api` — Express 5 + TypeScript + MongoDB backend
* `apps/web` — Next.js + React + TypeScript frontend

### Vision

Organizations sign up, create API keys, register products, and embed React components on their websites to collect and display customer reviews.

---

## Where to Look

| I need to...                       | Start here                                       |
| ---------------------------------- | ------------------------------------------------ |
| Add a new API endpoint             | `modules/<feature>/<feature>.routes.ts`          |
| Change business logic              | `modules/<feature>/<feature>.service.ts`         |
| Change DB queries                  | `modules/<feature>/<feature>.repository.ts`      |
| Add a new page                     | `apps/web/src/app/...`                           |
| Make an API call from the frontend | `apps/web/src/lib/api.ts`                        |
| Add or change global state         | `apps/web/src/store/`                            |
| Add/change JWT auth protection     | `apps/api/src/middlewares/auth.middleware.ts`    |
| Add/change API key protection      | `apps/api/src/middlewares/apiKey.middleware.ts`  |
| Add/update OpenAPI docs            | `apps/api/src/docs/openapi.ts`                   |
| Add a new env var                  | `.env.template` plus `apps/api/src/helpers/env/` |

---

## Architecture

### API — `apps/api/src/`

Use a strict layered module structure and do not skip layers.

```txt
modules/<feature>/
  <feature>.controller.ts   # HTTP request/response only — no business logic
  <feature>.service.ts      # Business logic — no Mongoose queries
  <feature>.repository.ts   # Mongoose queries only
  <feature>.model.ts        # Mongoose schema/model
  <feature>.routes.ts       # Express router + middleware wiring
```

Current modules:

* `auth`
* `organization`
* `organizationMembership`
* `user`
* `email`
* `product`
* `review`

### Key API files

* `apps/api/src/app.ts` — Express app composition, route mounting, middleware registration
* `apps/api/src/server.ts` — bootstrap: env validation, DB connection, server start
* `apps/api/src/errors/app.error.ts` — `AppError(message, statusCode)` for expected failures
* `apps/api/src/middlewares/error.middleware.ts` — central error handler
* `apps/api/src/middlewares/auth.middleware.ts` — JWT Bearer token guard; attaches `req.user`
* `apps/api/src/middlewares/apiKey.middleware.ts` — `X-API-Key` guard; sets `req.apiKeyOrganizationId`

### Authentication flow

1. Register → verification token sent by email
2. Verify email → account activated
3. Login → `accessToken` in response body and `refreshToken` as HTTP-only cookie on `/auth/refresh`
4. Protected routes use `Authorization: Bearer <accessToken>`
5. On 401, `POST /auth/refresh` rotates tokens

### Public API key flow

* Org admin generates a key via `POST /organization/:orgId/api-keys`
* Raw key is shown once
* Public clients send `X-API-Key: rk_...`
* Backend hashes and validates the key
* `organizationId` is derived from the key, not trusted from client input

### MongoDB transactions

Organization creation uses transactions on replica sets and must support a safe fallback path when transactions are unavailable.

---

## Web — `apps/web/src/`

Next.js App Router structure with route groups.

Typical structure:

```txt
app/
  (marketing)/
  (auth)/
  app/
    orgs/[id]/
    invitations/[id]/
```

### Key frontend files

* `apps/web/src/lib/api.ts` — Axios instance; request interceptor adds JWT, response interceptor handles 401 refresh flow
* `apps/web/src/store/auth.ts` — Zustand store persisted to `localStorage`, includes `hydrated`
* `apps/web/src/middleware.ts` — `next-intl` middleware

### i18n

* `defaultLocale: 'en'`
* locale prefix: `'never'`
* route generation and links must not manually include locale prefixes

---

## API Response Conventions

### Success

```json
{ "data": { ... } }
```

### Error

Generated by centralized error middleware:

```json
{ "message": "Something went wrong" }
```

Do not manually construct this shape in route handlers.

---

## Testing

* Runner: Node.js built-in test runner
* DB: `mongodb-memory-server`
* Do not manually mock Mongoose for core module tests
* Test the service layer primarily
* Controller behavior is typically thin and covered indirectly
* Repository behavior is validated through service-level integration where appropriate

Test file location:

```txt
apps/api/src/tests/<module>.test.ts
```

Run a single API test file from `apps/api/`:

```bash
npm run build && node --test dist/tests/<file>.test.js
```

---

## Commands

Run from repo root unless noted otherwise.

### Workspace

```bash
npm install
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
```

### API-only (`apps/api/`)

```bash
npm run lint:fix
npm run format
npm run test
```

---

## Environment Setup

### API

Copy `apps/api/.env.template` to `apps/api/.env`.

Expected variables include:

* `NODE_ENV`
* `PORT`
* `SERVER_URL`
* `MONGODB_URL`
* `FRONTEND_URL`
* `JWT_ACCESS_SECRET`
* `SMTP_HOST`
* `SMTP_PORT`
* `SMTP_SECURE`
* `SMTP_USER`
* `SMTP_PASS`

### Web

`apps/web/.env`

```env
NEXT_PUBLIC_API_URL=http://localhost:3333
```

When introducing a new environment variable, update:

1. `.env.template`
2. the startup validation helper

---

## API Documentation

OpenAPI 3.0 spec is served at:

```txt
GET /docs/openapi.json
```

Source:

* `apps/api/src/docs/openapi.ts`

Whenever an endpoint contract changes, update the OpenAPI spec in the same task unless explicitly told not to.

---

## Roadmap

1. ✅ **API Key System** — generate/revoke keys scoped to an organization
2. ✅ **Product Management** — products with slugs unique per org
3. 🔄 **Reviews & Public API** — public (API-key) and private (JWT) review endpoints with pagination
4. ⬜ **Embeddable NPM package** — `@review-app/components` in `packages/review-components/`
5. ⬜ **Analytics** — rating distributions, trends, sentiment

---

## Change Scope Rules

When implementing work:

* prefer small, surgical changes over broad refactors
* preserve existing naming and file structure unless explicitly asked to improve them
* do not introduce new abstractions unless repetition or complexity clearly justifies them
* do not drift into future roadmap phases
* do not silently change unrelated behavior

If you notice a nearby issue that is important but out of scope:

* mention it briefly in the final summary
* do not fix it unless it directly blocks the requested task

---

## Final Response Expectations

When reporting completed work:

* summarize what changed
* mention any important assumptions
* mention any validations run, if any
* mention any durable gotcha added to this file, if applicable

Keep final summaries concise and concrete.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Whenever you discover something useful about this codebase — a pattern, a gotcha, a convention — add it to CLAUDE.md under the appropriate section.

---

## Session Initialization

Automatically at the start of every session, before anything else:
1. Run `git status` and summarize what's changed in one sentence
2. State the current active phase from the Roadmap section
3. Ask "What are we working on today?" and wait for my answer before doing anything

---

## Workflow (follow this every time)

Before writing **any** code:

1. Read all relevant existing files in the affected module first
2. State what you're about to do and why
3. Ask if anything is unclear before starting
4. Only then write code

After finishing:

- If you learned something new about the codebase (a pattern, a gotcha, a convention), add it to the **Gotchas & Lessons Learned** section before closing

---

## Automatic Behaviors

### When I ask you to create a new module
- Spawn a read-only agent to study an existing module (prefer `product` or `review`) first
- Create all 5 files in the correct layer structure
- Mount routes in `app.ts`
- Update OpenAPI docs
- Create a test file at `apps/api/src/tests/<module>.test.ts`

### When I ask you to add an endpoint
- Go bottom-up: repository → service → controller → routes → OpenAPI
- Ask clarifying questions before writing anything

### When I ask you to create a frontend page
- Confirm which route group it belongs to before writing anything
- Enforce: `hydrated` flag check, `lib/api.ts` for all API calls, no locale prefix in links

### Before every response that involves code changes
- Verify changes don't violate any Hard No's before showing me the code
- If a violation is found, fix it silently — don't ask me, just do it right

---

## Agent Delegation Rules

You MUST use subagents for the following — never do these inline:

- Reading more than 2 existing files for research → spawn a read-only explore agent
- Any task with distinct parallel workstreams → spawn one agent per workstream
- Code review after implementation → spawn a separate review agent with fresh context
- Checking multiple modules for consistency → spawn parallel agents, one per module

Doing these inline in your main context is not allowed. Delegate first, then act on the results.

---

## Current Focus

Active phase: **Phase 5 — Analytics**

Don't scaffold or implement future phases unless explicitly asked.

---

## Hard No's (never do these)

- Never query MongoDB directly in controllers — repository layer only
- Never store or log raw API keys — SHA-256 hash only
- Never use `any` in TypeScript without an inline comment explaining why
- Never bypass `AppError` — no raw `throw new Error()` in controllers or services
- Never add a new env var without updating both `.env.template` AND the startup validation helper
- Never use React class components
- Never manually construct error responses — always `throw new AppError(message, statusCode)`
- Never add Mongoose queries outside the repository layer

---

## Gotchas & Lessons Learned

- MongoDB transactions only work on replica sets — always handle the fallback path (manual rollback). See org creation service for reference implementation.
- Zustand auth store has a `hydrated` flag — always check it before reading auth state on the client to avoid SSR mismatches
- Refresh token is an HTTP-only cookie with `path: '/'` — intentional so it is sent to both `/auth/refresh` (rotation) and `/auth/logout` (revocation). Scoping it to `/auth/refresh` would break logout since the controller reads `req.cookies.refreshToken` to revoke the DB token.
- next-intl locale prefix is `'never'` — URLs are `/page` not `/en/page`, never add locale prefix manually to links or redirects
- `reviewerEmail` and `status` must always be stripped before returning public review responses — enforce this in the service layer, not the controller
- Review CRUD uses `externalProductId` end-to-end; never expose internal product `_id` in review responses
- Raw API key is shown exactly once on creation — it is never stored, only the SHA-256 hash and the first 8-char `keyPrefix` are persisted
- The embeddable components follow a shadcn-style model: `@reviewlico/cli` copies source files into the consumer's project. `packages/review-components` is the source registry and is **not** a runtime dependency for anyone
- CLI registry path: `packages/cli/dist/index.js` resolves the registry as `../../review-components` (two levels up from `dist/`). If the CLI is ever published independently without the monorepo, the component files must be bundled or embedded at build time
- `toPublicReview` in `review.service.ts` is the authoritative definition of `PublicReview` — only `_id`, `externalProductId?`, `rating`, `text`, `reviewerName`, `createdAt`. Keep `packages/review-components/shared/types.ts` in sync with this

---

## Repository Overview

Turborepo monorepo for a reviews-as-a-service platform. Two apps and two packages share an npm workspace:

- `apps/api` — Express 5 + TypeScript + MongoDB backend (port 3333)
- `apps/web` — Next.js 16 + React 19 + TypeScript frontend (port 3000)
- `packages/review-components` — Component source registry; plain CSS + Tailwind variants of `ReviewForm` and `ReviewList`; NOT published to npm (private)
- `packages/cli` — `@reviewlico/cli`; published to npm; copies component source into the dev's own project (shadcn model)

**Vision:** Organizations sign up, create API keys, register products, and embed React components on their websites to collect and display customer reviews.

---

## Where to Look

| I need to...                              | Start here                                              |
|-------------------------------------------|---------------------------------------------------------|
| Add a new API endpoint                    | `modules/<feature>/<feature>.routes.ts`                |
| Change business logic                     | `modules/<feature>/<feature>.service.ts`               |
| Change DB queries                         | `modules/<feature>/<feature>.repository.ts`            |
| Add a new page                            | `apps/web/src/app/[locale]/app/...`                    |
| Make an API call from the frontend        | Use the Axios instance at `apps/web/src/lib/api.ts`    |
| Add or change global state                | `apps/web/src/store/` (Zustand)                        |
| Add/change JWT auth protection            | `apps/api/src/middlewares/auth.middleware.ts`           |
| Add/change API key protection             | `apps/api/src/middlewares/apiKey.middleware.ts`         |
| Add/update OpenAPI docs                   | `apps/api/src/docs/openapi.ts`                         |
| Add a new env var                         | `.env.template` + `apps/api/src/helpers/env/`          |
| Edit embeddable component source          | `packages/review-components/registry/<plain\|tailwind>/` |
| Edit shared hooks/types/api client        | `packages/review-components/shared/`                   |
| Edit CLI commands or copy logic           | `packages/cli/src/`                                    |
| Add a new embeddable component            | Add to `packages/review-components/registry/`, then register in `packages/cli/src/lib/registry.ts` |

---

## Architecture

### API — `apps/api/src/`

Strict layered module structure — never skip a layer:

```
modules/<feature>/
  <feature>.controller.ts   # HTTP request/response only — no business logic
  <feature>.service.ts      # Business logic — no Mongoose queries
  <feature>.repository.ts   # Mongoose queries only
  <feature>.model.ts        # Mongoose schema/model
  <feature>.routes.ts       # Express router + middleware wiring
```

Current modules: `auth`, `organization`, `organizationMembership`, `user`, `email`, `product`, `review`

**Key files:**
- `apps/api/src/app.ts` — Express app composition, route mounting, middleware registration
- `apps/api/src/server.ts` — Bootstrap: env validation, DB connection, server start
- `apps/api/src/errors/app.error.ts` — `AppError(message, statusCode)` — throw this for all expected failures
- `apps/api/src/middlewares/error.middleware.ts` — Central error handler; catches AppError and unknown errors
- `apps/api/src/middlewares/auth.middleware.ts` — JWT Bearer token guard; attaches `req.user`
- `apps/api/src/middlewares/apiKey.middleware.ts` — `X-API-Key` guard; sets `req.apiKeyOrganizationId`

**Authentication flow:**
1. Register → email verification token sent via Nodemailer
2. Verify email → account activated
3. Login → `accessToken` (JWT, 15m) in response body + `refreshToken` (HTTP-only cookie, path `/auth/refresh`)
4. Protected routes: `Authorization: Bearer <accessToken>`
5. On 401 → `POST /auth/refresh` rotates both tokens

**Public (API key) flow:**
- Org admin generates key via `POST /organization/:orgId/api-keys`; raw key shown once
- Public clients send `X-API-Key: rk_...` header; backend hashes and validates
- `organizationId` is derived from the key — not from the URL

**MongoDB transactions:** Organization creation uses transactions on replica sets; falls back to manual rollback otherwise.

### Web — `apps/web/src/`

Next.js App Router with route groups:

```
app/[locale]/
  (marketing)/    # Public marketing pages
  (auth)/         # login, register, verify-email
  app/            # Protected section (auth-guarded layout)
    orgs/[id]/
    invitations/[id]/
```

**Key files:**
- `apps/web/src/lib/api.ts` — Axios instance; request interceptor adds JWT, response interceptor handles 401 with token refresh queue
- `apps/web/src/store/auth.ts` — Zustand store persisted to `localStorage` under key `reviewlico-auth`; includes `hydrated` flag for SSR safety
- `apps/web/src/middleware.ts` — next-intl middleware for locale routing

**i18n:** next-intl with `defaultLocale: 'en'`, locale prefix `'never'` (URLs are `/page`, not `/en/page`).

---

## API Response Conventions

Success:
```json
{ "data": { ... } }
```

Error (generated automatically by error middleware — never construct manually):
```json
{ "message": "Something went wrong" }
```

---

## Testing

- **Runner:** Node.js built-in (`node:test`) — not Jest, not Vitest
- **DB:** `mongodb-memory-server` — always use it, never mock Mongoose manually
- **Location:** `apps/api/src/tests/<module>.test.ts`
- Each test file sets up and tears down its own DB state
- Test the **service layer** primarily — controllers are thin, repositories are tested implicitly
- Run a single file: `cd apps/api && npm run build && node --test dist/tests/<file>.test.js`

---

## Commands

Run from repo root unless noted:

```bash
npm install          # Install all workspace dependencies
npm run dev          # Start both apps in parallel (watch mode)
npm run build        # Build all apps
npm run lint         # ESLint across all workspaces
npm run typecheck    # TypeScript type-check (no emit)
npm run test         # Run all tests
```

API-only (from `apps/api/`):
```bash
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Prettier format
npm run test         # Compile TS + run tests
```

---

## Environment Setup

**API** — copy `apps/api/.env.template` to `apps/api/.env`:
`NODE_ENV`, `PORT`, `SERVER_URL`, `MONGODB_URL`, `FRONTEND_URL`, `JWT_ACCESS_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`

**Web** — `apps/web/.env`:
```
NEXT_PUBLIC_API_URL=http://localhost:3333
```

---

## API Documentation

OpenAPI 3.0 spec served at `GET /docs/openapi.json` (importable into Postman/Insomnia).
Source: `apps/api/src/docs/openapi.ts`

---

## Roadmap

1. ✅ **API Key System** — generate/revoke keys scoped to an organization
2. ✅ **Product Management** — products with slugs unique per org
3. ✅ **Reviews & Public API** — public (API-key) and private (JWT) review endpoints with pagination
4. ✅ **Embeddable CLI package** — `@reviewlico/cli` copies `ReviewForm`/`ReviewList` source into dev projects (shadcn model); plain CSS and Tailwind variants; source lives in `packages/review-components/`
5. 🔄 **Analytics** — rating distributions, trends, sentiment ← *current*

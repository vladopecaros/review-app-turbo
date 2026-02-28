# review-app-turbo

Monorepo for the Review App backend and frontend using npm workspaces + Turborepo.

## Workspace Layout

- `apps/api` - Express + TypeScript backend
- `apps/web` - Next.js frontend

## Prerequisites

- Node.js 20+
- npm 10+

## Install

```bash
npm install
```

## Run in Development

```bash
npm run dev
```

This runs both workspaces:

- frontend at `http://localhost:3000`
- backend at `http://localhost:3333`

## Common Commands

```bash
npm run build
npm run lint
npm run typecheck
npm run test
```

## Environment

- API env files live in `apps/api` (`.env`, `.env.template`).
- Web env files live in `apps/web` (`.env`).
- Default local API URL for web is `NEXT_PUBLIC_API_URL=http://localhost:3333`.

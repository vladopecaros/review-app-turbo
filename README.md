# review-app-turbo

Monorepo for the Review App backend and frontend using npm workspaces + Turborepo.

## Workspace Layout

- `apps/api` - Express + TypeScript backend
- `apps/web` - Next.js frontend
- `packages/review-components` - Component source registry (plain CSS + Tailwind variants)
- `packages/cli` - `@reviewlico/cli` — the npx tool that copies components into third-party projects

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

## Embeddable Components

The `@reviewlico/cli` package lets third-party developers drop reviewlico components directly into their own projects. Components are copied as editable source files — no black-box dependency.

```bash
# Add a component (prompts for output path on first run)
npx @reviewlico/cli add ReviewForm

# Tailwind variant
npx @reviewlico/cli add ReviewList --styles tailwind

# See all available components
npx @reviewlico/cli list
```

After running, files land in your configured directory (e.g. `src/components/reviews/`). Import them directly from your project — edit them however you like.

### Configuration via env vars (recommended)

Set your API URL and key in your project's env file so they never appear hardcoded in JSX:

```bash
# .env (Vite)
VITE_REVIEWLICO_API_URL=https://api.example.com
VITE_REVIEWLICO_API_KEY=rk_live_...

# .env.local (Next.js)
NEXT_PUBLIC_REVIEWLICO_API_URL=https://api.example.com
NEXT_PUBLIC_REVIEWLICO_API_KEY=rk_live_...
```

> **Note:** The API key is a client-side embed key — it will be visible in the browser bundle. This is expected (same model as Stripe publishable keys). Keep your secret keys server-side.

> **Supported frameworks:** Vite and Next.js. CRA is not supported.

With env vars set, `config` props are optional:

```tsx
import { ReviewForm } from './components/reviews/ReviewForm';

// Reads API URL and key from env automatically
<ReviewForm config={{ externalProductId: 'prod-001' }} />

// Or pass explicitly (e.g. to override per-component)
<ReviewForm config={{ apiUrl: 'https://api.example.com', apiKey: 'rk_...', externalProductId: 'prod-001' }} />
```

Available components: `ReviewForm`, `ReviewList`.

## Environment

- API env files live in `apps/api` (`.env`, `.env.template`).
- Web env files live in `apps/web` (`.env`).
- Default local API URL for web is `NEXT_PUBLIC_API_URL=http://localhost:3333`.

# Reviewlico — Frontend Development Plan
> Development-ready codex. Hand this to a developer or an AI coding agent as the source of truth.

---

## 0. North Star

Dark-mode, modern SaaS. Visual reference: [cronlex.com](https://www.cronlex.com/) — clean, technical, high-contrast, bold typographic hierarchy, minimal noise. The homepage (`/`) is the marketing entry point; every authenticated screen lives under `/app`.

**No pricing page.** No film grain. Mobile-first throughout.

---

## 1. Tech Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v3 |
| Component primitives | shadcn/ui |
| Animation | Framer Motion |
| State management | Zustand |
| HTTP client | Axios |
| i18n | next-intl (default + only locale: `en`) |
| Linting | ESLint + Prettier |
| Package manager | pnpm |

---

## 2. Rendering Strategy

> **SSR/SSG must be maximized. Every page that does not require auth state should be server-rendered or statically generated. No exceptions.**

| Route | Strategy | Reason |
|---|---|---|
| `/` | **SSG** | Static marketing content |
| `/security` | **SSG** | Static content |
| `/login` | **SSG** (form is a Client Component island) | Shell is static |
| `/register` | **SSG** (form is a Client Component island) | Shell is static |
| `/auth/verify-email` | **SSR** | Reads `?token=` query param server-side |
| `/app` | **CSR** (client guard) | Requires `accessToken` from localStorage |
| `/app/orgs/[id]` | **CSR** (client guard) | Requires `accessToken` from localStorage |
| `/app/invitations/[id]` | **CSR** (client guard) | Requires `accessToken` from localStorage |

**Rule:** The authenticated section (`/app/**`) cannot use Server Components for data fetching because `accessToken` is stored in localStorage, which is inaccessible server-side. All `/app/**` pages must have `'use client'` at the top (or wrap in a CSR shell) and use a `useAuthGuard` hook before rendering anything.

Marketing pages and auth shells must never ship client JS for layout — only hydrate interactive islands (forms, nav burger menu).

---

## 3. Project Structure

```
reviewlico/
├── messages/
│   └── en.json                        # All UI strings (next-intl)
├── next.config.ts
├── tailwind.config.ts
├── components.json                    # shadcn config
├── src/
│   ├── i18n/
│   │   ├── routing.ts                 # defineRouting({ locales: ['en'], defaultLocale: 'en' })
│   │   └── request.ts                 # getRequestConfig
│   ├── middleware.ts                  # next-intl middleware only (NO auth gating)
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx             # Root layout: fonts, NextIntlClientProvider, Toaster
│   │   │   ├── (marketing)/
│   │   │   │   ├── page.tsx           # / — homepage (SSG)
│   │   │   │   └── security/
│   │   │   │       └── page.tsx       # /security (SSG)
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx       # SSG shell + CSR form island
│   │   │   │   ├── register/
│   │   │   │   │   └── page.tsx       # SSG shell + CSR form island
│   │   │   │   └── auth/
│   │   │   │       └── verify-email/
│   │   │   │           └── page.tsx   # SSR: reads ?token=, calls backend, shows result
│   │   │   └── app/
│   │   │       ├── layout.tsx         # AppShell: sidebar + topbar (CSR, useAuthGuard)
│   │   │       ├── page.tsx           # /app — org list + create org
│   │   │       ├── orgs/
│   │   │       │   └── [id]/
│   │   │       │       └── page.tsx   # Org detail, API key, invite form
│   │   │       └── invitations/
│   │   │           └── [id]/
│   │   │               └── page.tsx   # Accept / decline invite
│   ├── components/
│   │   ├── ui/                        # shadcn/ui primitives (auto-generated)
│   │   ├── marketing/
│   │   │   ├── Navbar.tsx             # SSG-compatible, mobile hamburger as island
│   │   │   ├── Hero.tsx
│   │   │   ├── FeatureGrid.tsx
│   │   │   ├── HowItWorks.tsx
│   │   │   ├── CtaBanner.tsx
│   │   │   └── Footer.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx          # 'use client'
│   │   │   └── RegisterForm.tsx       # 'use client'
│   │   └── app/
│   │       ├── AppShell.tsx           # 'use client' — sidebar + topbar
│   │       ├── OrgList.tsx
│   │       ├── CreateOrgForm.tsx
│   │       ├── OrgDetail.tsx
│   │       ├── ApiKeySection.tsx
│   │       ├── InviteUserForm.tsx
│   │       └── InvitationActions.tsx
│   ├── hooks/
│   │   ├── useAuthGuard.ts            # Redirects to /login if no token; attempts refresh
│   │   └── useOrgs.ts
│   ├── lib/
│   │   ├── api.ts                     # Axios instance + interceptors
│   │   └── utils.ts                   # shadcn cn() helper
│   ├── store/
│   │   └── auth.ts                    # Zustand: { user, accessToken, setAuth, clearAuth }
│   └── types/
│       └── index.ts                   # Shared TypeScript interfaces
```

---

## 4. i18n Setup (next-intl)

### 4.1 Routing config
```ts
// src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en'],
  defaultLocale: 'en',
  localePrefix: 'never', // URLs stay clean: /login not /en/login
});
```

### 4.2 Middleware
```ts
// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
```
> ⚠️ Middleware must do **nothing but i18n**. No auth redirects in middleware (tokens are not readable server-side).

### 4.3 Root layout
```tsx
// app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function RootLayout({ children, params: { locale } }) {
  const messages = await getMessages();
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### 4.4 messages/en.json structure
```json
{
  "nav": {
    "login": "Log in",
    "getStarted": "Get started",
    "security": "Security"
  },
  "hero": {
    "badge": "API-first review management",
    "headline": "Collect and embed\ncustomer reviews.",
    "sub": "One API. Any platform. Real social proof.",
    "cta": "Start for free",
    "ctaSecondary": "Read the docs"
  },
  "features": { ... },
  "howItWorks": { ... },
  "cta": { ... },
  "footer": { ... },
  "auth": {
    "login": { "title": "Welcome back", "email": "Email", "password": "Password", "submit": "Log in", "noAccount": "Don't have an account?", "register": "Sign up", "errorUnverified": "Please verify your email before logging in.", "errorInvalid": "Invalid email or password." },
    "register": { "title": "Create your account", "email": "Email", "password": "Password", "submit": "Create account", "hasAccount": "Already have an account?", "login": "Log in", "successMessage": "Check your inbox — we sent you a verification email." },
    "verifyEmail": { "verifying": "Verifying your email…", "success": "Email verified! You can now log in.", "expired": "Link expired. A new verification email has been sent.", "error": "Something went wrong." }
  },
  "app": {
    "orgs": {
      "title": "Organizations",
      "empty": "You're not part of any organization yet.",
      "create": "New organization",
      "createTitle": "Create organization",
      "nameLabel": "Name",
      "slugLabel": "Slug",
      "submitCreate": "Create"
    },
    "orgDetail": {
      "apiKey": {
        "title": "API Key",
        "generate": "Generate API key",
        "warning": "This key will only be shown once. Copy it now.",
        "copied": "Copied!"
      },
      "invite": {
        "title": "Invite a member",
        "userIdLabel": "User ID",
        "roleLabel": "Role",
        "submit": "Send invite",
        "successPrefix": "Invite sent! Share this link:",
        "copyLink": "Copy invite link"
      }
    },
    "invitation": {
      "title": "You've been invited",
      "accept": "Accept",
      "decline": "Decline",
      "accepted": "You've joined the organization.",
      "declined": "Invitation declined."
    }
  },
  "common": {
    "loading": "Loading…",
    "error": "Something went wrong. Please try again.",
    "logout": "Log out",
    "back": "Back"
  }
}
```
> When adding a new language later, duplicate `en.json` → e.g. `fr.json`, add `'fr'` to `locales` array in `routing.ts`. Zero code changes required elsewhere.

---

## 5. Types

```ts
// src/types/index.ts

export interface User {
  id: string;
  email: string;
  role: 'user' | 'organization-admin' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  _id: string;
  name: string;
  slug: string;
}

export interface OrganizationMembership {
  _id: string;
  userId: string;
  role: string;
  status: string;
}

export interface Invitation {
  _id: string;
  userId: string;
  role: 'admin' | 'member';
  status: 'invited' | 'active';
}

export interface AuthResponse {
  user: User;
  accessToken: string | null;
}

export type InvitedUserRole = 'admin' | 'member';
```

---

## 6. Zustand Auth Store

```ts
// src/store/auth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => set({ user, accessToken }),
      clearAuth: () => set({ user: null, accessToken: null }),
    }),
    { name: 'reviewlico-auth', partialize: (s) => ({ accessToken: s.accessToken, user: s.user }) }
  )
);
```

---

## 7. Axios API Client

```ts
// src/lib/api.ts
import axios from 'axios';
import { useAuthStore } from '@/store/auth';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // e.g. http://localhost:4000
  withCredentials: true, // needed for refresh cookie (httpOnly, sameSite=lax, secure in prod, path=/)
});

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }
      isRefreshing = true;
      try {
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const { accessToken, user } = data;
        useAuthStore.getState().setAuth(user, accessToken);
        refreshQueue.forEach((cb) => cb(accessToken));
        refreshQueue = [];
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

**Auth cookie notes (backend behavior):**
- `refreshToken` cookie is `httpOnly`, `sameSite: "lax"`, `secure` in production, and **path `/`**.
- `POST /auth/logout` requires `Authorization: Bearer <accessToken>` **and** the refresh cookie.
- Logout UX should clear local auth even if `/auth/logout` returns `401`.

---

## 8. Auth Guard Hook

```ts
// src/hooks/useAuthGuard.ts
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';

export function useAuthGuard() {
  const router = useRouter();
  const { accessToken, setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    if (accessToken) return; // already authenticated

    // Attempt silent refresh via httpOnly cookie
    api.post('/auth/refresh')
      .then(({ data }) => setAuth(data.user, data.accessToken))
      .catch(() => {
        clearAuth();
        router.replace('/login');
      });
  }, []);

  return { isAuthenticated: !!accessToken };
}
```

**Usage in every `/app` page:**
```tsx
const { isAuthenticated } = useAuthGuard();
if (!isAuthenticated) return <FullPageSkeleton />;
```

---

## 9. API Endpoint Wrappers

```ts
// Auth
api.post('/auth/register', { email, password }) // returns { user, accessToken: null }
api.post('/auth/login', { email, password })
api.post('/auth/logout')
api.post('/auth/verify-email', null, { params: { token } }) // 201 success; 409 includes code: "EMAIL_VERIFICATION_EXPIRED_RESENT"

// Organizations
api.get('/organization')
api.post('/organization', { name, slug })
api.get(`/organization/${id}`)
api.get(`/organization/${id}/create-api-key`)   // returns { key, message } → use data.key

// Invitations
api.post(`/organization/${orgId}/invite-user`, { invitedUserId, invitedUserRole }) // returns { invitation, message }
api.put(`/organization-memberships/invitations/${inviteId}/accept`)
api.put(`/organization-memberships/invitations/${inviteId}/decline`)
```

---

## 10. Page-by-Page Spec

### 10.1 `/` — Homepage (SSG)

Sections (in order):
1. **Navbar** — Logo left, nav links center (`Security`), CTA right (`Log in`, `Get started` button). Sticky, blurred backdrop on scroll. Mobile: hamburger → slide-down drawer.
2. **Hero** — Large headline (split lines, staggered fade-in with Framer Motion), sub-copy, two CTA buttons, a code snippet block showing a sample API call (syntax-highlighted, purely visual/static).
3. **Feature Grid** — 3-column card grid (collapses to 1 on mobile). Each card: icon + title + one-line description. Features to highlight: API key access, multi-org support, invitation system, secure auth.
4. **How It Works** — 3-step horizontal timeline (stacks vertically on mobile): Register → Create Org → Generate API Key.
5. **CTA Banner** — Full-width dark section: headline + `Get started` button.
6. **Footer** — Logo, copyright, links to `/security` and `/login`.

> No JavaScript on the static shell. Navbar hamburger and scroll-based class toggling are the only interactive islands.

---

### 10.2 `/security` (SSG)

Static informational page. Sections:
- Auth approach (Bearer token + httpOnly refresh cookie)
- API key handling (generated once, never stored in plain text)
- HTTPS-only assumption

---

### 10.3 `/login` (SSG shell + CSR form)

- Static layout with the `LoginForm` client island.
- Form fields: `email`, `password`.
- On submit: `POST /auth/login` → store tokens → `router.push('/app')`.
- Error handling must branch on **status code**, not response message.
- Error cases: 403 unverified email, 401 invalid credentials.
- Link to `/register`.

---

### 10.4 `/register` (SSG shell + CSR form)

- Form: `email`, `password`.
- On success (`accessToken: null`): show success banner "Check your inbox".
- Do NOT redirect to `/app` — user must verify email first.
- Error handling should be status-code based (e.g., 409 user already exists).
- Link to `/login`.

---

### 10.5 `/auth/verify-email` (SSR)

- Server Component reads `searchParams.token`.
- Calls `POST /auth/verify-email?token=...` from the server.
- Renders result page: success (201) | expired + re-sent (409, `code: "EMAIL_VERIFICATION_EXPIRED_RESENT"`) | error.
- No client JS needed.

---

### 10.6 `/app` — Dashboard (CSR)

- `useAuthGuard()` at top.
- Fetches `GET /organization` on mount.
- Shows list of org cards (name, slug, link to `/app/orgs/[id]`).
- Empty state with prompt to create first org.
- Note: `GET /organization` may include **invited** memberships. If navigating to an org returns `403`, show a “Pending invitation” state and link to `/app/invitations/[id]` or otherwise handle gracefully.
- `CreateOrgForm` in a shadcn `Dialog` or inline form: fields `name` + `slug` (auto-slugify name, allow override). On success: optimistically add to list.
- Logout button in topbar: `POST /auth/logout` → `clearAuth()` (even if 401) → redirect to `/`.

---

### 10.7 `/app/orgs/[id]` — Org Detail (CSR)

**Sections:**

**Org Info**
- Display name, slug, ID.

**API Key**
- Button: "Generate API key".
- On click: `GET /organization/:id/create-api-key`.
- Display key in a monospace box with copy button.
- One-time warning banner: "This key will not be shown again."
- Once generated, show only a "Key generated" state (no re-fetch button — backend generates a new key each time, so intentionally gate with a confirmation modal).

**Invite Member**
- Form: `userId` (text input, ObjectId), `role` (select: `admin` | `member`).
- On submit: `POST /organization/:id/invite-user`.
- On success: read `invitationId = data.invitation._id`, then display copyable link `${origin}/app/invitations/${invitationId}`.

---

### 10.8 `/app/invitations/[id]` (CSR)

- `useAuthGuard()`.
- Shows invitation ID and two buttons: **Accept** / **Decline**.
- Accept: `PUT /organization-memberships/invitations/:id/accept` → show success state.
- Decline: `PUT /organization-memberships/invitations/:id/decline` → show declined state.
- Both states replace buttons with a status message + link back to `/app`.

---

## 11. Design System

### Color Palette (CSS variables in `globals.css`)
```css
:root {
  --bg:        #080b0f;
  --surface:   #0f1318;
  --border:    #1e2530;
  --muted:     #2a3242;
  --text:      #e8edf5;
  --text-muted:#6b7a8d;
  --accent:    #3b82f6;       /* electric blue — primary CTA */
  --accent-hover: #2563eb;
  --success:   #22c55e;
  --error:     #ef4444;
}
```

### Typography
- **Display / Headlines**: `Syne` (Google Fonts) — geometric, bold, distinctive
- **Body / UI**: `DM Sans` — clean, modern, readable at small sizes
- **Monospace** (API key, code snippets): `JetBrains Mono`

### Spacing & Radius
- Base spacing: 4px grid via Tailwind defaults
- Card radius: `rounded-xl` (12px)
- Button radius: `rounded-lg` (8px)
- Input radius: `rounded-lg`

### Motion Principles (Framer Motion)
- Page transitions: fade + slight upward translate (`y: 16 → 0`, `opacity: 0 → 1`, `duration: 0.35`)
- Stagger children on hero and feature grid: `staggerChildren: 0.08`
- Hover on cards: `scale: 1.015`, border color shift
- Modal open: scale from `0.96` + fade
- No looping animations (no spinning, no bouncing — keep it technical/calm)

### Mobile Breakpoints
- All grids: 1-col on `sm`, 2-col on `md`, 3-col on `lg`
- Sidebar on `/app`: collapses to bottom nav or hamburger drawer on `sm`
- Font sizes scale down one step on mobile (`text-5xl` → `text-3xl` for hero)
- Touch targets minimum 44×44px

---

## 12. Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

For production, point to the backend URL or the reverse-proxy path (e.g. `/api` if proxied via Next.js `rewrites`).
Backend CORS allows the frontend origin matching `FRONTEND_URL` (commonly `http://localhost:3000`). Ensure the frontend runs at that origin, or use same-origin `/api` proxying via Next.js rewrites to avoid CORS issues.

---

## 13. next.config.ts

```ts
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

export default withNextIntl({
  async rewrites() {
    // Proxy /api/* → backend in dev to avoid CORS
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ];
  },
});
```

---

## 14. shadcn/ui Components to Install

```bash
npx shadcn@latest add button input label card dialog select toast badge separator skeleton
```

---

## 15. Implementation Order

1. **Scaffold** — `create-next-app`, install deps, configure Tailwind + shadcn + next-intl, set up `globals.css` with design tokens, add fonts.
2. **Types + Store + API client** — `types/index.ts`, `store/auth.ts`, `lib/api.ts`.
3. **i18n** — `messages/en.json`, `routing.ts`, `request.ts`, middleware, root layout.
4. **Marketing pages** — Navbar, Hero, FeatureGrid, HowItWorks, CtaBanner, Footer → assemble `/` page. Then `/security`.
5. **Auth pages** — `/login`, `/register` (CSR form islands), `/auth/verify-email` (SSR).
6. **App shell** — `AppShell` with sidebar/topbar + `useAuthGuard`.
7. **`/app`** — Org list + `CreateOrgForm`.
8. **`/app/orgs/[id]`** — Org detail + API key section + invite form.
9. **`/app/invitations/[id]`** — Accept/decline flow.
10. **Polish** — Framer Motion animations, mobile QA, loading skeletons, error states, toast notifications.

---

## 16. Key Rules for the Coding Agent

- **Never** add auth logic to Next.js middleware. Middleware only handles i18n.
- **Never** use Server Components for data fetching inside `/app/**`. All data fetching there is client-side via Axios.
- **Always** `'use client'` for any component using hooks, Framer Motion, or Axios.
- **Always** render loading skeletons while `useAuthGuard` is resolving.
- **SSG pages must have zero runtime server dependencies** — no `fetch` in page components, only static JSX.
- `/auth/verify-email` is the **only** route that does a server-side API call (via `fetch` in a Server Component).
- All user-facing strings must go through `useTranslations()` from next-intl — no hardcoded English strings in JSX.
- API key: wrap the "Generate" action in a confirmation dialog to prevent accidental key rotation.
- Invite link: use `window.location.origin` client-side to build the full URL — not an env var.

Create a new frontend page for $ARGUMENTS.

## Pre-flight (do this first)

Spawn a read-only agent to:
- Read `apps/web/src/app/[locale]/` to understand the route group structure
- Read an existing page in the same route group as the target (auth, marketing, or app)
- Read `apps/web/src/lib/api.ts` to understand how API calls are made
- Read `apps/web/src/store/auth.ts` to understand the Zustand auth store shape

Report back what you found before writing anything.

## Questions to answer before writing code

1. Which route group does this page belong to?
   - `(marketing)/` — public, no auth required
   - `(auth)/` — login/register flow
   - `app/` — protected, requires authenticated user
2. What's the URL path? (remember: no locale prefix — `/page` not `/en/page`)
3. Does it fetch data? If so, from which API endpoint?
4. Does it need any new Zustand state, or does it read from existing stores?

Ask me these if they weren't specified in the command.

## Implementation

### Page file
- Create `apps/web/src/app/[locale]/<route-group>/<path>/page.tsx`
- Use the App Router pattern — async server component where possible, client component only when needed (interactivity, hooks, store access)
- If it's under `app/` (protected), verify the auth guard layout wraps it — don't add manual auth checks in the page itself

### API calls
- Always use the Axios instance from `apps/web/src/lib/api.ts` — never raw `fetch`
- The interceptor handles JWT injection and 401/refresh automatically

### Auth store access (client components only)
- Import from `apps/web/src/store/auth.ts`
- Always check the `hydrated` flag before reading auth state to avoid SSR mismatches:
  ```tsx
  const { user, hydrated } = useAuthStore()
  if (!hydrated) return null // or a skeleton
  ```

### i18n
- Use `next-intl` for any user-facing strings
- Never hardcode English strings directly in JSX if they'll need translation
- Locale prefix is `'never'` — use `/path` not `/en/path` in all links and redirects

## Final check

- [ ] Correct route group for the page's access level
- [ ] API calls go through `lib/api.ts`
- [ ] `hydrated` flag checked before reading auth store (if client component)
- [ ] No locale prefix in any links or redirects
- [ ] No class components
- [ ] Page is reachable — verify the URL makes sense in the existing route structure

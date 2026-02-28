Add a new endpoint to the $ARGUMENTS module.

## Pre-flight (do this first)

Spawn a read-only agent to:
- Read the existing `$ARGUMENTS` module (all 5 files)
- Read `apps/api/src/app.ts` to confirm how this module's routes are mounted
- Read `apps/api/src/docs/openapi.ts` to understand current doc coverage

Report back a summary of what exists before touching anything.

## Questions to answer before writing code

1. What HTTP method and path? (e.g. `POST /products/:productId/reviews`)
2. Is this a JWT-protected route, an API-key route, or public?
3. What does the request body / query params look like?
4. What does the success response look like?
5. What are the failure cases and their status codes?

Ask me these if they weren't specified in the command.

## Implementation order

Always go bottom-up through the layers:

1. **Repository** — add the Mongoose query method
2. **Service** — add the business logic, call the repository, throw `AppError` for failures
3. **Controller** — add the handler, call the service, return `{ data: result }`
4. **Routes** — wire the new controller method with the correct middleware
5. **OpenAPI** — document the new endpoint in `apps/api/src/docs/openapi.ts`

## Final check

- [ ] Layer boundaries respected — no Mongoose in service, no logic in controller
- [ ] All failure paths throw `AppError`, not raw `Error`
- [ ] Success response uses `{ data: ... }` shape
- [ ] Route has correct auth middleware applied
- [ ] OpenAPI doc updated
- [ ] No `any` types introduced

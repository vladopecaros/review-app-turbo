Create a new backend module named $ARGUMENTS.

## Pre-flight (do this first)

Spawn a read-only agent to:
- Read an existing module (prefer `product` or `review`) to understand the exact patterns in use
- Read `apps/api/src/app.ts` to understand how routes are mounted
- Read `apps/api/src/docs/openapi.ts` to understand the doc structure

Report back what you found before writing a single file.

## Files to create

Create all 5 files under `apps/api/src/modules/$ARGUMENTS/`:

### `$ARGUMENTS.model.ts`
- Define the Mongoose schema and TypeScript interface
- Export the model and the interface
- Use strict typing — no `any`

### `$ARGUMENTS.repository.ts`
- Only Mongoose queries here — no business logic
- Accepts typed parameters, returns typed results
- Import from the model file

### `$ARGUMENTS.service.ts`
- All business logic lives here
- Import from the repository — never touch Mongoose directly
- Throw `AppError(message, statusCode)` for all expected failures — never raw `throw new Error()`

### `$ARGUMENTS.controller.ts`
- HTTP request/response handling only — no business logic
- Call service methods, return responses
- Use `{ data: result }` shape for success responses
- Never manually construct error responses — let AppError bubble to the error middleware

### `$ARGUMENTS.routes.ts`
- Express router
- Wire up auth middleware (`authMiddleware`) or API key middleware (`apiKeyMiddleware`) as appropriate
- Mount controller methods on routes

## After creating files

1. Mount the new router in `apps/api/src/app.ts`
2. Add all new endpoints to `apps/api/src/docs/openapi.ts`
3. Create a test file at `apps/api/src/tests/$ARGUMENTS.test.ts` using Node.js built-in test runner and `mongodb-memory-server`

## Final check

Verify against CLAUDE.md Hard No's:
- [ ] No Mongoose queries in controllers or services
- [ ] No raw `throw new Error()` anywhere
- [ ] No `any` types without inline comments
- [ ] No raw API keys stored or logged
- [ ] No manually constructed error responses

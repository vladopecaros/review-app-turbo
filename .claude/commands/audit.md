Run a full audit of the codebase against CLAUDE.md conventions.

## Spawn three parallel read-only agents

### Agent 1 — Hard No's scanner
Scan all files in `apps/api/src/modules/` and check for:
- Mongoose queries in controllers or services (should only be in `.repository.ts`)
- Raw `throw new Error()` in controllers or services (must use `AppError`)
- TypeScript `any` without an inline explanatory comment
- Manually constructed error responses in controllers (should use AppError + middleware)
- Any hints of raw API key values being stored or logged

### Agent 2 — Architecture consistency checker
- Verify every module has all 5 required files (controller, service, repository, model, routes)
- Verify every module's routes are mounted in `apps/api/src/app.ts`
- Verify every module has at least one test file in `apps/api/src/tests/`
- Check that new env vars (if any) exist in both `.env.template` and the startup validation helper

### Agent 3 — OpenAPI coverage checker
- Compare routes registered in `apps/api/src/app.ts` against documented endpoints in `apps/api/src/docs/openapi.ts`
- Flag any endpoints that exist in the router but are missing from the OpenAPI spec

## Report format

For each agent, report:
- ✅ Passed checks
- ❌ Violations found (file path + line number if possible)
- ⚠️ Warnings (things that look suspicious but might be intentional)

## After the report

List any violations by priority:
1. **Critical** — security issues (raw keys, missing auth middleware)
2. **High** — architectural violations (wrong layer, raw errors)
3. **Medium** — missing docs, missing tests
4. **Low** — style/consistency issues

Ask me which ones to fix before proceeding.

# syntax=docker/dockerfile:1

# ---- base ----
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# ---- deps ----
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/review-components/package.json ./packages/review-components/package.json
COPY packages/cli/package.json ./packages/cli/package.json
RUN npm ci

# ---- api-build ----
FROM base AS api-build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
WORKDIR /app/apps/api
RUN npm run build

# ---- api-runner ----
FROM node:22-alpine AS api
WORKDIR /app

# Only copy production-relevant files
COPY --from=deps /app/node_modules ./node_modules
COPY --from=api-build /app/apps/api/dist ./dist
COPY --from=api-build /app/apps/api/package.json ./package.json

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3333
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3333/health || exit 1

CMD ["node", "dist/server.js"]

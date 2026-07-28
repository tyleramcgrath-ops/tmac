# Container image for self-hosted deployment (Coolify, Docker Compose, any
# OCI runtime). See COOLIFY_DEPLOYMENT.md for the required environment.
#
# Three stages so the runtime image carries no build toolchain, no dev
# dependencies and no source: deps -> builder -> runner.

# ---------------------------------------------------------------- deps ----
# package.json pins "engines": { "node": "22.x" }.
FROM node:22-alpine AS deps

# Next.js/SWC and sharp are glibc-linked; libc6-compat provides the shim.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# pnpm is pinned rather than "latest" so an upstream release cannot change
# how the lockfile resolves between builds.
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY package.json pnpm-lock.yaml ./
# --frozen-lockfile fails the build if package.json and the lockfile disagree,
# instead of silently resolving something the repo never tested.
RUN pnpm install --frozen-lockfile

# ------------------------------------------------------------- builder ----
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Telemetry is off by default here; the build must not phone home from a
# self-hosted pipeline.
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN pnpm build

# -------------------------------------------------------------- runner ----
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# The standalone server binds to HOSTNAME; the Node default of localhost
# would be unreachable from outside the container.
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# next.config.ts sets output:'standalone', so .next/standalone holds server.js
# plus only the traced production dependencies. static/ and public/ are not
# traced and have to be placed by hand.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# lib/foundation/migrate.ts reads lib/foundation/migrations/*.sql from
# process.cwd() at RUNTIME — migrations auto-apply on the first DB connect
# unless RF_SKIP_MIGRATE_ON_CONNECT=1. Next's tracing does currently copy
# these 12 .sql files into .next/standalone, so this line is redundant today.
# It is kept deliberately: that behaviour rests on a heuristic for a runtime
# fs.readdir rather than a documented guarantee, and if it ever regresses the
# app boots fine and then fails against an unmigrated database. Copying twice
# is free; debugging that is not.
COPY --from=builder --chown=nextjs:nodejs /app/lib/foundation/migrations ./lib/foundation/migrations

USER nextjs
EXPOSE 3000

# /api/health is an existing route; Coolify and Compose both read this.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]

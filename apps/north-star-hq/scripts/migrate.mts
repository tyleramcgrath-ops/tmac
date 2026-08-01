// Deploy-time migration entry point (`npm run db:migrate`, and part of
// `npm run build`).
//
// Migrations used to run on the first database connection of every cold start.
// That put a global advisory lock on the request path: an instance that only
// wanted to serve a read still queued behind it, and a stalled holder blocked
// everyone until the platform killed the request at its 300s ceiling. Applying
// schema is a deploy concern, not a per-request one — so it happens here, once,
// and the runtime sets RF_SKIP_MIGRATE_ON_CONNECT=1 to stay off that path.
//
// Exit codes matter to the build: a non-zero exit fails the deployment, which
// is what we want if the schema could not be brought up to date while the
// runtime is relying on this step having done it.

import { migrateCli } from '../lib/foundation/migrate.ts'

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL

// Vercel sets VERCEL_ENV for both production and preview builds. Both deploy to
// a serverless runtime that will skip migrate-on-connect, so a missing database
// there is a hard error rather than something to shrug off — mirroring
// resolveStoreEnv(), which likewise refuses to start without one.
const isDeployBuild = process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview'

if (!url) {
  if (isDeployBuild) {
    console.error(
      `[migrate] DATABASE_URL is required for a ${process.env.VERCEL_ENV} build. The deployed runtime does not ` +
        `migrate on connect, so skipping this step would leave the app serving against an un-migrated schema.`
    )
    process.exit(1)
  }
  // Local build with no database configured. The file store is used in that
  // case, and a local Postgres run without RF_SKIP_MIGRATE_ON_CONNECT still
  // migrates on connect, so there is nothing to do and nothing at risk.
  console.log('[migrate] no DATABASE_URL set — skipping (local build).')
  process.exit(0)
}

await migrateCli()

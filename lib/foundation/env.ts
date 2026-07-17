// Environment validation — fail clearly rather than degrade silently.
//
// Production MUST have DATABASE_URL (Postgres) and APP_SECRET. Vercel's
// filesystem is ephemeral, so a file-store fallback in production would
// silently lose all data — that is forbidden here. Development and tests may
// use the file store.

export type StoreKind = 'postgres' | 'file'

export interface StoreEnv {
  kind: StoreKind
  databaseUrl?: string
}

export class EnvError extends Error {}

function isProduction(): boolean {
  // Vercel sets VERCEL_ENV=production for prod deployments; otherwise fall
  // back to NODE_ENV. Preview deployments are treated as needing a DB too.
  return process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview' ||
    (process.env.NODE_ENV === 'production' && process.env.VERCEL !== undefined)
}

// Resolves which store to use and enforces production requirements.
// Throws EnvError with an actionable message when misconfigured.
export function resolveStoreEnv(): StoreEnv {
  const databaseUrl =
    process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL

  if (isProduction()) {
    if (!databaseUrl) {
      throw new EnvError(
        'DATABASE_URL is required in production. RankForge will not fall back to the ephemeral file store, which would silently lose all data on this platform. Provision a PostgreSQL database and set DATABASE_URL.'
      )
    }
    if (!process.env.APP_SECRET || process.env.APP_SECRET.length < 8) {
      throw new EnvError('APP_SECRET (min 8 chars) is required in production for sessions and credential encryption.')
    }
    return { kind: 'postgres', databaseUrl }
  }

  // Non-production: Postgres if configured, else file store for local/dev/test.
  return databaseUrl ? { kind: 'postgres', databaseUrl } : { kind: 'file' }
}

// APP_SECRET is required for any authenticated flow regardless of store.
export function requireAppSecret(): void {
  if (!process.env.APP_SECRET || process.env.APP_SECRET.length < 8) {
    throw new EnvError('APP_SECRET (min 8 chars) must be set for authentication.')
  }
}

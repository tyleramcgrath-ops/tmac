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
    if (!process.env.APP_SECRET || process.env.APP_SECRET.length < 32) {
      throw new EnvError('APP_SECRET (min 32 chars) is required in production for sessions and credential encryption. Generate one with: openssl rand -base64 32')
    }
    return { kind: 'postgres', databaseUrl }
  }

  // Non-production: Postgres if configured, else file store for local/dev/test.
  return databaseUrl ? { kind: 'postgres', databaseUrl } : { kind: 'file' }
}

// Google OAuth (Phase H). The Connect-Google flow needs a Google Cloud OAuth
// client. These are read from env so the deployment owner supplies them in
// Vercel; RankForge never ships credentials. When unset, the flow reports
// "not configured" instead of failing obscurely (see the start route).
export interface GoogleOAuthConfig {
  clientId: string
  clientSecret: string
  // Optional explicit redirect base (e.g. https://app.example.com). When unset,
  // the callback URL is derived from the incoming request origin, which works
  // for Vercel preview + production. Whatever it resolves to must be registered
  // as an Authorized redirect URI in the Google Cloud console.
  redirectBase?: string
}

export function googleOAuthConfig(): GoogleOAuthConfig | null {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) return null
  return { clientId, clientSecret, redirectBase: process.env.GOOGLE_OAUTH_REDIRECT_BASE || undefined }
}

// APP_SECRET is required for any authenticated flow regardless of store.
// Production demands a strong (≥32-char) secret; the crypto primitives enforce
// a ≥16 floor everywhere (Phase D.6 P6).
export function requireAppSecret(): void {
  const min = process.env.NODE_ENV === 'production' ? 32 : 16
  if (!process.env.APP_SECRET || process.env.APP_SECRET.length < min) {
    throw new EnvError(`APP_SECRET (min ${min} chars) must be set for authentication.`)
  }
}

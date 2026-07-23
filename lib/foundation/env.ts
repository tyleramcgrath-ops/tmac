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

// The app's own origin, for links built OUTSIDE a request context (scheduled
// jobs like the weekly digest have no incoming Request to derive an origin
// from, unlike e.g. the email-verification link builders). Prefers an
// explicit override, then Vercel's own runtime-provided hostname. Null (never
// a guessed localhost URL in production) when neither is available — callers
// must omit the link entirely rather than emit a broken one.
export function appBaseUrl(): string | null {
  const explicit = process.env.APP_BASE_URL
  if (explicit) return explicit.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return null
}

export function googleOAuthConfig(): GoogleOAuthConfig | null {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) return null
  return { clientId, clientSecret, redirectBase: process.env.GOOGLE_OAUTH_REDIRECT_BASE || undefined }
}

export interface StripeConfig {
  secretKey: string
  webhookSecret: string
  priceCents: number
  priceLabel: string
}

// Self-serve billing. Unset STRIPE_SECRET_KEY ⇒ billing is entirely
// unconfigured: no paywall is enforced anywhere (dev/self-host mode), matching
// every other optional integration in this app (Google OAuth, mail webhook).
// STRIPE_WEBHOOK_SECRET is required alongside it — without it we cannot verify
// a webhook payload actually came from Stripe, so partial configuration is
// treated the same as no configuration (fails closed, not open, since an
// unverified webhook could otherwise be spoofed to grant free access).
export function stripeConfig(): StripeConfig | null {
  const secretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secretKey || !webhookSecret) return null
  const priceCents = Number(process.env.STRIPE_PRICE_CENTS) || 4900
  return { secretKey, webhookSecret, priceCents, priceLabel: process.env.STRIPE_PRICE_LABEL || 'RankForge Pro' }
}

// Transactional email via Resend (https://resend.com). Optional and
// independent of MAIL_WEBHOOK_URL — when both are set, Resend takes
// precedence since it needs no separate relay to build. Unset RESEND_API_KEY
// ⇒ this path is skipped entirely (falls through to MAIL_WEBHOOK_URL, then
// logged-only), matching every other optional integration.
export interface ResendConfig {
  apiKey: string
  from: string
}

export function resendConfig(): ResendConfig | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  return { apiKey, from: process.env.RESEND_FROM_EMAIL || 'RankForge <onboarding@resend.dev>' }
}

// Pilot sign-up allow-list (RC2 P6). RF_SIGNUP_ALLOWLIST is a comma-separated
// list of exact emails and/or @domains (e.g. "a@x.com,@acme.com"). When set,
// only matching emails may register. Unset ⇒ open sign-up (dev/self-serve).
export function signupAllowed(email: string): boolean {
  const raw = process.env.RF_SIGNUP_ALLOWLIST
  if (!raw) return true
  const e = email.trim().toLowerCase()
  const domain = '@' + e.split('@')[1]
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .some((entry) => (entry.startsWith('@') ? entry === domain : entry === e))
}

// RankForge-staff gate for the pilot admin surface (org.pilot management,
// cross-org feedback). RF_STAFF_EMAILS is a comma-separated exact-email
// allow-list — no domain wildcards, unlike the signup allow-list, since this
// gates a much more sensitive surface. Unset ⇒ nobody is staff (fails closed,
// not open) — the admin routes 404 for everyone until explicitly configured.
export function isStaffEmail(email: string): boolean {
  const raw = process.env.RF_STAFF_EMAILS
  if (!raw) return false
  const e = email.trim().toLowerCase()
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .includes(e)
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

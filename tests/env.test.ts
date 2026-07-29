// Environment validation is the guard that keeps a production deployment from
// silently running on the ephemeral file store and losing every customer's
// data. It had no tests. These pin down what counts as production, and the
// allow-list gates that decide who may sign up and who is staff.

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  EnvError,
  appBaseUrl,
  googleOAuthConfig,
  isStaffEmail,
  requireAppSecret,
  resolveStoreEnv,
  signupAllowed,
  stripeConfig,
} from '../lib/foundation/env'

const KEYS = [
  'DATABASE_URL', 'POSTGRES_URL', 'POSTGRES_PRISMA_URL', 'APP_SECRET',
  'VERCEL', 'VERCEL_ENV', 'VERCEL_URL', 'NODE_ENV', 'NEXT_PHASE', 'APP_BASE_URL',
  'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_OAUTH_REDIRECT_BASE',
  'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_PRICE_CENTS', 'STRIPE_PRICE_LABEL',
  'RF_SIGNUP_ALLOWLIST', 'RF_STAFF_EMAILS',
]

let saved: Record<string, string | undefined> = {}

beforeEach(() => {
  saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]))
  for (const k of KEYS) delete process.env[k]
})

afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
})

const STRONG = 'a'.repeat(32)

// NODE_ENV is typed readonly, but these tests exist precisely to exercise what
// the code does under each value of it.
function setNodeEnv(value: string) {
  Object.assign(process.env, { NODE_ENV: value })
}

describe('resolveStoreEnv: production never falls back to the ephemeral file store', () => {
  it('uses the file store for local development with nothing configured', () => {
    expect(resolveStoreEnv()).toEqual({ kind: 'file' })
  })

  it('uses Postgres in development when DATABASE_URL happens to be set', () => {
    process.env.DATABASE_URL = 'postgres://localhost/rf'
    expect(resolveStoreEnv()).toEqual({ kind: 'postgres', databaseUrl: 'postgres://localhost/rf' })
  })

  it('accepts POSTGRES_URL and POSTGRES_PRISMA_URL as aliases', () => {
    process.env.POSTGRES_URL = 'postgres://a/b'
    expect(resolveStoreEnv().databaseUrl).toBe('postgres://a/b')
    delete process.env.POSTGRES_URL
    process.env.POSTGRES_PRISMA_URL = 'postgres://c/d'
    expect(resolveStoreEnv().databaseUrl).toBe('postgres://c/d')
  })

  it('refuses a Vercel production deploy with no database', () => {
    process.env.VERCEL_ENV = 'production'
    expect(() => resolveStoreEnv()).toThrow(EnvError)
    expect(() => resolveStoreEnv()).toThrow(/DATABASE_URL is required/)
  })

  it('refuses a Vercel preview deploy with no database too', () => {
    process.env.VERCEL_ENV = 'preview'
    expect(() => resolveStoreEnv()).toThrow(/DATABASE_URL is required/)
  })

  it('refuses a production deploy whose APP_SECRET is too weak to encrypt credentials', () => {
    process.env.VERCEL_ENV = 'production'
    process.env.DATABASE_URL = 'postgres://a/b'
    process.env.APP_SECRET = 'short'
    expect(() => resolveStoreEnv()).toThrow(/APP_SECRET/)
  })

  it('accepts a fully configured production deploy', () => {
    process.env.VERCEL_ENV = 'production'
    process.env.DATABASE_URL = 'postgres://a/b'
    process.env.APP_SECRET = STRONG
    expect(resolveStoreEnv()).toEqual({ kind: 'postgres', databaseUrl: 'postgres://a/b' })
  })

  it('treats a self-hosted NODE_ENV=production run as production even with no VERCEL variable', () => {
    // A Docker/bare-metal deploy sets NODE_ENV=production and nothing else.
    // Handing it the file store would lose data exactly as it would on Vercel,
    // so the same requirements apply.
    setNodeEnv('production')
    expect(() => resolveStoreEnv()).toThrow(/DATABASE_URL is required/)
  })

  it('still requires a strong APP_SECRET when self-hosted in production', () => {
    setNodeEnv('production')
    process.env.DATABASE_URL = 'postgres://a/b'
    expect(() => resolveStoreEnv()).toThrow(/APP_SECRET/)
  })

  it('does not throw during a production build, which has no runtime env yet', () => {
    // `next build` runs with NODE_ENV=production on a developer's machine. It
    // is not a deployment and must not demand deployment credentials.
    setNodeEnv('production')
    process.env.NEXT_PHASE = 'phase-production-build'
    expect(resolveStoreEnv()).toEqual({ kind: 'file' })
  })
})

describe('requireAppSecret', () => {
  it('throws when unset', () => {
    expect(() => requireAppSecret()).toThrow(EnvError)
  })

  it('accepts a 16-char secret outside production but demands 32 inside it', () => {
    process.env.APP_SECRET = 'b'.repeat(16)
    expect(() => requireAppSecret()).not.toThrow()
    setNodeEnv('production')
    expect(() => requireAppSecret()).toThrow(/32/)
    process.env.APP_SECRET = STRONG
    expect(() => requireAppSecret()).not.toThrow()
  })
})

describe('signupAllowed: pilot allow-list', () => {
  it('allows everyone when no allow-list is configured', () => {
    expect(signupAllowed('anyone@anywhere.com')).toBe(true)
  })

  it('matches an exact email, case- and whitespace-insensitively', () => {
    process.env.RF_SIGNUP_ALLOWLIST = 'a@x.com, b@y.com'
    expect(signupAllowed('  A@X.com ')).toBe(true)
    expect(signupAllowed('b@y.com')).toBe(true)
    expect(signupAllowed('c@x.com')).toBe(false)
  })

  it('matches a whole domain via an @domain entry', () => {
    process.env.RF_SIGNUP_ALLOWLIST = '@acme.com'
    expect(signupAllowed('anyone@acme.com')).toBe(true)
    expect(signupAllowed('anyone@notacme.com')).toBe(false)
  })

  it('does not let a lookalike domain through on a suffix match', () => {
    process.env.RF_SIGNUP_ALLOWLIST = '@acme.com'
    expect(signupAllowed('attacker@evil-acme.com')).toBe(false)
    expect(signupAllowed('attacker@acme.com.evil.net')).toBe(false)
  })

  it('rejects an address with no domain at all rather than matching a stray entry', () => {
    process.env.RF_SIGNUP_ALLOWLIST = '@acme.com'
    expect(signupAllowed('nodomain')).toBe(false)
  })
})

describe('isStaffEmail: fails closed', () => {
  it('treats nobody as staff when unconfigured', () => {
    expect(isStaffEmail('anyone@rankforge.com')).toBe(false)
  })

  it('matches only exact emails — no domain wildcards on this surface', () => {
    process.env.RF_STAFF_EMAILS = 'ops@rankforge.com'
    expect(isStaffEmail('OPS@RankForge.com ')).toBe(true)
    expect(isStaffEmail('intern@rankforge.com')).toBe(false)
  })

  it('ignores an @domain entry rather than granting staff to a whole domain', () => {
    process.env.RF_STAFF_EMAILS = '@rankforge.com'
    expect(isStaffEmail('anyone@rankforge.com')).toBe(false)
  })
})

describe('optional integrations report "not configured" rather than half-working', () => {
  it('returns null for Google OAuth unless both halves are present', () => {
    expect(googleOAuthConfig()).toBeNull()
    process.env.GOOGLE_CLIENT_ID = 'id'
    expect(googleOAuthConfig()).toBeNull()
    process.env.GOOGLE_CLIENT_SECRET = 'secret'
    expect(googleOAuthConfig()).toEqual({ clientId: 'id', clientSecret: 'secret', redirectBase: undefined })
  })

  it('returns null for Stripe when the webhook secret is missing — an unverifiable webhook could be spoofed', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test'
    expect(stripeConfig()).toBeNull()
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec'
    expect(stripeConfig()).toMatchObject({ secretKey: 'sk_test', webhookSecret: 'whsec', priceCents: 4900 })
  })

  it('falls back to the default price rather than charging a nonsense amount', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test'
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec'
    process.env.STRIPE_PRICE_CENTS = 'not-a-number'
    expect(stripeConfig()?.priceCents).toBe(4900)
    process.env.STRIPE_PRICE_CENTS = '-500'
    expect(stripeConfig()?.priceCents).toBe(4900)
    process.env.STRIPE_PRICE_CENTS = '1999'
    expect(stripeConfig()?.priceCents).toBe(1999)
  })
})

describe('appBaseUrl: never guesses', () => {
  it('returns null when nothing identifies the deployment', () => {
    expect(appBaseUrl()).toBeNull()
  })

  it('prefers the explicit override and strips a trailing slash', () => {
    process.env.APP_BASE_URL = 'https://app.example.com/'
    process.env.VERCEL_URL = 'ignored.vercel.app'
    expect(appBaseUrl()).toBe('https://app.example.com')
  })

  it('falls back to the Vercel-provided hostname', () => {
    process.env.VERCEL_URL = 'rf.vercel.app'
    expect(appBaseUrl()).toBe('https://rf.vercel.app')
  })
})

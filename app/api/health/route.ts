// Deployment health / config diagnostic (RC2 support). Reports whether the
// environment is configured — WITHOUT the store (which refuses to run when
// misconfigured) and WITHOUT exposing any secret VALUE. It reports only
// presence and length, so an operator can confirm at a glance why auth fails.
// Safe to leave enabled: lengths + booleans are not sensitive.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const appSecret = process.env.APP_SECRET || ''
  const databasePresent = !!(process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL)
  // Diagnostic: env-var KEY NAMES (never values) that look like an APP_SECRET
  // spelling — reveals typos ("APP_SECRET " with a space, "APPSECRET", wrong
  // case) without exposing any secret. Value length only, never the value.
  const appSecretLikeKeys = Object.keys(process.env).filter((k) => /app[\s_-]?secret/i.test(k))
  return Response.json({
    ok: true,
    vercelEnv: process.env.VERCEL_ENV ?? null, // 'production' | 'preview' | 'development' | null
    nodeEnv: process.env.NODE_ENV ?? null,
    appSecretPresent: appSecret.length > 0,
    appSecretLength: appSecret.length, // length only — never the value
    appSecretValid: appSecret.length >= 32,
    // Exact key names (not values) matching an APP_SECRET spelling, so a typo is
    // visible. Empty [] means no such variable exists in this environment at all.
    appSecretLikeKeys,
    databaseUrlPresent: databasePresent,
    signupAllowlistSet: !!process.env.RF_SIGNUP_ALLOWLIST,
    googleOAuthConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    atlasEnabled: process.env.NEXT_PUBLIC_RF_ENABLE_ATLAS === '1',
  })
}

// Google OAuth configuration readiness.
//
// Reports whether the RankForge environment is configured for Google
// integrations WITHOUT exposing any secret values. Accepts both the spec's
// canonical env names (GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI) and the names the
// existing code already used (GOOGLE_OAUTH_*), so nothing breaks.

import { isEncryptionConfigured } from '@/lib/crypto/tokens'

export interface GoogleConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export interface GoogleReadiness {
  configured: boolean
  missing: string[] // canonical names of what's missing — never values
  encryptionConfigured: boolean
  redirectUri: string | null
}

const CANONICAL = {
  clientId: 'GOOGLE_CLIENT_ID',
  clientSecret: 'GOOGLE_CLIENT_SECRET',
  redirectUri: 'GOOGLE_REDIRECT_URI',
} as const

function read(env: NodeJS.ProcessEnv, canonical: string, legacy: string): string {
  return (env[canonical] || env[legacy] || '').trim()
}

export function getGoogleConfig(env: NodeJS.ProcessEnv = process.env): GoogleConfig | null {
  const clientId = read(env, CANONICAL.clientId, 'GOOGLE_OAUTH_CLIENT_ID')
  const clientSecret = read(env, CANONICAL.clientSecret, 'GOOGLE_OAUTH_CLIENT_SECRET')
  const redirectUri = read(env, CANONICAL.redirectUri, 'GOOGLE_OAUTH_REDIRECT_URI')
  if (!clientId || !clientSecret || !redirectUri) return null
  return { clientId, clientSecret, redirectUri }
}

/** Reports readiness with the exact missing canonical env-var names — no values. */
export function getGoogleReadiness(env: NodeJS.ProcessEnv = process.env): GoogleReadiness {
  const clientId = read(env, CANONICAL.clientId, 'GOOGLE_OAUTH_CLIENT_ID')
  const clientSecret = read(env, CANONICAL.clientSecret, 'GOOGLE_OAUTH_CLIENT_SECRET')
  const redirectUri = read(env, CANONICAL.redirectUri, 'GOOGLE_OAUTH_REDIRECT_URI')
  const missing: string[] = []
  if (!clientId) missing.push(CANONICAL.clientId)
  if (!clientSecret) missing.push(CANONICAL.clientSecret)
  if (!redirectUri) missing.push(CANONICAL.redirectUri)
  const encryptionConfigured = isEncryptionConfigured(env)
  if (!encryptionConfigured) missing.push('TOKEN_ENCRYPTION_KEY')
  return {
    configured: missing.length === 0,
    missing,
    encryptionConfigured,
    redirectUri: redirectUri || null,
  }
}

// Minimum required scopes, per integration (read-only).
export const GSC_SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly']
export const GA4_SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/analytics.edit', // needed only to list properties via Admin API
]

// The exact callback routes RankForge implements (documented in setup guide).
export const GSC_CALLBACK_PATH = '/api/integrations/google/callback?service=gsc'
export const GA4_CALLBACK_PATH = '/api/integrations/google/callback?service=ga4'

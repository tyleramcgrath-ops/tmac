// What's connected and what isn't, for the dashboard's setup checklist.

import { hasDb } from './db'
import { ga4Configured, gscConfigured } from './google'
import { mailConfigured } from './mail'
import { indexNowKey } from './seo'

export type SetupItem = { key: string; name: string; on: boolean; unlocks: string; env: string[] }

export function setupItems(): SetupItem[] {
  return [
    { key: 'db', name: 'Database', on: hasDb(), env: ['DATABASE_URL'], unlocks: 'Saves every lead and counts visits, sources and key actions. Copy DATABASE_URL from the SaySites app; it shares the database safely.' },
    { key: 'mail', name: 'Lead emails', on: mailConfigured() && !!process.env.LEAD_EMAIL_TO, env: ['LEAD_EMAIL_TO', 'SMTP_USER', 'SMTP_PASS'], unlocks: 'Emails you each new lead and sends the visitor a confirmation.' },
    { key: 'ga4', name: 'Google Analytics', on: ga4Configured(), env: ['GOOGLE_SERVICE_ACCOUNT_JSON', 'GA4_PROPERTY_ID'], unlocks: 'Users, sessions, channels, devices and who is on the site right now.' },
    { key: 'gsc', name: 'Search Console', on: gscConfigured(), env: ['GOOGLE_SERVICE_ACCOUNT_JSON', 'GSC_SITE_URL'], unlocks: 'Google clicks, impressions, rankings, keywords and index checks.' },
    { key: 'indexnow', name: 'IndexNow', on: !!indexNowKey(), env: ['INDEXNOW_KEY'], unlocks: 'Sends new pages to Bing and other engines instantly.' },
  ]
}

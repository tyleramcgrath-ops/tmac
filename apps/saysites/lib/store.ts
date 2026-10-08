// Persistence for SaySites: accounts, sites, pages, revisions and redirects.
//
// Postgres when DATABASE_URL is set (production). Without it, an in-memory
// store keeps local development and the test deployment usable; the dashboard
// shows a "test mode" notice because that data does not survive a restart.
// Every site and page is validated against the schema on the way in and out.

import type { AnalyticsRaw } from './analytics'
import type { Article } from './articles'
import type { Billing } from './billing'
import { randomUUID } from 'crypto'
import { Pool } from 'pg'
import { SHOWCASE } from './showcase'
import { PageSchema, RedirectSchema, SiteSchema, type Page, type Redirect, type Site } from './schema'
import type { LeagueSite } from './league'
import type { Preview } from './redesign'
import type { Campaign } from './outreach'
import type { CityReport, Prospect } from './prospects'
import type { ChatTurn, Snapshot } from './sofie'

// Sofie's working state for one site: the chat, plus a draft of her edits
// (with the steps before it, for undo) that is not live until published.
export interface SofieState {
  chat: ChatTurn[]
  draft: Snapshot | null
  history: Snapshot[]
  // Set while Sofie works on a message in the background.
  pending?: { at: string } | null
  // Why the last message failed; shown until the next action.
  error?: string | null
}

// Logo ideas Sofie sketched for the owner to choose from.
export interface LogoIdea {
  name: string
  note: string
  // /u/<id> files: the lockup and the square icon.
  logo: string
  icon: string
}
export interface LogoIdeasState {
  ideas: LogoIdea[]
  brief?: string
  pending?: { at: string } | null
  error?: string | null
}

export interface User {
  id: string
  email: string
  name: string
  passwordHash: string
  createdAt: string
}

// A message sent through a contact form on a customer site.
export interface Message {
  id: string
  siteId: string
  name: string
  email: string
  phone: string
  body: string
  // The page it was sent from, e.g. "/contact".
  page: string
  createdAt: string
  read: boolean
}
export type NewMessage = Omit<Message, 'id' | 'createdAt' | 'read'>

// A photo the owner uploaded, served from /u/<id> on every site address.
export interface Media {
  id: string
  siteId: string
  mime: string
  width: number
  height: number
  alt: string
  bytes: number
  createdAt: string
}

export type RevisionAuthor = 'owner' | 'sofie' | 'operator' | 'import'

export interface Store {
  readonly persistent: boolean
  createUser(input: { email: string; name: string; passwordHash: string }): Promise<User>
  userByEmail(email: string): Promise<User | null>
  userById(id: string): Promise<User | null>
  createSite(ownerId: string, site: Site, pages: Page[]): Promise<void>
  sitesForUser(ownerId: string): Promise<Site[]>
  siteForUser(ownerId: string, siteId: string): Promise<Site | null>
  siteBySubdomain(subdomain: string): Promise<Site | null>
  siteByDomain(domain: string): Promise<Site | null>
  subdomainTaken(subdomain: string): Promise<boolean>
  updateSite(site: Site): Promise<void>
  // A site waiting for its client's approval, by the code in its link.
  siteByHandoff(code: string): Promise<Site | null>
  // Moves a site (and everything under it) to another account.
  transferSite(siteId: string, toOwnerId: string): Promise<void>
  pagesForSite(siteId: string): Promise<Page[]>
  savePage(page: Page, author: RevisionAuthor, userId: string | null, note?: string): Promise<void>
  redirectsForSite(siteId: string): Promise<Redirect[]>
  // Replaces the site's redirects.
  saveRedirects(siteId: string, redirects: Redirect[]): Promise<void>
  sofieState(siteId: string): Promise<SofieState>
  saveSofieState(siteId: string, state: SofieState): Promise<void>
  // Removes a site and everything under it (pages, revisions, Sofie, messages).
  deleteSite(ownerId: string, siteId: string): Promise<void>
  // Removes the user and all of their sites.
  deleteUser(userId: string): Promise<void>
  updateUser(userId: string, changes: { name?: string; passwordHash?: string }): Promise<void>
  addMedia(m: Omit<Media, 'id' | 'createdAt' | 'bytes'> & { id?: string }, data: Buffer): Promise<Media>
  mediaForSite(siteId: string): Promise<Media[]>
  // The file itself, for serving. Not scoped: ids are unguessable and files are public.
  mediaFile(id: string): Promise<{ mime: string; data: Buffer } | null>
  deleteMedia(siteId: string, id: string): Promise<void>
  addMessage(m: NewMessage): Promise<Message>
  messagesForSite(siteId: string, limit?: number): Promise<Message[]>
  // Mark one message read (or unread). Scoped to the site.
  setMessageRead(siteId: string, messageId: string, read: boolean): Promise<void>
  deleteMessage(siteId: string, messageId: string): Promise<void>
  unreadCount(siteId: string): Promise<number>
  // Messages received since a time, for rate limiting a site's form.
  recentMessageCount(siteId: string, since: Date): Promise<number>
  logoIdeas(siteId: string): Promise<LogoIdeasState>
  saveLogoIdeas(siteId: string, state: LogoIdeasState): Promise<void>
  // One page view on a live site. `day` is YYYY-MM-DD (UTC).
  recordVisit(siteId: string, day: string, path: string): Promise<void>
  // Taps on the site's phone number since `day` (recorded as CALL_KEY).
  callsSince(siteId: string, day: string): Promise<number>
  // Page views per day and page since a day (inclusive).
  visitsSince(siteId: string, day: string): Promise<Visit[]>
  // Today's Visibility Score, kept once per day for the weekly leagues.
  recordScore(siteId: string, day: string, score: number): Promise<void>
  // The site's SEO intelligence (lib/seo-intel: the RankForge engines):
  // latest audit, competitor audits, tracked keywords and AI answers.
  seoState(siteId: string): Promise<unknown | null>
  saveSeoState(siteId: string, state: unknown): Promise<void>
  // The site's leads pipeline (lib/leads): each lead's stage, notes and
  // timeline, plus the site's automations and CRM integrations.
  crmState(siteId: string): Promise<unknown | null>
  saveCrmState(siteId: string, state: unknown): Promise<void>
  // Every site that has a leads pipeline, for the follow-up scheduler.
  crmSites(): Promise<{ site: Site; state: unknown }[]>
  // Every site, for the monthly results email.
  allSites(): Promise<Site[]>
  siteById(siteId: string): Promise<Site | null>
  // Staff: people the owner invited to work a site's leads (lib/team).
  addMember(siteId: string, userId: string): Promise<void>
  removeMember(siteId: string, userId: string): Promise<void>
  membersForSite(siteId: string): Promise<Member[]>
  memberSites(userId: string): Promise<Site[]>
  isMember(siteId: string, userId: string): Promise<boolean>
  createInvite(siteId: string, email: string, code: string): Promise<void>
  invite(code: string): Promise<Invite | null>
  deleteInvite(code: string): Promise<void>
  invitesForSite(siteId: string): Promise<Invite[]>
  // Every site with a score since `day`, with its scores and daily views.
  leagueSites(day: string): Promise<LeagueSite[]>
  // Free redesign previews. `who` is a hash of the requester, for limits.
  savePreview(p: Preview, who: string): Promise<void>
  preview(id: string): Promise<Preview | null>
  previewCount(since: Date, who?: string): Promise<number>
  // Marks a preview claimed; false when someone already claimed it.
  claimPreview(id: string, by: string, siteId: string): Promise<boolean>
  // Stock photos in use, by photo key (lib/photo-rules): each belongs to one
  // site. photosTaken returns the keys other sites hold.
  photosTaken(exceptSiteId?: string): Promise<Set<string>>
  // Records the stock photos a site now uses and releases the rest. Keys
  // another site already holds are left with that site.
  setSitePhotos(siteId: string, keys: string[]): Promise<void>
  // A small shared cache (e.g. photo search results), fresh for `maxAgeMs`.
  cacheGet(key: string, maxAgeMs: number): Promise<unknown | null>
  cacheSet(key: string, data: unknown): Promise<void>
  // Billing per account (lib/billing), and the lookup Stripe's webhook needs.
  billing(userId: string): Promise<Billing | null>
  saveBilling(userId: string, b: Billing): Promise<void>
  // AI spend in millionths of a dollar, per site per day (lib/usage).
  recordUsage(siteId: string, day: string, micros: number): Promise<void>
  siteUsage(siteId: string, sinceDay: string): Promise<{ micros: number; messages: number }>
  dayUsage(day: string): Promise<{ micros: number; messages: number }>
  // What people tell us about SaySites itself (the feedback button).
  addFeedback(f: Feedback): Promise<void>
  feedback(limit: number): Promise<Feedback[]>
  // Launch-day numbers for the team (admin only): totals, and since a day.
  launchStats(sinceDay: string): Promise<LaunchStats>
  // The owner's analytics (lib/analytics), from sinceDay (YYYY-MM-DD) on.
  analytics(sinceDay: string): Promise<AnalyticsRaw>
  // saysites.com's own blog (lib/articles): articles written in the dashboard.
  articles(): Promise<Article[]>
  saveArticle(a: Article): Promise<void>
  deleteArticle(slug: string): Promise<void>
  // Outreach (lib/outreach, lib/prospects): campaigns, the businesses in
  // them, and the city reports published from them.
  campaigns(): Promise<Campaign[]>
  saveCampaign(c: Campaign): Promise<void>
  prospects(campaign?: string): Promise<Prospect[]>
  prospect(id: string): Promise<Prospect | null>
  prospectByPreview(previewId: string): Promise<Prospect | null>
  saveProspect(p: Prospect): Promise<void>
  reports(): Promise<CityReport[]>
  report(slug: string): Promise<CityReport | null>
  saveReport(r: CityReport): Promise<void>
}

export interface LaunchStats {
  users: number
  usersSince: number
  birthday: number
  paying: number
  sites: number
  sitesSince: number
  feedback: number
  feedbackSince: number
  messagesSince: number
  viewsSince: number
  callsSince: number
  recent: { name: string; email: string; createdAt: string; sites: number; promo?: string; status?: string; reward: boolean }[]
}

export interface Feedback {
  id: string
  userId: string | null
  name: string
  email: string
  text: string
  page: string
  at: string
}

// Page views are counted per day and page, and nothing else: no cookies,
// no addresses, nothing that identifies a visitor.
export interface Member {
  userId: string
  email: string
  name: string
  addedAt: string
}
export interface Invite {
  code: string
  siteId: string
  email: string
  createdAt: string
}

export interface Visit {
  day: string
  path: string
  views: number
}

export const emptySofieState = (): SofieState => ({ chat: [], draft: null, history: [] })

// ---------------------------------------------------------------------------
// Postgres
// ---------------------------------------------------------------------------

const SCHEMA = `
CREATE TABLE IF NOT EXISTS ss_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ss_sites (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES ss_users(id) ON DELETE CASCADE,
  subdomain TEXT NOT NULL UNIQUE,
  custom_domain TEXT UNIQUE,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ss_sites_owner_idx ON ss_sites (owner_id);
CREATE TABLE IF NOT EXISTS ss_pages (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES ss_sites(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (site_id, slug)
);
-- Every save is a revision, so any change by the owner, Sofie or the SEO
-- Operator can be seen and rolled back.
CREATE TABLE IF NOT EXISTS ss_page_revisions (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL REFERENCES ss_pages(id) ON DELETE CASCADE,
  author TEXT NOT NULL CHECK (author IN ('owner','sofie','operator','import')),
  user_id TEXT REFERENCES ss_users(id) ON DELETE SET NULL,
  note TEXT,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ss_page_revisions_page_idx ON ss_page_revisions (page_id, created_at DESC);
CREATE TABLE IF NOT EXISTS ss_redirects (
  site_id TEXT NOT NULL REFERENCES ss_sites(id) ON DELETE CASCADE,
  from_path TEXT NOT NULL,
  to_path TEXT NOT NULL,
  status SMALLINT NOT NULL CHECK (status IN (301,302)),
  PRIMARY KEY (site_id, from_path)
);
CREATE TABLE IF NOT EXISTS ss_messages (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES ss_sites(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ss_messages_site_idx ON ss_messages (site_id, created_at DESC);
CREATE TABLE IF NOT EXISTS ss_media (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES ss_sites(id) ON DELETE CASCADE,
  mime TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  alt TEXT NOT NULL,
  data BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ss_media_site_idx ON ss_media (site_id, created_at DESC);
CREATE TABLE IF NOT EXISTS ss_visits (
  site_id TEXT NOT NULL REFERENCES ss_sites(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  path TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (site_id, day, path)
);
CREATE TABLE IF NOT EXISTS ss_seo (
  site_id TEXT PRIMARY KEY REFERENCES ss_sites(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ss_crm (
  site_id TEXT PRIMARY KEY REFERENCES ss_sites(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ss_members (
  site_id TEXT NOT NULL REFERENCES ss_sites(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES ss_users(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (site_id, user_id)
);
CREATE TABLE IF NOT EXISTS ss_invites (
  code TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES ss_sites(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ss_scores (
  site_id TEXT NOT NULL REFERENCES ss_sites(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  score SMALLINT NOT NULL,
  PRIMARY KEY (site_id, day)
);
CREATE TABLE IF NOT EXISTS ss_previews (
  id TEXT PRIMARY KEY,
  who TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ss_previews_who_idx ON ss_previews (who, created_at DESC);
CREATE TABLE IF NOT EXISTS ss_photos (
  photo TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ss_photos_site_idx ON ss_photos (site_id);
CREATE TABLE IF NOT EXISTS ss_billing (
  user_id TEXT PRIMARY KEY REFERENCES ss_users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ss_usage (
  site_id TEXT NOT NULL,
  day DATE NOT NULL,
  micros BIGINT NOT NULL DEFAULT 0,
  messages INT NOT NULL DEFAULT 0,
  PRIMARY KEY (site_id, day)
);
CREATE INDEX IF NOT EXISTS ss_usage_day_idx ON ss_usage (day);
CREATE TABLE IF NOT EXISTS ss_feedback (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ss_articles (
  slug TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ss_campaigns (
  slug TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ss_prospects (
  id TEXT PRIMARY KEY,
  campaign TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ss_prospects_campaign_idx ON ss_prospects (campaign);
CREATE INDEX IF NOT EXISTS ss_prospects_preview_idx ON ss_prospects ((data->>'previewId'));
CREATE TABLE IF NOT EXISTS ss_reports (
  slug TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ss_cache (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ss_logo_ideas (
  site_id TEXT PRIMARY KEY REFERENCES ss_sites(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ss_sofie (
  site_id TEXT PRIMARY KEY REFERENCES ss_sites(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`

class PgStore implements Store {
  readonly persistent = true
  private ready: Promise<void> | null = null
  constructor(private pool: Pool) {}

  private async q<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    this.ready ??= this.pool.query(SCHEMA).then(() => undefined)
    await this.ready
    return (await this.pool.query(sql, params)).rows as T[]
  }

  async createUser(input: { email: string; name: string; passwordHash: string }): Promise<User> {
    const user: User = { id: randomUUID(), createdAt: new Date().toISOString(), ...input }
    await this.q('INSERT INTO ss_users (id, email, name, password_hash) VALUES ($1,$2,$3,$4)', [user.id, user.email, user.name, user.passwordHash])
    return user
  }
  async userByEmail(email: string) {
    return toUser((await this.q('SELECT * FROM ss_users WHERE email = $1', [email]))[0])
  }
  async userById(id: string) {
    return toUser((await this.q('SELECT * FROM ss_users WHERE id = $1', [id]))[0])
  }
  async createSite(ownerId: string, site: Site, pages: Page[]) {
    const s = SiteSchema.parse(site)
    const client = await this.pool.connect()
    try {
      await this.q('SELECT 1')
      await client.query('BEGIN')
      await client.query('INSERT INTO ss_sites (id, owner_id, subdomain, custom_domain, data) VALUES ($1,$2,$3,$4,$5)', [s.id, ownerId, s.subdomain, s.customDomain ?? null, s])
      for (const p of pages) {
        const page = PageSchema.parse(p)
        await client.query('INSERT INTO ss_pages (id, site_id, slug, data) VALUES ($1,$2,$3,$4)', [page.id, s.id, page.slug, page])
        await client.query("INSERT INTO ss_page_revisions (id, page_id, author, user_id, note, data) VALUES ($1,$2,'owner',$3,'Site created',$4)", [randomUUID(), page.id, ownerId, page])
      }
      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  }
  async sitesForUser(ownerId: string) {
    return (await this.q<{ data: Site }>('SELECT data FROM ss_sites WHERE owner_id = $1 ORDER BY created_at', [ownerId])).map((r) => SiteSchema.parse(r.data))
  }
  async siteForUser(ownerId: string, siteId: string) {
    const r = (await this.q<{ data: Site }>('SELECT data FROM ss_sites WHERE id = $1 AND owner_id = $2', [siteId, ownerId]))[0]
    return r ? SiteSchema.parse(r.data) : null
  }
  async siteBySubdomain(subdomain: string) {
    const r = (await this.q<{ data: Site }>('SELECT data FROM ss_sites WHERE subdomain = $1', [subdomain]))[0]
    return r ? SiteSchema.parse(r.data) : SHOWCASE[subdomain]?.site ?? null
  }
  async siteByDomain(domain: string) {
    const r = (await this.q<{ data: Site }>('SELECT data FROM ss_sites WHERE custom_domain = $1', [domain]))[0]
    return r ? SiteSchema.parse(r.data) : null
  }
  async subdomainTaken(subdomain: string) {
    if (SHOWCASE[subdomain]) return true
    return (await this.q('SELECT 1 FROM ss_sites WHERE subdomain = $1', [subdomain])).length > 0
  }
  async updateSite(site: Site) {
    const s = SiteSchema.parse(site)
    await this.q('UPDATE ss_sites SET data = $2, custom_domain = $3, updated_at = now() WHERE id = $1', [s.id, s, s.customDomain ?? null])
  }
  async siteByHandoff(code: string) {
    const r = (await this.q<{ data: Site }>("SELECT data FROM ss_sites WHERE data->'handoff'->>'code' = $1", [code]))[0]
    return r ? SiteSchema.parse(r.data) : null
  }
  async transferSite(siteId: string, toOwnerId: string) {
    await this.q("UPDATE ss_sites SET owner_id = $2, data = jsonb_set(data, '{orgId}', to_jsonb($2::text)), updated_at = now() WHERE id = $1", [siteId, toOwnerId])
  }
  async pagesForSite(siteId: string) {
    const demo = Object.values(SHOWCASE).find((d) => d.site.id === siteId)
    if (demo) return demo.pages
    return (await this.q<{ data: Page }>('SELECT data FROM ss_pages WHERE site_id = $1 ORDER BY slug', [siteId])).map((r) => PageSchema.parse(r.data))
  }
  async savePage(page: Page, author: RevisionAuthor, userId: string | null, note?: string) {
    const p = PageSchema.parse(page)
    await this.q(
      'INSERT INTO ss_pages (id, site_id, slug, data) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO UPDATE SET slug = EXCLUDED.slug, data = EXCLUDED.data, updated_at = now()',
      [p.id, p.siteId, p.slug, p]
    )
    await this.q('INSERT INTO ss_page_revisions (id, page_id, author, user_id, note, data) VALUES ($1,$2,$3,$4,$5,$6)', [randomUUID(), p.id, author, userId, note ?? null, p])
  }
  async redirectsForSite(siteId: string) {
    return (await this.q<{ from_path: string; to_path: string; status: number }>('SELECT from_path, to_path, status FROM ss_redirects WHERE site_id = $1', [siteId])).map((r) => ({
      from: r.from_path,
      to: r.to_path,
      status: r.status as 301 | 302,
    }))
  }  async saveRedirects(siteId: string, redirects: Redirect[]) {
    const list = redirects.map((r) => RedirectSchema.parse(r))
    const client = await this.pool.connect()
    try {
      await this.q('SELECT 1')
      await client.query('BEGIN')
      await client.query('DELETE FROM ss_redirects WHERE site_id = $1', [siteId])
      for (const r of list) await client.query('INSERT INTO ss_redirects (site_id, from_path, to_path, status) VALUES ($1,$2,$3,$4) ON CONFLICT (site_id, from_path) DO UPDATE SET to_path = EXCLUDED.to_path, status = EXCLUDED.status', [siteId, r.from, r.to, r.status])
      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  }

  async sofieState(siteId: string) {
    const r = (await this.q<{ data: SofieState }>('SELECT data FROM ss_sofie WHERE site_id = $1', [siteId]))[0]
    return r ? r.data : emptySofieState()
  }
  async saveSofieState(siteId: string, state: SofieState) {
    await this.q('INSERT INTO ss_sofie (site_id, data) VALUES ($1,$2) ON CONFLICT (site_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()', [siteId, state])
  }
  async addMedia(m: Omit<Media, 'id' | 'createdAt' | 'bytes'> & { id?: string }, data: Buffer) {
    const id = m.id ?? randomUUID().replace(/-/g, '')
    await this.q('INSERT INTO ss_media (id, site_id, mime, width, height, alt, data) VALUES ($1,$2,$3,$4,$5,$6,$7)', [id, m.siteId, m.mime, m.width, m.height, m.alt, data])
    return { siteId: m.siteId, mime: m.mime, width: m.width, height: m.height, alt: m.alt, id, bytes: data.length, createdAt: new Date().toISOString() }
  }
  async mediaForSite(siteId: string) {
    const rows = await this.q<{ id: string; site_id: string; mime: string; width: number; height: number; alt: string; bytes: number; created_at: string }>(
      'SELECT id, site_id, mime, width, height, alt, octet_length(data) AS bytes, created_at FROM ss_media WHERE site_id = $1 ORDER BY created_at DESC',
      [siteId]
    )
    return rows.map((r) => ({ id: r.id, siteId: r.site_id, mime: r.mime, width: r.width, height: r.height, alt: r.alt, bytes: Number(r.bytes), createdAt: new Date(r.created_at).toISOString() }))
  }
  async mediaFile(id: string) {
    const r = (await this.q<{ mime: string; data: Buffer }>('SELECT mime, data FROM ss_media WHERE id = $1', [id]))[0]
    return r ?? null
  }
  async deleteMedia(siteId: string, id: string) {
    await this.q('DELETE FROM ss_media WHERE id = $1 AND site_id = $2', [id, siteId])
  }
  // Stock photos a deleted site held go back to the pool (ss_photos has no
  // foreign key, so they'd otherwise stay reserved forever).
  async deleteSite(ownerId: string, siteId: string) {
    const r = await this.q('DELETE FROM ss_sites WHERE id = $1 AND owner_id = $2 RETURNING id', [siteId, ownerId])
    if (r.length) await this.q('DELETE FROM ss_photos WHERE site_id = $1', [siteId])
  }
  async deleteUser(userId: string) {
    await this.q('DELETE FROM ss_photos WHERE site_id IN (SELECT id FROM ss_sites WHERE owner_id = $1)', [userId])
    await this.q('DELETE FROM ss_users WHERE id = $1', [userId])
  }
  async updateUser(userId: string, changes: { name?: string; passwordHash?: string }) {
    if (changes.name) await this.q('UPDATE ss_users SET name = $2 WHERE id = $1', [userId, changes.name])
    if (changes.passwordHash) await this.q('UPDATE ss_users SET password_hash = $2 WHERE id = $1', [userId, changes.passwordHash])
  }
  async addMessage(m: NewMessage) {
    const msg: Message = { ...m, id: randomUUID(), createdAt: new Date().toISOString(), read: false }
    await this.q('INSERT INTO ss_messages (id, site_id, data) VALUES ($1,$2,$3)', [msg.id, msg.siteId, msg])
    return msg
  }
  async messagesForSite(siteId: string, limit = 200) {
    const rows = await this.q<{ data: Message; read: boolean }>('SELECT data, read FROM ss_messages WHERE site_id = $1 ORDER BY created_at DESC LIMIT $2', [siteId, limit])
    return rows.map((r) => ({ ...r.data, read: r.read }))
  }
  async setMessageRead(siteId: string, messageId: string, read: boolean) {
    await this.q('UPDATE ss_messages SET read = $3 WHERE id = $1 AND site_id = $2', [messageId, siteId, read])
  }
  async deleteMessage(siteId: string, messageId: string) {
    await this.q('DELETE FROM ss_messages WHERE id = $1 AND site_id = $2', [messageId, siteId])
  }
  async unreadCount(siteId: string) {
    const r = await this.q<{ n: string }>('SELECT count(*) AS n FROM ss_messages WHERE site_id = $1 AND NOT read', [siteId])
    return Number(r[0]?.n ?? 0)
  }
  async recentMessageCount(siteId: string, since: Date) {
    const r = await this.q<{ n: string }>('SELECT count(*) AS n FROM ss_messages WHERE site_id = $1 AND created_at > $2', [siteId, since.toISOString()])
    return Number(r[0]?.n ?? 0)
  }
  async logoIdeas(siteId: string) {
    const r = (await this.q<{ data: LogoIdeasState }>('SELECT data FROM ss_logo_ideas WHERE site_id = $1', [siteId]))[0]
    return r ? r.data : { ideas: [] }
  }
  async saveLogoIdeas(siteId: string, state: LogoIdeasState) {
    await this.q('INSERT INTO ss_logo_ideas (site_id, data) VALUES ($1,$2) ON CONFLICT (site_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()', [siteId, state])
  }
  async recordVisit(siteId: string, day: string, path: string) {
    await this.q('INSERT INTO ss_visits (site_id, day, path, views) VALUES ($1,$2,$3,1) ON CONFLICT (site_id, day, path) DO UPDATE SET views = ss_visits.views + 1', [siteId, day, path])
  }
  async visitsSince(siteId: string, day: string) {
    const rows = await this.q<{ day: string; path: string; views: number }>(
      "SELECT to_char(day, 'YYYY-MM-DD') AS day, path, views FROM ss_visits WHERE site_id = $1 AND day >= $2 AND path <> '#call' ORDER BY day",
      [siteId, day]
    )
    return rows.map((r) => ({ day: r.day, path: r.path, views: Number(r.views) }))
  }
  async callsSince(siteId: string, day: string) {
    const r = await this.q<{ n: string | null }>("SELECT sum(views) AS n FROM ss_visits WHERE site_id = $1 AND day >= $2 AND path = '#call'", [siteId, day])
    return Number(r[0]?.n ?? 0)
  }
  async savePreview(p: Preview, who: string) {
    await this.q('INSERT INTO ss_previews (id, who, data) VALUES ($1,$2,$3)', [p.id, who, p])
  }
  async preview(id: string) {
    const r = (await this.q<{ data: Preview }>("SELECT data FROM ss_previews WHERE id = $1 AND created_at > now() - interval '30 days'", [id]))[0]
    return r ? r.data : null
  }
  async claimPreview(id: string, by: string, siteId: string) {
    const r = await this.q("UPDATE ss_previews SET data = jsonb_set(data, '{claimed}', $2::jsonb) WHERE id = $1 AND NOT (data ? 'claimed') RETURNING id", [id, JSON.stringify({ by, siteId })])
    return r.length > 0
  }
  async previewCount(since: Date, who?: string) {
    const r = who
      ? await this.q<{ n: string }>('SELECT count(*) AS n FROM ss_previews WHERE who = $1 AND created_at > $2', [who, since])
      : await this.q<{ n: string }>('SELECT count(*) AS n FROM ss_previews WHERE created_at > $1', [since])
    return Number(r[0]?.n ?? 0)
  }
  async addFeedback(f: Feedback) {
    await this.q('INSERT INTO ss_feedback (id, data) VALUES ($1,$2)', [f.id, JSON.stringify(f)])
  }
  async analytics(sinceDay: string) {
    type Row = { d: Date | string; n: string }
    const series = (sql: string) => this.q<Row>(sql, [sinceDay])
    const [signups, sites, leads, visits, previews, talks, ai, bills, totals, top] = await Promise.all([
      series('SELECT created_at::date AS d, count(*) AS n FROM ss_users WHERE created_at >= $1::date GROUP BY 1'),
      series('SELECT created_at::date AS d, count(*) AS n FROM ss_sites WHERE created_at >= $1::date GROUP BY 1'),
      series('SELECT created_at::date AS d, count(*) AS n FROM ss_messages WHERE created_at >= $1::date GROUP BY 1'),
      this.q<{ d: Date | string; views: string; calls: string }>("SELECT day AS d, coalesce(sum(views) FILTER (WHERE path <> '#call'), 0) AS views, coalesce(sum(views) FILTER (WHERE path = '#call'), 0) AS calls FROM ss_visits WHERE day >= $1::date GROUP BY 1", [sinceDay]),
      series('SELECT created_at::date AS d, count(*) AS n FROM ss_previews WHERE created_at >= $1::date GROUP BY 1'),
      series("SELECT created_at::date AS d, count(*) AS n FROM ss_feedback WHERE created_at >= $1::date AND data->>'page' LIKE 'Let’s talk%' GROUP BY 1"),
      series('SELECT day AS d, sum(micros) AS n FROM ss_usage WHERE day >= $1::date GROUP BY 1'),
      this.q<{ data: Billing }>('SELECT data FROM ss_billing'),
      this.q<Record<string, string>>('SELECT (SELECT count(*) FROM ss_users) AS users, (SELECT count(*) FROM ss_sites) AS sites, (SELECT count(*) FROM ss_sites WHERE custom_domain IS NOT NULL) AS domains, (SELECT count(*) FROM ss_members) AS members'),
      this.q<{ id: string; name: string | null; subdomain: string; views: string; calls: string; leads: string }>(
        `SELECT s.id, s.data->'business'->>'name' AS name, s.subdomain,
          coalesce(v.views, 0) AS views, coalesce(v.calls, 0) AS calls, coalesce(m.leads, 0) AS leads
         FROM ss_sites s
         LEFT JOIN (SELECT site_id, sum(views) FILTER (WHERE path <> '#call') AS views, sum(views) FILTER (WHERE path = '#call') AS calls FROM ss_visits WHERE day >= $1::date GROUP BY 1) v ON v.site_id = s.id
         LEFT JOIN (SELECT site_id, count(*) AS leads FROM ss_messages WHERE created_at >= $1::date GROUP BY 1) m ON m.site_id = s.id
         WHERE coalesce(v.views, 0) + coalesce(v.calls, 0) + coalesce(m.leads, 0) > 0
         ORDER BY leads DESC, calls DESC, views DESC LIMIT 10`,
        [sinceDay],
      ),
    ])
    const day = (d: Date | string) => (typeof d === 'string' ? d.slice(0, 10) : d.toISOString().slice(0, 10))
    const days = new Map<string, AnalyticsRaw['daily'][number]>()
    const put = (rows: Row[], k: keyof Omit<AnalyticsRaw['daily'][number], 'day'>) => {
      for (const r of rows) {
        const d = day(r.d)
        const row = days.get(d) ?? { day: d }
        row[k] = Number(r.n)
        days.set(d, row)
      }
    }
    put(signups, 'signups')
    put(sites, 'sites')
    put(leads, 'leads')
    put(visits.map((v) => ({ d: v.d, n: v.views })), 'views')
    put(visits.map((v) => ({ d: v.d, n: v.calls })), 'calls')
    put(previews, 'previews')
    put(talks, 'talks')
    put(ai, 'aiMicros')
    const t = totals[0] ?? {}
    return {
      daily: [...days.values()],
      billing: bills.map((b) => b.data),
      totals: { users: Number(t.users ?? 0), sites: Number(t.sites ?? 0), customDomains: Number(t.domains ?? 0), members: Number(t.members ?? 0) },
      topSites: top.map((r) => ({ id: r.id, name: r.name ?? r.subdomain, subdomain: r.subdomain, views: Number(r.views), leads: Number(r.leads), calls: Number(r.calls) })),
    }
  }
  async articles() {
    return (await this.q<{ data: Article }>('SELECT data FROM ss_articles')).map((r) => r.data)
  }
  async saveArticle(a: Article) {
    await this.q('INSERT INTO ss_articles (slug, data, updated_at) VALUES ($1,$2,now()) ON CONFLICT (slug) DO UPDATE SET data = EXCLUDED.data, updated_at = now()', [a.slug, JSON.stringify(a)])
  }
  async deleteArticle(slug: string) {
    await this.q('DELETE FROM ss_articles WHERE slug = $1', [slug])
  }
  async campaigns() {
    return (await this.q<{ data: Campaign }>('SELECT data FROM ss_campaigns ORDER BY updated_at DESC')).map((r) => r.data)
  }
  async saveCampaign(c: Campaign) {
    await this.q('INSERT INTO ss_campaigns (slug, data, updated_at) VALUES ($1,$2,now()) ON CONFLICT (slug) DO UPDATE SET data = EXCLUDED.data, updated_at = now()', [c.slug, JSON.stringify(c)])
  }
  async prospects(campaign?: string) {
    const rows = campaign
      ? await this.q<{ data: Prospect }>('SELECT data FROM ss_prospects WHERE campaign = $1 ORDER BY created_at', [campaign])
      : await this.q<{ data: Prospect }>('SELECT data FROM ss_prospects ORDER BY created_at')
    return rows.map((r) => r.data)
  }
  async prospect(id: string) {
    return (await this.q<{ data: Prospect }>('SELECT data FROM ss_prospects WHERE id = $1', [id]))[0]?.data ?? null
  }
  async prospectByPreview(previewId: string) {
    return (await this.q<{ data: Prospect }>("SELECT data FROM ss_prospects WHERE data->>'previewId' = $1 LIMIT 1", [previewId]))[0]?.data ?? null
  }
  async saveProspect(p: Prospect) {
    await this.q('INSERT INTO ss_prospects (id, campaign, data) VALUES ($1,$2,$3) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data', [p.id, p.campaign, JSON.stringify(p)])
  }
  async reports() {
    return (await this.q<{ data: CityReport }>('SELECT data FROM ss_reports ORDER BY updated_at DESC')).map((r) => r.data)
  }
  async report(slug: string) {
    return (await this.q<{ data: CityReport }>('SELECT data FROM ss_reports WHERE slug = $1', [slug]))[0]?.data ?? null
  }
  async saveReport(r: CityReport) {
    await this.q('INSERT INTO ss_reports (slug, data, updated_at) VALUES ($1,$2,now()) ON CONFLICT (slug) DO UPDATE SET data = EXCLUDED.data, updated_at = now()', [r.slug, JSON.stringify(r)])
  }
  async feedback(limit: number) {
    return (await this.q<{ data: Feedback }>('SELECT data FROM ss_feedback ORDER BY created_at DESC LIMIT $1', [limit])).map((r) => r.data)
  }
  async launchStats(sinceDay: string) {
    const [t] = await this.q<Record<string, string | null>>(
      `SELECT
        (SELECT count(*) FROM ss_users) AS users,
        (SELECT count(*) FROM ss_users WHERE created_at >= $1::date) AS users_since,
        (SELECT count(*) FROM ss_billing WHERE data->>'promo' IN ('BIRTHDAY', 'EARLY')) AS birthday,
        (SELECT count(*) FROM ss_billing WHERE data->>'status' = 'active') AS paying,
        (SELECT count(*) FROM ss_sites) AS sites,
        (SELECT count(*) FROM ss_sites WHERE created_at >= $1::date) AS sites_since,
        (SELECT count(*) FROM ss_feedback) AS feedback,
        (SELECT count(*) FROM ss_feedback WHERE created_at >= $1::date) AS feedback_since,
        (SELECT count(*) FROM ss_messages WHERE created_at >= $1::date) AS messages_since,
        (SELECT coalesce(sum(views), 0) FROM ss_visits WHERE day >= $1::date AND path <> '#call') AS views_since,
        (SELECT coalesce(sum(views), 0) FROM ss_visits WHERE day >= $1::date AND path = '#call') AS calls_since`,
      [sinceDay],
    )
    const rows = await this.q<{ name: string; email: string; created_at: Date; sites: string; promo: string | null; status: string | null; reward: string | null }>(
      `SELECT u.name, u.email, u.created_at,
        (SELECT count(*) FROM ss_sites s WHERE s.owner_id = u.id) AS sites,
        b.data->>'promo' AS promo, b.data->>'status' AS status, b.data->>'feedbackReward' AS reward
       FROM ss_users u LEFT JOIN ss_billing b ON b.user_id = u.id
       ORDER BY u.created_at DESC LIMIT 25`,
    )
    const n = (k: string) => Number(t?.[k] ?? 0)
    return {
      users: n('users'), usersSince: n('users_since'), birthday: n('birthday'), paying: n('paying'),
      sites: n('sites'), sitesSince: n('sites_since'), feedback: n('feedback'), feedbackSince: n('feedback_since'),
      messagesSince: n('messages_since'), viewsSince: n('views_since'), callsSince: n('calls_since'),
      recent: rows.map((r) => ({ name: r.name, email: r.email, createdAt: new Date(r.created_at).toISOString(), sites: Number(r.sites), promo: r.promo ?? undefined, status: r.status ?? undefined, reward: !!r.reward })),
    }
  }
  async billing(userId: string) {
    const r = await this.q<{ data: Billing }>('SELECT data FROM ss_billing WHERE user_id = $1', [userId])
    return r[0]?.data ?? null
  }
  async saveBilling(userId: string, b: Billing) {
    await this.q('INSERT INTO ss_billing (user_id, data) VALUES ($1,$2) ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()', [userId, JSON.stringify(b)])
  }
  async recordUsage(siteId: string, day: string, micros: number) {
    await this.q('INSERT INTO ss_usage (site_id, day, micros, messages) VALUES ($1,$2,$3,1) ON CONFLICT (site_id, day) DO UPDATE SET micros = ss_usage.micros + EXCLUDED.micros, messages = ss_usage.messages + 1', [siteId, day, Math.round(micros)])
  }
  async siteUsage(siteId: string, sinceDay: string) {
    const r = await this.q<{ m: string | null; n: string | null }>('SELECT sum(micros) AS m, sum(messages) AS n FROM ss_usage WHERE site_id = $1 AND day >= $2', [siteId, sinceDay])
    return { micros: Number(r[0]?.m ?? 0), messages: Number(r[0]?.n ?? 0) }
  }
  async dayUsage(day: string) {
    const r = await this.q<{ m: string | null; n: string | null }>('SELECT sum(micros) AS m, sum(messages) AS n FROM ss_usage WHERE day = $1', [day])
    return { micros: Number(r[0]?.m ?? 0), messages: Number(r[0]?.n ?? 0) }
  }
  async cacheGet(key: string, maxAgeMs: number) {
    const r = await this.q<{ data: unknown }>('SELECT data FROM ss_cache WHERE key = $1 AND created_at > $2', [key, new Date(Date.now() - maxAgeMs)])
    return r[0]?.data ?? null
  }
  async cacheSet(key: string, data: unknown) {
    await this.q('INSERT INTO ss_cache (key, data) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, created_at = now()', [key, JSON.stringify(data)])
  }
  async photosTaken(exceptSiteId?: string) {
    // Only sites that still exist hold a photo (older deletes left rows behind).
    const r = await this.q<{ photo: string }>('SELECT p.photo FROM ss_photos p JOIN ss_sites s ON s.id = p.site_id WHERE p.site_id <> $1', [exceptSiteId ?? ''])
    return new Set(r.map((x) => x.photo))
  }
  async setSitePhotos(siteId: string, keys: string[]) {
    await this.q('DELETE FROM ss_photos WHERE site_id = $1 AND NOT (photo = ANY($2::text[]))', [siteId, keys])
    if (keys.length)
      await this.q(
        'INSERT INTO ss_photos (photo, site_id) SELECT unnest($1::text[]), $2 ON CONFLICT (photo) DO UPDATE SET site_id = EXCLUDED.site_id, created_at = now() WHERE NOT EXISTS (SELECT 1 FROM ss_sites s WHERE s.id = ss_photos.site_id)',
        [keys, siteId],
      )
  }
  async seoState(siteId: string) {
    return (await this.q<{ data: unknown }>('SELECT data FROM ss_seo WHERE site_id = $1', [siteId]))[0]?.data ?? null
  }
  async saveSeoState(siteId: string, state: unknown) {
    await this.q('INSERT INTO ss_seo (site_id, data, updated_at) VALUES ($1,$2,now()) ON CONFLICT (site_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()', [siteId, JSON.stringify(state)])
  }
  async crmState(siteId: string) {
    return (await this.q<{ data: unknown }>('SELECT data FROM ss_crm WHERE site_id = $1', [siteId]))[0]?.data ?? null
  }
  async saveCrmState(siteId: string, state: unknown) {
    await this.q('INSERT INTO ss_crm (site_id, data, updated_at) VALUES ($1,$2,now()) ON CONFLICT (site_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()', [siteId, JSON.stringify(state)])
  }
  async allSites() {
    return (await this.q<{ data: Site }>('SELECT data FROM ss_sites ORDER BY created_at')).map((r) => SiteSchema.parse(r.data))
  }
  async siteById(siteId: string) {
    const r = (await this.q<{ data: Site }>('SELECT data FROM ss_sites WHERE id = $1', [siteId]))[0]
    return r ? SiteSchema.parse(r.data) : null
  }
  async addMember(siteId: string, userId: string) {
    await this.q('INSERT INTO ss_members (site_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [siteId, userId])
  }
  async removeMember(siteId: string, userId: string) {
    await this.q('DELETE FROM ss_members WHERE site_id = $1 AND user_id = $2', [siteId, userId])
  }
  async membersForSite(siteId: string) {
    return (await this.q<{ user_id: string; email: string; name: string; added_at: Date }>('SELECT m.user_id, u.email, u.name, m.added_at FROM ss_members m JOIN ss_users u ON u.id = m.user_id WHERE m.site_id = $1 ORDER BY m.added_at', [siteId])).map((r) => ({ userId: r.user_id, email: r.email, name: r.name, addedAt: new Date(r.added_at).toISOString() }))
  }
  async memberSites(userId: string) {
    return (await this.q<{ data: Site }>('SELECT s.data FROM ss_members m JOIN ss_sites s ON s.id = m.site_id WHERE m.user_id = $1 ORDER BY m.added_at', [userId])).map((r) => SiteSchema.parse(r.data))
  }
  async isMember(siteId: string, userId: string) {
    return (await this.q('SELECT 1 FROM ss_members WHERE site_id = $1 AND user_id = $2', [siteId, userId])).length > 0
  }
  async createInvite(siteId: string, email: string, code: string) {
    await this.q('INSERT INTO ss_invites (code, site_id, email) VALUES ($1,$2,$3)', [code, siteId, email])
  }
  async invite(code: string) {
    const r = (await this.q<{ code: string; site_id: string; email: string; created_at: Date }>('SELECT * FROM ss_invites WHERE code = $1', [code]))[0]
    return r ? { code: r.code, siteId: r.site_id, email: r.email, createdAt: new Date(r.created_at).toISOString() } : null
  }
  async deleteInvite(code: string) {
    await this.q('DELETE FROM ss_invites WHERE code = $1', [code])
  }
  async invitesForSite(siteId: string) {
    return (await this.q<{ code: string; site_id: string; email: string; created_at: Date }>('SELECT * FROM ss_invites WHERE site_id = $1 ORDER BY created_at', [siteId])).map((r) => ({ code: r.code, siteId: r.site_id, email: r.email, createdAt: new Date(r.created_at).toISOString() }))
  }
  async crmSites() {
    return (await this.q<{ site: Site; data: unknown }>('SELECT s.data AS site, c.data FROM ss_crm c JOIN ss_sites s ON s.id = c.site_id')).map((r) => ({ site: SiteSchema.parse(r.site), state: r.data }))
  }
  async recordScore(siteId: string, day: string, score: number) {
    await this.q('INSERT INTO ss_scores (site_id, day, score) VALUES ($1,$2,$3) ON CONFLICT (site_id, day) DO UPDATE SET score = EXCLUDED.score', [siteId, day, score])
  }
  async leagueSites(day: string) {
    const [sites, scores, visits] = await Promise.all([
      this.q<{ data: Site }>('SELECT s.data FROM ss_sites s WHERE EXISTS (SELECT 1 FROM ss_scores c WHERE c.site_id = s.id AND c.day >= $1)', [day]),
      this.q<{ site_id: string; day: string; score: number }>("SELECT site_id, to_char(day, 'YYYY-MM-DD') AS day, score FROM ss_scores WHERE day >= $1", [day]),
      this.q<{ site_id: string; day: string; views: string }>("SELECT site_id, to_char(day, 'YYYY-MM-DD') AS day, SUM(views) AS views FROM ss_visits WHERE day >= $1 AND path <> '#call' GROUP BY site_id, day", [day]),
    ])
    const out = new Map<string, LeagueSite>()
    for (const r of sites) {
      const site = SiteSchema.safeParse(r.data)
      if (site.success) out.set(site.data.id, { site: site.data, scores: [], visits: [] })
    }
    for (const r of scores) out.get(r.site_id)?.scores.push({ day: r.day, score: Number(r.score) })
    for (const r of visits) out.get(r.site_id)?.visits.push({ day: r.day, views: Number(r.views) })
    return [...out.values()]
  }
}

function toUser(r: Record<string, unknown> | undefined): User | null {
  if (!r) return null
  return { id: String(r.id), email: String(r.email), name: String(r.name), passwordHash: String(r.password_hash), createdAt: new Date(r.created_at as string).toISOString() }
}

// ---------------------------------------------------------------------------
// In memory (development and the unconnected test deployment)
// ---------------------------------------------------------------------------

export class MemoryStore implements Store {
  readonly persistent = false
  private users = new Map<string, User>()
  private sites = new Map<string, { ownerId: string; site: Site; at?: string }>()
  private pages = new Map<string, Page>()
  readonly revisions: { pageId: string; author: RevisionAuthor; note?: string }[] = []

  async createUser(input: { email: string; name: string; passwordHash: string }) {
    const user: User = { id: randomUUID(), createdAt: new Date().toISOString(), ...input }
    this.users.set(user.id, user)
    return user
  }
  async userByEmail(email: string) {
    return [...this.users.values()].find((u) => u.email === email) ?? null
  }
  async userById(id: string) {
    return this.users.get(id) ?? null
  }
  async createSite(ownerId: string, site: Site, pages: Page[]) {
    if (await this.subdomainTaken(site.subdomain)) throw new Error('subdomain taken')
    this.sites.set(site.id, { ownerId, site: SiteSchema.parse(site), at: new Date().toISOString() })
    for (const p of pages) await this.savePage(p, 'owner', ownerId, 'Site created')
  }
  async sitesForUser(ownerId: string) {
    return [...this.sites.values()].filter((s) => s.ownerId === ownerId).map((s) => s.site)
  }
  async siteForUser(ownerId: string, siteId: string) {
    const s = this.sites.get(siteId)
    return s && s.ownerId === ownerId ? s.site : null
  }
  async siteBySubdomain(subdomain: string) {
    return [...this.sites.values()].find((s) => s.site.subdomain === subdomain)?.site ?? SHOWCASE[subdomain]?.site ?? null
  }
  async siteByDomain(domain: string) {
    return [...this.sites.values()].find((s) => s.site.customDomain === domain)?.site ?? null
  }
  async subdomainTaken(subdomain: string) {
    return !!SHOWCASE[subdomain] || [...this.sites.values()].some((s) => s.site.subdomain === subdomain)
  }
  async updateSite(site: Site) {
    const s = this.sites.get(site.id)
    if (s) s.site = SiteSchema.parse(site)
  }
  async siteByHandoff(code: string) {
    return [...this.sites.values()].find((s) => s.site.handoff?.code === code)?.site ?? null
  }
  async transferSite(siteId: string, toOwnerId: string) {
    const s = this.sites.get(siteId)
    if (s) {
      s.ownerId = toOwnerId
      s.site = { ...s.site, orgId: toOwnerId }
    }
  }
  async pagesForSite(siteId: string) {
    const demo = Object.values(SHOWCASE).find((d) => d.site.id === siteId)
    if (demo) return demo.pages
    return [...this.pages.values()].filter((p) => p.siteId === siteId).sort((a, b) => a.slug.localeCompare(b.slug))
  }
  async savePage(page: Page, author: RevisionAuthor, _userId: string | null, note?: string) {
    const p = PageSchema.parse(page)
    this.pages.set(p.id, p)
    this.revisions.push({ pageId: p.id, author, note })
  }
  private redirects = new Map<string, Redirect[]>()
  async redirectsForSite(siteId: string) {
    return structuredClone(this.redirects.get(siteId) ?? [])
  }
  async saveRedirects(siteId: string, redirects: Redirect[]) {
    this.redirects.set(siteId, redirects.map((r) => RedirectSchema.parse(r)))
  }
  private sofie = new Map<string, SofieState>()
  async sofieState(siteId: string) {
    return structuredClone(this.sofie.get(siteId) ?? emptySofieState())
  }
  async saveSofieState(siteId: string, state: SofieState) {
    this.sofie.set(siteId, structuredClone(state))
  }
  private media = new Map<string, { meta: Media; data: Buffer }>()
  async addMedia(m: Omit<Media, 'id' | 'createdAt' | 'bytes'> & { id?: string }, data: Buffer) {
    const meta: Media = { siteId: m.siteId, mime: m.mime, width: m.width, height: m.height, alt: m.alt, id: m.id ?? randomUUID().replace(/-/g, ''), bytes: data.length, createdAt: new Date().toISOString() }
    this.media.set(meta.id, { meta, data })
    return { ...meta }
  }
  async mediaForSite(siteId: string) {
    return [...this.media.values()].filter((x) => x.meta.siteId === siteId).map((x) => ({ ...x.meta })).reverse()
  }
  async mediaFile(id: string) {
    const x = this.media.get(id)
    return x ? { mime: x.meta.mime, data: x.data } : null
  }
  async deleteMedia(siteId: string, id: string) {
    const x = this.media.get(id)
    if (x && x.meta.siteId === siteId) this.media.delete(id)
  }
  async deleteSite(ownerId: string, siteId: string) {
    const s = this.sites.get(siteId)
    if (!s || s.ownerId !== ownerId) return
    this.sites.delete(siteId)
    for (const [id, p] of this.pages) if (p.siteId === siteId) this.pages.delete(id)
    this.sofie.delete(siteId)
    this.messages = this.messages.filter((m) => m.siteId !== siteId)
    for (const [id, x] of this.media) if (x.meta.siteId === siteId) this.media.delete(id)
    for (const [k, v] of this.visits) if (v.siteId === siteId) this.visits.delete(k)
    for (const [k, site] of this.photos) if (site === siteId) this.photos.delete(k)
    this.logos.delete(siteId)
  }
  async deleteUser(userId: string) {
    for (const [id, s] of this.sites) if (s.ownerId === userId) await this.deleteSite(userId, id)
    this.users.delete(userId)
  }
  async updateUser(userId: string, changes: { name?: string; passwordHash?: string }) {
    const u = this.users.get(userId)
    if (!u) return
    if (changes.name) u.name = changes.name
    if (changes.passwordHash) u.passwordHash = changes.passwordHash
  }
  private messages: Message[] = []
  async addMessage(m: NewMessage) {
    const msg: Message = { ...m, id: randomUUID(), createdAt: new Date().toISOString(), read: false }
    this.messages.unshift(msg)
    return structuredClone(msg)
  }
  async messagesForSite(siteId: string, limit = 200) {
    return structuredClone(this.messages.filter((m) => m.siteId === siteId).slice(0, limit))
  }
  async setMessageRead(siteId: string, messageId: string, read: boolean) {
    const m = this.messages.find((x) => x.id === messageId && x.siteId === siteId)
    if (m) m.read = read
  }
  async deleteMessage(siteId: string, messageId: string) {
    this.messages = this.messages.filter((x) => !(x.id === messageId && x.siteId === siteId))
  }
  async unreadCount(siteId: string) {
    return this.messages.filter((m) => m.siteId === siteId && !m.read).length
  }
  async recentMessageCount(siteId: string, since: Date) {
    return this.messages.filter((m) => m.siteId === siteId && Date.parse(m.createdAt) > since.getTime()).length
  }
  private logos = new Map<string, LogoIdeasState>()
  async logoIdeas(siteId: string) {
    return structuredClone(this.logos.get(siteId) ?? { ideas: [] })
  }
  async saveLogoIdeas(siteId: string, state: LogoIdeasState) {
    this.logos.set(siteId, structuredClone(state))
  }
  private visits = new Map<string, Visit & { siteId: string }>()
  async recordVisit(siteId: string, day: string, path: string) {
    const key = `${siteId} ${day} ${path}`
    const v = this.visits.get(key)
    if (v) v.views++
    else this.visits.set(key, { siteId, day, path, views: 1 })
  }
  async visitsSince(siteId: string, day: string) {
    return [...this.visits.values()]
      .filter((v) => v.siteId === siteId && v.day >= day && v.path !== '#call')
      .map(({ day, path, views }) => ({ day, path, views }))
      .sort((a, b) => a.day.localeCompare(b.day))
  }
  async callsSince(siteId: string, day: string) {
    return [...this.visits.values()].filter((v) => v.siteId === siteId && v.day >= day && v.path === '#call').reduce((n, v) => n + v.views, 0)
  }
  private previews = new Map<string, { p: Preview; who: string; at: number }>()
  async savePreview(p: Preview, who: string) {
    this.previews.set(p.id, { p: structuredClone(p), who, at: Date.now() })
  }
  async preview(id: string) {
    const r = this.previews.get(id)
    return r ? structuredClone(r.p) : null
  }
  async claimPreview(id: string, by: string, siteId: string) {
    const r = this.previews.get(id)
    if (!r || r.p.claimed) return false
    r.p.claimed = { by, siteId }
    return true
  }
  async previewCount(since: Date, who?: string) {
    return [...this.previews.values()].filter((r) => r.at > since.getTime() && (!who || r.who === who)).length
  }
  async analytics(sinceDay: string) {
    const days = new Map<string, AnalyticsRaw['daily'][number]>()
    const add = (d: string, k: keyof Omit<AnalyticsRaw['daily'][number], 'day'>, n = 1) => {
      if (d < sinceDay) return
      const row = days.get(d) ?? { day: d }
      row[k] = (row[k] ?? 0) + n
      days.set(d, row)
    }
    for (const u of this.users.values()) add(u.createdAt.slice(0, 10), 'signups')
    for (const s of this.sites.values()) if (s.at) add(s.at.slice(0, 10), 'sites')
    for (const m of this.messages) add(m.createdAt.slice(0, 10), 'leads')
    for (const v of this.visits.values()) add(v.day, v.path === '#call' ? 'calls' : 'views', v.views)
    for (const p of this.previews.values()) add(new Date(p.at).toISOString().slice(0, 10), 'previews')
    for (const f of this.notes) if (f.page.startsWith('Let’s talk')) add(f.at.slice(0, 10), 'talks')
    for (const [k, u] of this.usage) add(k.split('|')[1], 'aiMicros', u.micros)
    const per = new Map<string, { views: number; calls: number; leads: number }>()
    const bump = (id: string, k: 'views' | 'calls' | 'leads', n: number) => {
      const r = per.get(id) ?? { views: 0, calls: 0, leads: 0 }
      r[k] += n
      per.set(id, r)
    }
    for (const v of this.visits.values()) if (v.day >= sinceDay) bump(v.siteId, v.path === '#call' ? 'calls' : 'views', v.views)
    for (const m of this.messages) if (m.createdAt.slice(0, 10) >= sinceDay) bump(m.siteId, 'leads', 1)
    const sites = [...this.sites.values()]
    return {
      daily: [...days.values()],
      billing: [...this.bills.values()],
      totals: { users: this.users.size, sites: sites.length, customDomains: sites.filter((s) => s.site.customDomain).length, members: this.members.length },
      topSites: [...per]
        .flatMap(([id, r]) => {
          const s = this.sites.get(id)
          return s ? [{ id, name: s.site.business.name, subdomain: s.site.subdomain, ...r }] : []
        })
        .sort((a, b) => b.leads - a.leads || b.calls - a.calls || b.views - a.views)
        .slice(0, 10),
    }
  }
  private posts = new Map<string, Article>()
  async articles() {
    return [...this.posts.values()]
  }
  async saveArticle(a: Article) {
    this.posts.set(a.slug, a)
  }
  async deleteArticle(slug: string) {
    this.posts.delete(slug)
  }
  private camps = new Map<string, Campaign>()
  async campaigns() {
    return [...this.camps.values()].reverse().map((c) => structuredClone(c))
  }
  async saveCampaign(c: Campaign) {
    this.camps.delete(c.slug)
    this.camps.set(c.slug, structuredClone(c))
  }
  private prosp = new Map<string, Prospect>()
  async prospects(campaign?: string) {
    return [...this.prosp.values()].filter((p) => !campaign || p.campaign === campaign).map((p) => structuredClone(p))
  }
  async prospect(id: string) {
    const p = this.prosp.get(id)
    return p ? structuredClone(p) : null
  }
  async prospectByPreview(previewId: string) {
    const p = [...this.prosp.values()].find((x) => x.previewId === previewId)
    return p ? structuredClone(p) : null
  }
  async saveProspect(p: Prospect) {
    this.prosp.set(p.id, structuredClone(p))
  }
  private reps = new Map<string, CityReport>()
  async reports() {
    return [...this.reps.values()].reverse().map((r) => structuredClone(r))
  }
  async report(slug: string) {
    const r = this.reps.get(slug)
    return r ? structuredClone(r) : null
  }
  async saveReport(r: CityReport) {
    this.reps.delete(r.slug)
    this.reps.set(r.slug, structuredClone(r))
  }
  private notes: Feedback[] = []
  async addFeedback(f: Feedback) {
    this.notes.unshift(f)
  }
  async feedback(limit: number) {
    return this.notes.slice(0, limit)
  }
  private bills = new Map<string, Billing>()
  async billing(userId: string) {
    return this.bills.get(userId) ?? null
  }
  async saveBilling(userId: string, b: Billing) {
    this.bills.set(userId, b)
  }
  async launchStats(sinceDay: string) {
    const users = [...this.users.values()]
    const sites = [...this.sites.values()]
    const bills = [...this.bills.values()]
    const visits = [...this.visits.values()].filter((v) => v.day >= sinceDay)
    const since = (at: string) => at.slice(0, 10) >= sinceDay
    return {
      users: users.length,
      usersSince: users.filter((u) => since(u.createdAt)).length,
      birthday: bills.filter((b) => b.promo === 'BIRTHDAY' || b.promo === 'EARLY').length,
      paying: bills.filter((b) => b.status === 'active').length,
      sites: sites.length,
      sitesSince: sites.filter((s) => s.at && since(s.at)).length,
      feedback: this.notes.length,
      feedbackSince: this.notes.filter((f) => since(f.at)).length,
      messagesSince: this.messages.filter((m) => since(m.createdAt)).length,
      viewsSince: visits.filter((v) => v.path !== '#call').reduce((n, v) => n + v.views, 0),
      callsSince: visits.filter((v) => v.path === '#call').reduce((n, v) => n + v.views, 0),
      recent: [...users]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 25)
        .map((u) => {
          const b = this.bills.get(u.id)
          return { name: u.name, email: u.email, createdAt: u.createdAt, sites: sites.filter((s) => s.ownerId === u.id).length, promo: b?.promo, status: b?.status, reward: !!b?.feedbackReward }
        }),
    }
  }
  private usage = new Map<string, { micros: number; messages: number }>()
  async recordUsage(siteId: string, day: string, micros: number) {
    const k = `${siteId}|${day}`
    const u = this.usage.get(k) ?? { micros: 0, messages: 0 }
    this.usage.set(k, { micros: u.micros + Math.round(micros), messages: u.messages + 1 })
  }
  async siteUsage(siteId: string, sinceDay: string) {
    let micros = 0
    let messages = 0
    for (const [k, u] of this.usage) {
      const [site, day] = k.split('|')
      if (site === siteId && day >= sinceDay) (micros += u.micros), (messages += u.messages)
    }
    return { micros, messages }
  }
  async dayUsage(day: string) {
    let micros = 0
    let messages = 0
    for (const [k, u] of this.usage) if (k.endsWith(`|${day}`)) (micros += u.micros), (messages += u.messages)
    return { micros, messages }
  }
  private cache = new Map<string, { data: unknown; at: number }>()
  async cacheGet(key: string, maxAgeMs: number) {
    const hit = this.cache.get(key)
    return hit && hit.at > Date.now() - maxAgeMs ? hit.data : null
  }
  async cacheSet(key: string, data: unknown) {
    this.cache.set(key, { data, at: Date.now() })
  }
  private photos = new Map<string, string>()
  async photosTaken(exceptSiteId?: string) {
    return new Set([...this.photos].filter(([, site]) => site !== exceptSiteId).map(([k]) => k))
  }
  async setSitePhotos(siteId: string, keys: string[]) {
    for (const [k, site] of this.photos) if (site === siteId && !keys.includes(k)) this.photos.delete(k)
    for (const k of keys) if (!this.photos.has(k)) this.photos.set(k, siteId)
  }
  private scores = new Map<string, { day: string; score: number }[]>()
  private crm = new Map<string, unknown>()
  async crmState(siteId: string) {
    return this.crm.get(siteId) ?? null
  }
  async saveCrmState(siteId: string, state: unknown) {
    this.crm.set(siteId, JSON.parse(JSON.stringify(state)))
  }
  async allSites() {
    return [...this.sites.values()].map((s) => s.site)
  }
  async siteById(siteId: string) {
    return this.sites.get(siteId)?.site ?? null
  }
  private members: { siteId: string; userId: string; addedAt: string }[] = []
  private invites = new Map<string, Invite>()
  async addMember(siteId: string, userId: string) {
    if (!(await this.isMember(siteId, userId))) this.members.push({ siteId, userId, addedAt: new Date().toISOString() })
  }
  async removeMember(siteId: string, userId: string) {
    this.members = this.members.filter((m) => !(m.siteId === siteId && m.userId === userId))
  }
  async membersForSite(siteId: string) {
    return this.members.filter((m) => m.siteId === siteId).flatMap((m) => {
      const u = this.users.get(m.userId)
      return u ? [{ userId: u.id, email: u.email, name: u.name, addedAt: m.addedAt }] : []
    })
  }
  async memberSites(userId: string) {
    return this.members.filter((m) => m.userId === userId).flatMap((m) => {
      const s = this.sites.get(m.siteId)
      return s ? [s.site] : []
    })
  }
  async isMember(siteId: string, userId: string) {
    return this.members.some((m) => m.siteId === siteId && m.userId === userId)
  }
  async createInvite(siteId: string, email: string, code: string) {
    this.invites.set(code, { code, siteId, email, createdAt: new Date().toISOString() })
  }
  async invite(code: string) {
    return this.invites.get(code) ?? null
  }
  async deleteInvite(code: string) {
    this.invites.delete(code)
  }
  async invitesForSite(siteId: string) {
    return [...this.invites.values()].filter((i) => i.siteId === siteId)
  }
  async crmSites() {
    return [...this.crm].flatMap(([id, state]) => {
      const s = this.sites.get(id)
      return s ? [{ site: s.site, state }] : []
    })
  }
  private seo = new Map<string, unknown>()
  async seoState(siteId: string) {
    return this.seo.get(siteId) ?? null
  }
  async saveSeoState(siteId: string, state: unknown) {
    this.seo.set(siteId, JSON.parse(JSON.stringify(state)))
  }
  async recordScore(siteId: string, day: string, score: number) {
    const list = (this.scores.get(siteId) ?? []).filter((s) => s.day !== day)
    this.scores.set(siteId, [...list, { day, score }])
  }
  async leagueSites(day: string) {
    const out: LeagueSite[] = []
    for (const [siteId, list] of this.scores) {
      const site = this.sites.get(siteId)?.site
      const scores = list.filter((s) => s.day >= day)
      if (!site || !scores.length) continue
      const perDay = new Map<string, number>()
      for (const v of this.visits.values()) if (v.siteId === siteId && v.day >= day && v.path !== '#call') perDay.set(v.day, (perDay.get(v.day) ?? 0) + v.views)
      out.push({ site, scores: [...scores], visits: [...perDay].map(([d, views]) => ({ day: d, views })) })
    }
    return out
  }
}

// ---------------------------------------------------------------------------

const g = globalThis as unknown as { __saysitesStore?: Store }

export function getStore(): Store {
  if (!g.__saysitesStore) {
    const url = process.env.DATABASE_URL
    g.__saysitesStore = url ? new PgStore(new Pool({ connectionString: pgUrl(url), max: 3 })) : new MemoryStore()
  }
  return g.__saysitesStore
}

// pg already treats sslmode=require (and prefer, verify-ca) as verify-full,
// and warns about it on every cold start. Saying verify-full keeps exactly
// the same security and quiets the warning.
export function pgUrl(url: string): string {
  return url.replace(/([?&]sslmode=)(require|prefer|verify-ca)\b/, '$1verify-full')
}

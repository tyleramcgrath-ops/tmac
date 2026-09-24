// Persistence for SaySites: accounts, sites, pages, revisions and redirects.
//
// Postgres when DATABASE_URL is set (production). Without it, an in-memory
// store keeps local development and the test deployment usable; the dashboard
// shows a "test mode" notice because that data does not survive a restart.
// Every site and page is validated against the schema on the way in and out.

import { randomUUID } from 'crypto'
import { Pool } from 'pg'
import { SHOWCASE } from './showcase'
import { PageSchema, SiteSchema, type Page, type Redirect, type Site } from './schema'
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
  pagesForSite(siteId: string): Promise<Page[]>
  savePage(page: Page, author: RevisionAuthor, userId: string | null, note?: string): Promise<void>
  redirectsForSite(siteId: string): Promise<Redirect[]>
  sofieState(siteId: string): Promise<SofieState>
  saveSofieState(siteId: string, state: SofieState): Promise<void>
  // Removes a site and everything under it (pages, revisions, Sofie, messages).
  deleteSite(ownerId: string, siteId: string): Promise<void>
  // Removes the user and all of their sites.
  deleteUser(userId: string): Promise<void>
  updateUser(userId: string, changes: { name?: string; passwordHash?: string }): Promise<void>
  addMedia(m: Omit<Media, 'id' | 'createdAt' | 'bytes'>, data: Buffer): Promise<Media>
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
  // One page view on a live site. `day` is YYYY-MM-DD (UTC).
  recordVisit(siteId: string, day: string, path: string): Promise<void>
  // Page views per day and page since a day (inclusive).
  visitsSince(siteId: string, day: string): Promise<Visit[]>
}

// Page views are counted per day and page, and nothing else: no cookies,
// no addresses, nothing that identifies a visitor.
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
  }
  async sofieState(siteId: string) {
    const r = (await this.q<{ data: SofieState }>('SELECT data FROM ss_sofie WHERE site_id = $1', [siteId]))[0]
    return r ? r.data : emptySofieState()
  }
  async saveSofieState(siteId: string, state: SofieState) {
    await this.q('INSERT INTO ss_sofie (site_id, data) VALUES ($1,$2) ON CONFLICT (site_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()', [siteId, state])
  }
  async addMedia(m: Omit<Media, 'id' | 'createdAt' | 'bytes'>, data: Buffer) {
    const id = randomUUID().replace(/-/g, '')
    await this.q('INSERT INTO ss_media (id, site_id, mime, width, height, alt, data) VALUES ($1,$2,$3,$4,$5,$6,$7)', [id, m.siteId, m.mime, m.width, m.height, m.alt, data])
    return { ...m, id, bytes: data.length, createdAt: new Date().toISOString() }
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
  async deleteSite(ownerId: string, siteId: string) {
    await this.q('DELETE FROM ss_sites WHERE id = $1 AND owner_id = $2', [siteId, ownerId])
  }
  async deleteUser(userId: string) {
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
  async recordVisit(siteId: string, day: string, path: string) {
    await this.q('INSERT INTO ss_visits (site_id, day, path, views) VALUES ($1,$2,$3,1) ON CONFLICT (site_id, day, path) DO UPDATE SET views = ss_visits.views + 1', [siteId, day, path])
  }
  async visitsSince(siteId: string, day: string) {
    const rows = await this.q<{ day: string; path: string; views: number }>(
      "SELECT to_char(day, 'YYYY-MM-DD') AS day, path, views FROM ss_visits WHERE site_id = $1 AND day >= $2 ORDER BY day",
      [siteId, day]
    )
    return rows.map((r) => ({ day: r.day, path: r.path, views: Number(r.views) }))
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
  private sites = new Map<string, { ownerId: string; site: Site }>()
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
    this.sites.set(site.id, { ownerId, site: SiteSchema.parse(site) })
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
  async redirectsForSite() {
    return []
  }
  private sofie = new Map<string, SofieState>()
  async sofieState(siteId: string) {
    return structuredClone(this.sofie.get(siteId) ?? emptySofieState())
  }
  async saveSofieState(siteId: string, state: SofieState) {
    this.sofie.set(siteId, structuredClone(state))
  }
  private media = new Map<string, { meta: Media; data: Buffer }>()
  async addMedia(m: Omit<Media, 'id' | 'createdAt' | 'bytes'>, data: Buffer) {
    const meta: Media = { ...m, id: randomUUID().replace(/-/g, ''), bytes: data.length, createdAt: new Date().toISOString() }
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
  private visits = new Map<string, Visit & { siteId: string }>()
  async recordVisit(siteId: string, day: string, path: string) {
    const key = `${siteId} ${day} ${path}`
    const v = this.visits.get(key)
    if (v) v.views++
    else this.visits.set(key, { siteId, day, path, views: 1 })
  }
  async visitsSince(siteId: string, day: string) {
    return [...this.visits.values()]
      .filter((v) => v.siteId === siteId && v.day >= day)
      .map(({ day, path, views }) => ({ day, path, views }))
      .sort((a, b) => a.day.localeCompare(b.day))
  }
}

// ---------------------------------------------------------------------------

const g = globalThis as unknown as { __saysitesStore?: Store }

export function getStore(): Store {
  if (!g.__saysitesStore) {
    const url = process.env.DATABASE_URL
    g.__saysitesStore = url ? new PgStore(new Pool({ connectionString: url, max: 3 })) : new MemoryStore()
  }
  return g.__saysitesStore
}

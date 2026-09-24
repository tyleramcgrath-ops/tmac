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
}

export interface User {
  id: string
  email: string
  name: string
  passwordHash: string
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

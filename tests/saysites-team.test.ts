import { describe, expect, it } from 'vitest'
import { INTAKE_SETS, answersText, intakeSet, readAnswers, suggestIntake } from '../apps/saysites/lib/intake'
import { renderPage } from '../apps/saysites/lib/render'
import { handleFormPost } from '../apps/saysites/lib/serve'
import { buildStarterSite } from '../apps/saysites/lib/starter'
import { MemoryStore } from '../apps/saysites/lib/store'
import { INVITE_CODE, newInviteCode, siteAccess, stamp, teamFor } from '../apps/saysites/lib/team'
import type { LeadMeta } from '../apps/saysites/lib/leads'

async function setup(intake?: string) {
  const store = new MemoryStore()
  const owner = await store.createUser({ email: 'owner@example.com', name: 'Dana Hale', passwordHash: 'x' })
  const built = buildStarterSite({ name: 'Intake Law', type: 'lawyer', city: 'Rivertown', region: 'OH', services: ['Car accidents'], palette: 'ocean' }, owner.id, 'intake-law')
  const contact = built.pages.find((p) => p.slug === 'contact')!
  const site = intake ? { ...built.site, intake: { [contact.id]: intake } } : built.site
  await store.createSite(owner.id, site, built.pages)
  return { store, owner, site, pages: built.pages, contact }
}

const post = (fields: Record<string, string>) =>
  new Request('https://intake-law.saysites.com/__form', { method: 'POST', body: new URLSearchParams(fields), headers: { referer: 'https://intake-law.saysites.com/contact', 'content-type': 'application/x-www-form-urlencoded' } })

describe('SaySites intake questions', () => {
  it('keeps only answers that fit each question', () => {
    const set = INTAKE_SETS['personal-injury']
    const got = readAnswers(set, (k) => ({ q_what: 'Car accident', q_when: '2026-09-30', q_hurt: 'Made up option', q_insurer: 'yes', q_other_party: 'Acme Trucking' })[k] ?? '')
    expect(got).toEqual([
      ['What happened?', 'Car accident'],
      ['When did it happen?', '2026-09-30'],
      ['Have you spoken with an insurance company?', 'Yes'],
      ['Name of the other person or company involved, if any', 'Acme Trucking'],
    ])
    expect(readAnswers(set, (k) => (k === 'q_when' ? 'yesterday' : k === 'q_insurer' ? 'maybe' : ''))).toEqual([])
    expect(readAnswers(undefined, () => 'x')).toEqual([])
    expect(answersText([['A?', 'b'], ['Employer’s name', 'Acme']])).toBe('A? b\nEmployer’s name: Acme')
  })

  it('suggests a set from the page, never one that does not exist', () => {
    expect(suggestIntake('car-accidents', 'Car accidents')).toBe('personal-injury')
    expect(suggestIntake('estate-planning', 'Wills')).toBe('estate-planning')
    expect(suggestIntake('about', 'About us')).toBeUndefined()
    for (const s of ['injury', 'divorce', 'dui', 'patient', 'botox', 'plumbing']) expect(intakeSet(suggestIntake(s, s))).toBeDefined()
  })

  it('adds the questions to that page’s form only, with no script', async () => {
    const { site, pages, contact } = await setup('personal-injury')
    const html = renderPage(site, contact, pages).html
    expect(html).toContain('name="q_what"')
    expect(html).toContain('<select')
    expect(html).toContain('type="date"')
    expect(html).not.toContain('<script src')
    const home = pages.find((p) => p.slug === '')!
    expect(renderPage(site, home, pages).html).not.toContain('name="q_what"')
    expect(renderPage({ ...site, language: 'es' }, contact, pages).html).not.toContain('name="q_what"')
  })

  it('sends the answers along with the lead', async () => {
    const { store, site, pages } = await setup('personal-injury')
    const res = await handleFormPost({ site, pages, redirects: [] }, post({ form: 'contact-form', name: 'Sam', email: 's@example.com', message: 'I was rear-ended', q_what: 'Car accident', q_when: '2026-09-30', q_insurer: 'no', q_hurt: 'bogus' }), { preview: false }, store)
    expect(res.status).toBe(303)
    const [m] = await store.messagesForSite(site.id)
    expect(m.body).toContain('I was rear-ended')
    expect(m.body).toContain('What happened? Car accident')
    expect(m.body).toContain('Have you spoken with an insurance company? No')
    expect(m.body).not.toContain('bogus')
  })
})

describe('SaySites staff logins', () => {
  it('gives owners and invited staff their own access, and no one else', async () => {
    const { store, owner, site } = await setup()
    const staff = await store.createUser({ email: 'staff@example.com', name: 'Riley Park', passwordHash: 'x' })
    const stranger = await store.createUser({ email: 'x@example.com', name: 'X', passwordHash: 'x' })
    expect((await siteAccess(store, owner.id, site.id))?.role).toBe('owner')
    expect(await siteAccess(store, staff.id, site.id)).toBeNull()
    await store.addMember(site.id, staff.id)
    await store.addMember(site.id, staff.id)
    expect((await siteAccess(store, staff.id, site.id))?.role).toBe('staff')
    expect(await siteAccess(store, stranger.id, site.id)).toBeNull()
    // Staff still can't reach the site as an owner would.
    expect(await store.siteForUser(staff.id, site.id)).toBeNull()
    expect((await teamFor(store, site)).map((p) => [p.name, p.role])).toEqual([['Dana Hale', 'owner'], ['Riley Park', 'staff']])
    expect((await store.memberSites(staff.id)).map((s) => s.id)).toEqual([site.id])
    await store.removeMember(site.id, staff.id)
    expect(await siteAccess(store, staff.id, site.id)).toBeNull()
  })

  it('keeps invites per site, one code each', async () => {
    const { store, site } = await setup()
    const code = newInviteCode()
    expect(code).toMatch(INVITE_CODE)
    await store.createInvite(site.id, 'staff@example.com', code)
    expect(await store.invite(code)).toMatchObject({ siteId: site.id, email: 'staff@example.com' })
    expect(await store.invitesForSite(site.id)).toHaveLength(1)
    expect(await store.invitesForSite('other')).toHaveLength(0)
    await store.deleteInvite(code)
    expect(await store.invite(code)).toBeNull()
  })

  it('marks who made each new timeline entry', () => {
    const meta: LeadMeta = { stage: 'new', activity: [{ at: '2026-10-01T10:00:00.000Z', kind: 'note', text: 'old' }] }
    const since = '2026-10-02T00:00:00.000Z'
    meta.activity.push({ at: '2026-10-02T09:00:00.000Z', kind: 'call', text: 'Called them' })
    stamp(meta, 'Riley Park', since)
    expect(meta.activity[0].by).toBeUndefined()
    expect(meta.activity[1].by).toBe('Riley Park')
  })
})

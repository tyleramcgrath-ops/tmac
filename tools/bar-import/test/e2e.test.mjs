// Runs import.mjs end to end against an in-memory stand-in for PocketBase.

import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, test } from 'node:test'
import { promisify } from 'node:util'
import ExcelJS from 'exceljs'

const run = promisify(execFile)
const CLI = new URL('../import.mjs', import.meta.url).pathname

// --- a tiny PocketBase: auth, collections, filtered/paged records -----------
function evaluate(filter, rec) {
  if (!filter) return true
  const tokens = filter.match(/'(?:\\'|[^'])*'|&&|\|\||[()]|!?[=~]|[\w.]+/g)
  let i = 0
  const value = (t) => (t.startsWith("'") ? t.slice(1, -1).replace(/\\'/g, "'") : t === 'true' ? true : t === 'false' ? false : t)
  const primary = () => {
    if (tokens[i] === '(') { i++; const v = or(); i++; return v }
    const field = tokens[i++], op = tokens[i++], v = value(tokens[i++])
    const cur = rec[field] ?? ''
    if (op === '=') return cur === v
    if (op === '~') return String(v).includes('%') ? new RegExp(`^${String(v).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*')}$`).test(cur) : String(cur).includes(v)
    throw new Error(`op ${op}`)
  }
  const and = () => { let v = primary(); while (tokens[i] === '&&') { i++; const r = primary(); v = v && r } return v }
  const or = () => { let v = and(); while (tokens[i] === '||') { i++; const r = and(); v = v || r } return v }
  return or()
}

const db = { attorneys: [], practice_areas: [] }
let fields = ['name', 'slug', 'firm_name', 'address', 'city', 'state_code', 'zip_code', 'phone', 'email', 'bar_number', 'bar_admissions', 'years_experience', 'practice_areas', 'bio', 'is_claimed', 'featured', 'tier', 'tier_priority', 'rating', 'reviews_count'].map((name) => ({ name }))
let nextId = 1
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x')
  const body = await new Promise((r) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => r(b ? JSON.parse(b) : null)) })
  const send = (status, data) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(data)) }
  const authed = req.headers.authorization === 'T0KEN'
  let m
  if (url.pathname === '/api/collections/_superusers/auth-with-password') return body.identity === 'admin@x.com' && body.password === 'pw' ? send(200, { token: 'T0KEN' }) : send(400, { message: 'Failed to authenticate.' })
  if ((m = url.pathname.match(/^\/api\/collections\/(\w+)$/))) {
    if (!authed) return send(403, { message: 'Only superusers can perform this action.' })
    if (req.method === 'PATCH') fields = body.fields
    return send(200, { id: 'pbc_' + m[1], name: m[1], fields })
  }
  if ((m = url.pathname.match(/^\/api\/collections\/(\w+)\/records(?:\/(\w+))?$/))) {
    const rows = db[m[1]]
    if (req.method === 'GET') {
      const perPage = Number(url.searchParams.get('perPage')), page = Number(url.searchParams.get('page') || 1)
      const hit = rows.filter((r) => evaluate(url.searchParams.get('filter'), r)).sort((a, b) => a.id.localeCompare(b.id))
      const pick = url.searchParams.get('fields')?.split(',')
      const items = hit.slice((page - 1) * perPage, page * perPage).map((r) => (pick ? Object.fromEntries(pick.map((f) => [f, r[f]])) : r))
      return send(200, { items, page, perPage })
    }
    if (!authed) return send(403, { message: 'Only superusers can perform this action.' })
    if (req.method === 'POST') {
      if (rows.some((r) => r.slug === body.slug)) return send(400, { message: 'Failed to create record.', data: { slug: { code: 'validation_not_unique' } } })
      const rec = { id: `r${String(nextId++).padStart(5, '0')}`, ...body }
      rows.push(rec)
      return send(200, rec)
    }
    const rec = rows.find((r) => r.id === m[2])
    if (req.method === 'PATCH') return send(200, Object.assign(rec, body))
    if (req.method === 'DELETE') { rows.splice(rows.indexOf(rec), 1); res.writeHead(204); return res.end() }
  }
  send(404, { message: 'Not found' })
})

let api, dir
before(async () => {
  await new Promise((r) => server.listen(0, r))
  api = `http://127.0.0.1:${server.address().port}`
  dir = await mkdtemp(join(tmpdir(), 'bar-import-'))
  db.practice_areas.push({ id: 'pa_family', slug: 'family-law' }, { id: 'pa_crim', slug: 'criminal-defense' })
  db.attorneys.push(
    { id: 'r00001', slug: 'jane-m-doe-miami', name: 'Jane M. Doe', city: 'Miami', phone: '(305) 555-1234', bar_number: '', is_claimed: false, address: '' },
    { id: 'r00002', slug: 'sam-lee-tampa', name: 'Sam Lee', city: 'Tampa', phone: '(813) 222-3333', bar_number: 'FL-222', is_claimed: true, address: '9 Bay St', bio: 'Written by Sam' },
    { id: 'r00003', slug: 'ai-firm-miami', name: 'Some Firm Miami Attorneys', city: 'Miami', phone: '', bar_number: '', is_claimed: false, address: '' },
  )
  nextId = 4

  // The member file, shaped like the Bar's Excel export (with a title line).
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Members')
  ws.addRow(['The Florida Bar - Membership Data'])
  ws.addRow(['Bar Number', 'Name', 'Firm', 'Address', 'Address 2', 'City', 'State', 'Zip', 'Phone', 'Fax', 'Email', 'County Code', 'Circuit Code'])
  ws.addRow(['0000111', 'DOE, JANE M', 'DOE FAMILY LAW, P.A.', '100 BISCAYNE BLVD', 'STE 200', 'MIAMI', 'FL', '33132-1111', '3055550100', '', 'JANE@DOELAW.COM', '13', '11'])
  ws.addRow(['222', 'LEE, SAM', 'LEE LAW', '1 NEW ST', '', 'TAMPA', 'FL', '33602', '8135550000', '', '', '29', '13'])
  ws.addRow(['333', 'PUBLIC, PAT', 'OFFICE OF THE PUBLIC DEFENDER', '1 COURT ST', '', 'ORLANDO', 'FL', '32801', '4075550000', '', '', '48', '9'])
  ws.addRow(['444', 'AWAY, AL', 'AWAY LLP', '5 PEACHTREE', '', 'ATLANTA', 'GA', '30303', '4045550000', '', '', '', ''])
  ws.addRow(['555', 'ROE, RICHARD T JR', '', '77 ORANGE AVE', '', 'ORLANDO', 'FL', '32801', '407.555.0177', '', '', '48', '9'])
  await wb.xlsx.writeFile(join(dir, 'members.xlsx'))
  await writeFile(join(dir, 'certs.csv'), 'Bar Number,Board Certification\n111,FL\n555,CR\n555,CT\n')
})
after(() => server.close())

const cli = (args, env = {}) => run('node', [CLI, ...args, '--api', api, '--out', dir], { env: { ...process.env, PB_ADMIN_EMAIL: 'admin@x.com', PB_ADMIN_PASSWORD: 'pw', ...env } })
// Newest report folder for a command; `applied` picks real runs over dry runs
// (both can start within the same second).
const latest = async (prefix, applied = false) => join(dir, (await readdir(dir)).filter((d) => d.startsWith(prefix) && (!applied || !d.endsWith('-dry-run'))).sort().at(-1))

test('dry run reports the plan and writes nothing', async () => {
  await cli(['florida', join(dir, 'members.xlsx'), '--certifications', join(dir, 'certs.csv'), '--as-of', '2026-10-01'], { PB_ADMIN_EMAIL: '' })
  const s = JSON.parse(await readFile(join(await latest('florida'), 'summary.json'), 'utf8'))
  assert.equal(s.rowsRead, 5)
  assert.equal(s.create, 2)
  assert.equal(s.claimedLeftAlone, 1)
  assert.deepEqual(s.skipped, { 'government, court or institution': 1, 'office outside Florida': 1 })
  assert.equal(db.attorneys.length, 3)
})

test('apply creates sourced profiles, leaves the claimed one alone', async () => {
  await cli(['florida', join(dir, 'members.xlsx'), '--certifications', join(dir, 'certs.csv'), '--as-of', '2026-10-01', '--add-source-fields', '--apply'])
  const jane = db.attorneys.find((r) => r.bar_number === 'FL-111')
  assert.equal(jane.slug, 'jane-m-doe-miami-111') // the placeholder holds the plain slug
  assert.equal(jane.name, 'Jane M. Doe')
  assert.equal(jane.firm_name, 'Doe Family Law, P.A.')
  assert.equal(jane.address, '100 Biscayne Blvd, Ste 200')
  assert.equal(jane.zip_code, '33132')
  assert.deepEqual(jane.practice_areas, ['pa_family'])
  assert.equal(jane.source, 'The Florida Bar membership records')
  assert.equal(jane.email, undefined)
  const richard = db.attorneys.find((r) => r.bar_number === 'FL-555')
  assert.equal(richard.name, 'Richard T. Roe, Jr.')
  assert.equal(richard.phone, '(407) 555-0177')
  assert.deepEqual(richard.practice_areas, ['pa_crim'])
  assert.match(richard.bar_admissions, /Board Certified: Criminal Trial, Civil Trial/)
  assert.equal(db.attorneys.find((r) => r.id === 'r00002').bio, 'Written by Sam')
})

test('re-running the same file changes nothing', async () => {
  const before = db.attorneys.length
  await cli(['florida', join(dir, 'members.xlsx'), '--certifications', join(dir, 'certs.csv'), '--as-of', '2026-10-01', '--apply'])
  const s = JSON.parse(await readFile(join(await latest('florida'), 'summary.json'), 'utf8'))
  assert.equal(s.create, 0)
  assert.equal(s.update, 0)
  assert.equal(s.unchanged, 2)
  assert.equal(db.attorneys.length, before)
})

test('purge removes only placeholders, after saving a backup', async () => {
  await cli(['purge-placeholders'])
  assert.equal(db.attorneys.length, 5)
  await cli(['purge-placeholders', '--also-empty-contact', '--apply'])
  const backup = JSON.parse(await readFile(join(await latest('purge-placeholders', true), 'backup.json'), 'utf8'))
  assert.deepEqual(backup.map((r) => r.id).sort(), ['r00001', 'r00003'])
  assert.deepEqual(db.attorneys.map((r) => r.bar_number).sort(), ['FL-111', 'FL-222', 'FL-555'])
})

test('apply without credentials stops before writing', async () => {
  const err = await cli(['florida', join(dir, 'members.xlsx'), '--apply'], { PB_ADMIN_PASSWORD: '' }).catch((e) => e)
  assert.match(err.stderr, /PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD/)
})

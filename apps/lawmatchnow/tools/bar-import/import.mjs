#!/usr/bin/env node
// LawMatchNow state bar importer. See README.md.
//
//   node import.mjs florida <members.xlsx|csv> [options]
//   node import.mjs purge-placeholders [options]
//
// Nothing is written without --apply; every run saves a report folder.

import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import * as florida from './lib/florida.mjs'
import { buildPlan } from './lib/plan.mjs'
import { PocketBase } from './lib/pocketbase.mjs'
import { readTable } from './lib/read.mjs'

const HELP = `Usage:
  node import.mjs florida <members.xlsx|.csv> [options]
  node import.mjs purge-placeholders [options]

Options (florida):
  --certifications <file>  Board certification list from The Florida Bar (adds practice areas)
  --as-of <YYYY-MM-DD>     Date the Bar produced the file (default: today)
  --limit <n>              Only take the first n members (for a test batch)
  --include-out-of-state   Also list members whose office is outside Florida
  --keep-not-for-hire      Keep government, court and university lawyers
  --with-email             Store member emails (only if the email field is hidden in PocketBase)
  --add-source-fields      Add "source" and "source_date" fields to the attorneys collection

Options (purge-placeholders):
  --also-empty-contact     Also remove unclaimed records with no phone, no address and no bar number

Common:
  --apply                  Write to the database (otherwise a dry run)
  --api <url>              PocketBase URL (default: $LMN_API_URL)
  --concurrency <n>        Parallel writes (default 6)
  --out <dir>              Report folder (default: ./reports)

Credentials for --apply come from PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD.`

const { values: opt, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    apply: { type: 'boolean' },
    api: { type: 'string' },
    certifications: { type: 'string' },
    'as-of': { type: 'string' },
    limit: { type: 'string' },
    'include-out-of-state': { type: 'boolean' },
    'keep-not-for-hire': { type: 'boolean' },
    'with-email': { type: 'boolean' },
    'add-source-fields': { type: 'boolean' },
    'also-empty-contact': { type: 'boolean' },
    concurrency: { type: 'string' },
    out: { type: 'string' },
    help: { type: 'boolean', short: 'h' },
  },
})

const log = (...a) => console.error(...a)
const [command, file] = positionals
if (opt.help || !command) {
  console.log(HELP)
  process.exit(command ? 0 : 1)
}

const API = opt.api || process.env.LMN_API_URL
if (!API) throw new Error('Set LMN_API_URL (or pass --api) to the PocketBase URL, e.g. https://vc953650138104.coderick.net')
const pb = new PocketBase(API, { concurrency: Number(opt.concurrency) || 6 })
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const outDir = join(opt.out || 'reports', `${command}-${stamp}${opt.apply ? '' : '-dry-run'}`)
await mkdir(outDir, { recursive: true })
const save = (name, data) => writeFile(join(outDir, name), typeof data === 'string' ? data : JSON.stringify(data, null, 2))
const csv = (rows, cols) => [cols.join(','), ...rows.map((r) => cols.map((c) => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n') + '\n'

async function login() {
  const email = process.env.PB_ADMIN_EMAIL, password = process.env.PB_ADMIN_PASSWORD
  if (!email || !password) throw new Error('--apply needs PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD (a PocketBase superuser) in the environment')
  await pb.login(email, password)
  log('Signed in to PocketBase.')
}

const progress = (label) => (done, total) => {
  if (done % 500 === 0 || done === total) log(`  ${label}: ${done.toLocaleString()} / ${total.toLocaleString()}`)
}

async function importState(adapter) {
  if (!file) throw new Error(`Usage: node import.mjs ${command} <members.xlsx|.csv>`)
  const asOf = opt['as-of'] ? new Date(`${opt['as-of']}T00:00:00Z`) : new Date()
  if (Number.isNaN(asOf.getTime())) throw new Error('--as-of must be YYYY-MM-DD')

  // 1. Read and map the Bar's file.
  const { headers, rows } = await readTable(file)
  const { map, unplaced } = adapter.mapColumns(headers)
  log(`Read ${rows.length.toLocaleString()} rows from ${file}`)
  log('Columns:', Object.entries(map).map(([f, k]) => `${f}<-${headers.find((h) => h.toLowerCase().replace(/[^a-z0-9]/g, '') === k)}`).join(', '))
  if (unplaced.length) log('Not used:', unplaced.join(', '))
  if (!map.barNumber || !(map.name || map.last)) throw new Error('Could not find the bar number and name columns; see "Columns" above')

  let certs = null
  if (opt.certifications) {
    const t = await readTable(opt.certifications)
    certs = adapter.certificationIndex(t.rows, t.headers)
    log(`Board certifications for ${certs.size.toLocaleString()} members from ${opt.certifications}`)
  }

  // 2. Turn rows into members.
  const skipped = [], members = []
  for (const row of rows) {
    const r = adapter.toMember(row, map, { includeOutOfState: opt['include-out-of-state'], keepNotForHire: opt['keep-not-for-hire'], now: asOf })
    if (r.skip) { skipped.push({ reason: r.skip, barNumber: r.barNumber ?? '' }); continue }
    if (certs?.has(r.member.barNumber)) r.member.certifications = [...new Set([...r.member.certifications, ...certs.get(r.member.barNumber)])]
    members.push(r.member)
  }
  const take = opt.limit ? members.slice(0, Number(opt.limit)) : members

  // 3. Read what's already in the directory (public API is enough for a dry run).
  if (opt.apply) await login()
  let fields
  try {
    fields = await pb.fieldNames('attorneys')
  } catch {
    // Without superuser access, infer fields from a record.
    const [sample] = await pb.request('GET', '/api/collections/attorneys/records?page=1&perPage=1&skipTotal=1').then((r) => r.items)
    fields = new Set(Object.keys(sample ?? {}))
  }
  if (!fields.has('bar_number')) throw new Error('The attorneys collection has no bar_number field; add a text field named bar_number in PocketBase first')

  if (opt['with-email']) {
    const col = await pb.collection('attorneys').catch(() => null)
    const emailField = (col?.fields ?? []).find((f) => f.name === 'email')
    if (!emailField?.hidden) throw new Error('--with-email needs the attorneys "email" field set to Hidden in PocketBase (so the public API never returns it), and --apply credentials to confirm it')
  }

  if (opt['add-source-fields'] && opt.apply) {
    const col = await pb.collection('attorneys')
    const add = [['source', 'text'], ['source_date', 'date']].filter(([n]) => !fields.has(n))
    if (add.length) {
      if (col.fields) await pb.request('PATCH', `/api/collections/${col.id}`, { fields: [...col.fields, ...add.map(([name, type]) => ({ name, type }))] })
      else await pb.request('PATCH', `/api/collections/${col.id}`, { schema: [...col.schema, ...add.map(([name, type]) => ({ name, type, options: {} }))] })
      add.forEach(([n]) => fields.add(n))
      log(`Added fields: ${add.map(([n]) => n).join(', ')}`)
    }
  }

  log('Loading existing profiles...')
  const prefix = `${adapter.STATE.code}-`
  const existing = new Map()
  const want = ['id', 'slug', 'is_claimed', 'name', 'firm_name', 'address', 'city', 'state_code', 'zip_code', 'phone', 'bar_number', 'bar_admissions', 'years_experience', 'practice_areas', 'bio', 'email', 'source'].filter((f) => fields.has(f))
  for await (const r of pb.list('attorneys', { filter: `bar_number ~ '${prefix}%'`, fields: want.join(',') })) existing.set(r.bar_number, r)
  const slugs = new Set()
  for await (const r of pb.list('attorneys', { fields: 'slug' })) slugs.add(r.slug)
  const practiceIds = new Map()
  for await (const r of pb.list('practice_areas', { fields: 'id,slug' })) practiceIds.set(r.slug, r.id)
  log(`  ${slugs.size.toLocaleString()} profiles in the directory, ${existing.size.toLocaleString()} already imported from ${adapter.STATE.bar}`)

  // 4. Plan.
  const ctx = { state: adapter.STATE, certifications: adapter.CERTIFICATIONS, practiceIds, fields, asOf, withEmail: !!opt['with-email'] }
  const plan = buildPlan(take, existing, slugs, ctx)
  const reasons = Object.entries(skipped.reduce((a, s) => ((a[s.reason] = (a[s.reason] ?? 0) + 1), a), {})).sort((a, b) => b[1] - a[1])
  const byCity = Object.entries(plan.creates.reduce((a, c) => ((a[c.city] = (a[c.city] ?? 0) + 1), a), {})).sort((a, b) => b[1] - a[1]).slice(0, 25)
  const summary = {
    file, asOf: asOf.toISOString().slice(0, 10), mode: opt.apply ? 'apply' : 'dry run',
    rowsRead: rows.length, usable: members.length, taken: take.length,
    skipped: Object.fromEntries(reasons),
    create: plan.creates.length, update: plan.updates.length, unchanged: plan.unchanged.length,
    claimedLeftAlone: plan.claimed.length, duplicateRowsInFile: plan.duplicates.length,
    previouslyImportedNotInFile: plan.missing.length,
    withPracticeArea: plan.creates.filter((c) => c.practice_areas.length).length,
    topCities: Object.fromEntries(byCity),
  }
  await save('summary.json', summary)
  await save('preview-new.json', plan.creates.slice(0, 50))
  await save('preview-updates.json', plan.updates.slice(0, 50))
  await save('skipped.csv', csv(skipped, ['barNumber', 'reason']))
  await save('not-in-file.csv', csv(plan.missing, ['key', 'name', 'city', 'slug', 'id']))
  log('\n' + JSON.stringify(summary, null, 2))

  if (!opt.apply) {
    log(`\nDry run only. Review ${outDir}/ then re-run with --apply.`)
    return
  }

  // 5. Write.
  log(`\nCreating ${plan.creates.length.toLocaleString()} profiles...`)
  const createFail = await pb.each(plan.creates, (rec) => pb.create('attorneys', rec), progress('created'))
  log(`Updating ${plan.updates.length.toLocaleString()} profiles...`)
  const updateFail = await pb.each(plan.updates, (u) => pb.update('attorneys', u.id, u.data), progress('updated'))
  await save('failures.json', { create: createFail.map((f) => ({ slug: f.item.slug, bar: f.item.bar_number, error: f.error })), update: updateFail.map((f) => ({ id: f.item.id, error: f.error })) })
  log(`\nDone: ${plan.creates.length - createFail.length} created, ${plan.updates.length - updateFail.length} updated, ${createFail.length + updateFail.length} failed (see ${outDir}/failures.json).`)
  if (createFail.length + updateFail.length) process.exitCode = 2
}

async function purgePlaceholders() {
  // Records the old site generated: no bar number, never claimed, and a
  // made-up 555 phone (or, with --also-empty-contact, no phone or address).
  const filters = ["bar_number = '' && is_claimed = false && phone ~ '555-'"]
  if (opt['also-empty-contact']) filters.push("bar_number = '' && is_claimed = false && phone = '' && address = ''")
  const filter = filters.map((f) => `(${f})`).join(' || ')
  if (opt.apply) await login()
  log('Finding placeholder records...')
  const found = []
  for await (const r of pb.list('attorneys', { filter })) found.push(r)
  const sample = found.slice(0, 15).map((r) => `${r.name} | ${r.firm_name} | ${r.city}, ${r.state_code} | ${r.phone || '(no phone)'}`)
  log(`Matched ${found.length.toLocaleString()} records, for example:\n  ${sample.join('\n  ')}`)
  await save('summary.json', { mode: opt.apply ? 'apply' : 'dry run', filter, matched: found.length })
  // Full copies first, so anything removed can be restored.
  await save('backup.json', found)
  if (!opt.apply) {
    log(`\nDry run only. A full copy of the matched records is in ${outDir}/backup.json. Re-run with --apply to delete them.`)
    return
  }
  log(`Deleting ${found.length.toLocaleString()} records (backup saved to ${outDir}/backup.json)...`)
  const fail = await pb.each(found, (r) => pb.remove('attorneys', r.id), progress('deleted'))
  await save('failures.json', fail.map((f) => ({ id: f.item.id, error: f.error })))
  log(`Done: ${found.length - fail.length} deleted, ${fail.length} failed.`)
  if (fail.length) process.exitCode = 2
}

const commands = { florida: () => importState(florida), 'purge-placeholders': purgePlaceholders }
if (!commands[command]) {
  console.log(HELP)
  process.exit(1)
}
try {
  await commands[command]()
} catch (err) {
  log(`\nError: ${err.message}`)
  process.exit(1)
}

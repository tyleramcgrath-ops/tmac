import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CERTIFICATIONS, STATE, certCodes, mapColumns, toMember } from '../lib/florida.mjs'
import { formatPhone, personName, slugify, smartCase } from '../lib/normalize.mjs'
import { buildPlan } from '../lib/plan.mjs'
import { headerKey, parseCsv } from '../lib/read.mjs'

test('names: "LAST, FIRST MIDDLE SUFFIX" and separate parts', () => {
  assert.equal(personName({ full: 'SMITH, JOHN ALLEN JR.' }), 'John A. Smith, Jr.')
  assert.equal(personName({ full: "O'NEIL-MCDONALD, MARY" }), "Mary O'Neil-McDonald")
  assert.equal(personName({ first: 'MARÍA', middle: 'J', last: 'DE LA CRUZ', suffix: 'III' }), 'María J. de la Cruz III')
  assert.equal(personName({ full: 'Jane van Buren' }), 'Jane van Buren') // already mixed case: untouched
  assert.equal(personName({ first: 'ROBERT', last: 'KING', suffix: 'ESQ.' }), 'Robert King')
})

test('firms and addresses keep legal abbreviations', () => {
  assert.equal(smartCase('SMITH & JONES, P.A.'), 'Smith & Jones, P.A.')
  assert.equal(smartCase('LAW OFFICE OF THE GULF COAST PLLC'), 'Law Office of the Gulf Coast PLLC')
  assert.equal(smartCase('1200 NW 21ST AVE STE 300'), '1200 NW 21st Ave Ste 300')
})

test('phones', () => {
  assert.equal(formatPhone('3055550123'), '(305) 555-0123')
  assert.equal(formatPhone('1-813.555.0199 x204'), '(813) 555-0199 ext. 204')
  assert.equal(formatPhone(''), '')
  assert.equal(formatPhone('+44 20 7946 0000'), '+44 20 7946 0000')
})

test('slugs', () => {
  assert.equal(slugify('María J. de la Cruz III Miami'), 'maria-j-de-la-cruz-iii-miami')
})

test('csv parser handles quotes and CRLF', () => {
  assert.deepEqual(parseCsv('a,b\r\n"x, y","he said ""hi"""\r\n'), [['a', 'b'], ['x, y', 'he said "hi"']])
})

test('certifications from codes or names', () => {
  assert.deepEqual(certCodes('CT; FL'), ['CT', 'FL'])
  assert.deepEqual(certCodes('Marital & Family Law, Wills, Trusts and Estates'), ['FL'])
  assert.deepEqual(certCodes('Immigration and Nationality / Tax'), ['IM'])
})

const HEADERS = ['Bar Number', 'Name', 'Firm', 'Address', 'Address 2', 'City', 'State', 'Zip', 'Phone', 'Fax', 'Email', 'County Code', 'Circuit Code', 'Mystery']
const { map } = mapColumns(HEADERS)
const row = (o) => Object.fromEntries(HEADERS.map((h) => [headerKey(h), o[h] ?? '']))

test('column mapping reports unknown columns but ignores fax', () => {
  const r = mapColumns(HEADERS)
  assert.equal(r.map.barNumber, 'barnumber')
  assert.equal(r.map.county, 'countycode')
  assert.deepEqual(r.unplaced, ['Mystery'])
})

test('member rows: kept and skipped', () => {
  const base = { 'Bar Number': '0012345', Name: 'DOE, JANE', Firm: 'DOE LAW, P.A.', Address: '100 MAIN ST', City: 'MIAMI', State: 'FL', Zip: '33130-1234', Phone: '3055550100' }
  const { member } = toMember(row(base), map)
  assert.equal(member.barNumber, '12345')
  assert.equal(member.name, 'Jane Doe')
  assert.equal(member.city, 'Miami')
  assert.equal(member.zip, '33130')
  assert.equal(toMember(row({ ...base, State: 'GA' }), map).skip, 'office outside Florida')
  assert.ok(toMember(row({ ...base, State: 'GA' }), map, { includeOutOfState: true }).member)
  assert.equal(toMember(row({ ...base, Firm: 'OFFICE OF THE STATE ATTORNEY' }), map).skip, 'government, court or institution')
  assert.equal(toMember(row({ ...base, Firm: '', Phone: '' }), map).skip, 'no phone or firm')
  assert.equal(toMember(row({ ...base, 'Bar Number': '' }), map).skip, 'no bar number')
})

const ctx = (extra = {}) => ({ state: STATE, certifications: CERTIFICATIONS, practiceIds: new Map([['family-law', 'pa_family']]), fields: new Set(['bar_number']), asOf: new Date('2026-10-01T00:00:00Z'), withEmail: false, ...extra })
const m = (o) => ({ state: 'FL', barNumber: '111', name: 'Jane Doe', firm: 'Doe Law', address: '1 Main St', city: 'Miami', stateCode: 'FL', zip: '33130', phone: '(305) 555-0100', email: 'j@x.com', county: '', admittedYear: 2010, yearsExperience: 16, certifications: [], ...o })

test('plan: new profiles get unique slugs and sourced fields', () => {
  const plan = buildPlan([m({ certifications: ['FL'] }), m({ barNumber: '222' })], new Map(), new Set(['jane-doe-miami']), ctx())
  assert.deepEqual(plan.creates.map((c) => c.slug), ['jane-doe-miami-111', 'jane-doe-miami-222'])
  const [a] = plan.creates
  assert.equal(a.bar_number, 'FL-111')
  assert.deepEqual(a.practice_areas, ['pa_family'])
  assert.match(a.bar_admissions, /Florida \(Bar No\. 111, admitted 2010\); Board Certified: Marital and Family Law/)
  assert.match(a.bio, /public membership records \(October 2026\)/)
  assert.equal(a.is_claimed, false)
  assert.equal('email' in a, false)
})

test('plan: claimed profiles are never touched; changes and missing members reported', () => {
  const c = ctx()
  const first = buildPlan([m({})], new Map(), new Set(), c).creates[0]
  const existing = new Map([
    ['FL-111', { ...first, id: 'r1' }],
    ['FL-222', { id: 'r2', slug: 's2', is_claimed: true }],
    ['FL-333', { id: 'r3', slug: 's3', is_claimed: false, name: 'Gone' }],
  ])
  const plan = buildPlan([m({ phone: '(305) 555-0199' }), m({ barNumber: '222' })], existing, new Set(), c)
  assert.deepEqual(plan.updates, [{ id: 'r1', slug: first.slug, data: { phone: '(305) 555-0199' } }])
  assert.equal(plan.claimed.length, 1)
  assert.deepEqual(plan.missing.map((x) => x.key), ['FL-333'])
  assert.equal(buildPlan([m({})], new Map([['FL-111', { ...first, id: 'r1' }]]), new Set(), c).unchanged.length, 1)
})

// The Florida Bar's membership data file (Public Records Request for Florida
// Bar Membership Data, rev. 6/2026). The Bar sends Excel with bar number,
// name, address, firm, city, state, zip, phone, fax, email, county code and
// circuit code. Column titles aren't published, so each field accepts the
// likely spellings; `node import.mjs florida file.xlsx` reports any columns
// it couldn't place before anything is written.

import { formatPhone, personName, smartCase, zip5 } from './normalize.mjs'

export const STATE = { code: 'FL', name: 'Florida', bar: 'The Florida Bar' }

// field -> accepted header keys (lowercase, alphanumerics only)
export const COLUMNS = {
  barNumber: ['barnumber', 'barno', 'barnum', 'barid', 'attorneynumber', 'attorneyno', 'membernumber', 'memberno', 'memberid', 'bar'],
  name: ['name', 'fullname', 'membername', 'attorneyname', 'lawyername'],
  first: ['firstname', 'first', 'fname', 'givenname'],
  middle: ['middlename', 'middle', 'mname', 'middleinitial', 'mi'],
  last: ['lastname', 'last', 'lname', 'surname', 'familyname'],
  suffix: ['suffix', 'namesuffix'],
  firm: ['firm', 'firmname', 'company', 'companyname', 'employer', 'organization', 'lawfirm'],
  address1: ['address', 'address1', 'addressline1', 'street', 'street1', 'streetaddress', 'mailingaddress', 'add1'],
  address2: ['address2', 'addressline2', 'street2', 'suite', 'add2'],
  address3: ['address3', 'addressline3', 'street3', 'add3'],
  city: ['city', 'mailingcity'],
  state: ['state', 'st', 'statecode', 'mailingstate'],
  zip: ['zip', 'zipcode', 'zip5', 'postalcode', 'postcode', 'mailingzip'],
  phone: ['phone', 'phonenumber', 'businessphone', 'officephone', 'telephone', 'workphone', 'phone1'],
  email: ['email', 'emailaddress', 'eaddress', 'businessemail'],
  county: ['county', 'countycode', 'countyname'],
  circuit: ['circuit', 'circuitcode', 'judicialcircuit'],
  admitted: ['admitted', 'admissiondate', 'admitdate', 'dateadmitted', 'admissionyear', 'admityear', 'yearadmitted', 'admission'],
  status: ['status', 'memberstatus', 'membershipstatus', 'eligibility', 'eligible'],
  certification: ['boardcertification', 'boardcertifications', 'certification', 'certifications', 'certificationarea', 'certarea', 'boardcert', 'specialty'],
}
const IGNORED = new Set(['fax', 'faxnumber', 'fax1', 'businessfax'])

// The Florida Bar's board certification codes, with the directory practice
// areas each one supports. Certifications without a clear match (e.g. Civil
// Trial, which spans many kinds of cases) are shown but don't assign one.
export const CERTIFICATIONS = {
  AD: ['Admiralty and Maritime Law', ['maritime-law']],
  AG: ["State and Federal Government and Administrative Practice", []],
  AL: ['Adoption Law', ['family-law']],
  AP: ['Appellate Practice', ['appellate-law']],
  AT: ['Antitrust and Trade Regulation Law', ['business-law']],
  AV: ['Aviation Law', ['aviation-law']],
  BL: ['Business Litigation', ['business-law']],
  CA: ['Criminal Appellate', ['criminal-defense', 'appellate-law']],
  CC: ['City, County and Local Government Law', []],
  CL: ['Construction Law', ['construction-law']],
  CP: ['Condominium and Planned Development Law', ['real-estate']],
  CR: ['Criminal Trial', ['criminal-defense']],
  CT: ['Civil Trial', []],
  ED: ['Elder Law', ['elder-law']],
  EL: ['Education Law', ['education-law']],
  EP: ['Wills, Trusts and Estates', ['estate-planning']],
  FL: ['Marital and Family Law', ['family-law']],
  HL: ['Health Law', ['health-care-law']],
  IA: ['International Litigation and Arbitration', ['international-law']],
  IL: ['International Law', ['international-law']],
  IM: ['Immigration and Nationality', ['immigration']],
  IP: ['Intellectual Property Law', ['intellectual-property']],
  JL: ['Juvenile Law', []],
  LE: ['Labor and Employment Law', ['employment-law']],
  RE: ['Real Estate', ['real-estate']],
  TX: ['Tax Law', ['tax-law']],
  WC: ["Workers' Compensation", ['workers-compensation']],
}

/** Accepts "CT", "Civil Trial", or several separated by ; , / | and returns codes. */
export function certCodes(value) {
  const norm = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z]/g, '')
  const out = new Set()
  for (const part of String(value ?? '').split(/[;,/|]+/)) {
    const p = part.trim()
    if (!p) continue
    const up = p.toUpperCase()
    if (CERTIFICATIONS[up]) { out.add(up); continue }
    const hit = Object.entries(CERTIFICATIONS).find(([, [name]]) => norm(name) === norm(p) || norm(p).includes(norm(name)))
    if (hit) out.add(hit[0])
  }
  return [...out]
}

// Offices that don't take private clients: listing them as hireable lawyers
// would mislead visitors. Matched against the firm name.
const NOT_FOR_HIRE = /\b(state attorney|public defender|attorney general|department of|dept\.? of|county attorney|city attorney|school board|sheriff|state of florida|city of|county of|town of|village of|district court|circuit court|county court|supreme court|court of appeals?|judicial|judge|united states|u\.s\. attorney|federal public|regional counsel|guardian ad litem|legal aid|legal services|university|college)\b/i

/** Maps the Bar file's headers to fields; returns the mapping and unplaced headers. */
export function mapColumns(headers) {
  const keys = headers.map((h) => [h, String(h).toLowerCase().replace(/[^a-z0-9]/g, '')])
  const map = {}
  for (const [field, aliases] of Object.entries(COLUMNS)) {
    const hit = aliases.map((a) => keys.find(([, k]) => k === a)).find(Boolean)
    if (hit) map[field] = hit[1]
  }
  const used = new Set(Object.values(map))
  const unplaced = keys.filter(([, k]) => !used.has(k) && !IGNORED.has(k)).map(([h]) => h)
  return { map, unplaced }
}

/** Year from "2004", "2004-09-23", "09/23/2004" or an Excel date. */
function admittedYear(v) {
  const y = String(v ?? '').match(/\b(19[4-9]\d|20\d\d)\b/)?.[1]
  return y ? Number(y) : null
}

/**
 * Turns one Bar row into a directory member, or explains why it's skipped.
 * opts: { includeOutOfState, keepNotForHire, now }
 */
export function toMember(row, map, opts = {}) {
  const get = (f) => (map[f] ? String(row[map[f]] ?? '').trim() : '')
  const barNumber = get('barNumber').replace(/\D/g, '').replace(/^0+/, '')
  if (!barNumber) return { skip: 'no bar number' }
  const name = personName({ full: get('name'), first: get('first'), middle: get('middle'), last: get('last'), suffix: get('suffix') })
  if (!name) return { skip: 'no name', barNumber }
  const status = get('status').toLowerCase()
  if (status && /(inelig|inactive|suspend|disbar|resign|retir|deceas|deliquent|delinquent|revok)/.test(status)) return { skip: `status: ${get('status')}`, barNumber }

  const state = get('state').toUpperCase().slice(0, 2) || (opts.assumeInState ? 'FL' : '')
  if (state !== 'FL' && !opts.includeOutOfState) return { skip: 'office outside Florida', barNumber }
  const city = smartCase(get('city'))
  if (!city) return { skip: 'no city', barNumber }

  const firm = smartCase(get('firm'))
  if (firm && NOT_FOR_HIRE.test(firm) && !opts.keepNotForHire) return { skip: 'government, court or institution', barNumber }
  const phone = formatPhone(get('phone'))
  if (!phone && !firm) return { skip: 'no phone or firm', barNumber }

  const year = admittedYear(get('admitted'))
  const now = opts.now ?? new Date()
  return {
    member: {
      state: STATE.code,
      barNumber,
      name,
      firm: firm && firm.toLowerCase() !== name.toLowerCase() ? firm : '',
      address: [get('address1'), get('address2'), get('address3')].map(smartCase).filter(Boolean).join(', '),
      city,
      stateCode: state || 'FL',
      zip: zip5(get('zip')),
      phone,
      email: get('email').toLowerCase(),
      county: smartCase(get('county')),
      admittedYear: year,
      yearsExperience: year ? Math.max(0, now.getFullYear() - year) : null,
      certifications: certCodes(get('certification')),
    },
  }
}

/** Reads the separate board-certification file into barNumber -> codes. */
export function certificationIndex(rows, headers) {
  const { map } = mapColumns(headers)
  if (!map.barNumber || !map.certification) throw new Error('Certification file needs a bar number column and a certification column')
  const idx = new Map()
  for (const r of rows) {
    const bn = String(r[map.barNumber] ?? '').replace(/\D/g, '').replace(/^0+/, '')
    if (!bn) continue
    const set = idx.get(bn) ?? new Set()
    for (const c of certCodes(r[map.certification])) set.add(c)
    idx.set(bn, set)
  }
  return idx
}

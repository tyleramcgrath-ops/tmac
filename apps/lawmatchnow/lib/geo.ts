// States and the city hubs. City slugs match the URLs the old site already
// had indexed (/new-york, /miami/personal-injury, ...), so rankings carry over.

export type State = { code: string; name: string; slug: string }
export type City = { slug: string; name: string; state: string }

const STATE_LIST: [string, string][] = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'],
  ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'], ['DC', 'District of Columbia'],
  ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'], ['IL', 'Illinois'],
  ['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'],
  ['ME', 'Maine'], ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'],
  ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'],
  ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'],
  ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'], ['OR', 'Oregon'],
  ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'], ['SC', 'South Carolina'], ['SD', 'South Dakota'],
  ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginia'],
  ['WA', 'Washington'], ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
]

export const slugify = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-')

export const STATES: State[] = STATE_LIST.map(([code, name]) => ({ code, name, slug: slugify(name) }))

export const CITIES: City[] = [
  ['new-york', 'New York', 'NY'], ['los-angeles', 'Los Angeles', 'CA'], ['chicago', 'Chicago', 'IL'],
  ['houston', 'Houston', 'TX'], ['phoenix', 'Phoenix', 'AZ'], ['philadelphia', 'Philadelphia', 'PA'],
  ['san-antonio', 'San Antonio', 'TX'], ['san-diego', 'San Diego', 'CA'], ['dallas', 'Dallas', 'TX'],
  ['san-jose', 'San Jose', 'CA'], ['austin', 'Austin', 'TX'], ['jacksonville', 'Jacksonville', 'FL'],
  ['fort-worth', 'Fort Worth', 'TX'], ['columbus', 'Columbus', 'OH'], ['charlotte', 'Charlotte', 'NC'],
  ['san-francisco', 'San Francisco', 'CA'], ['indianapolis', 'Indianapolis', 'IN'], ['seattle', 'Seattle', 'WA'],
  ['denver', 'Denver', 'CO'], ['nashville', 'Nashville', 'TN'], ['oklahoma-city', 'Oklahoma City', 'OK'],
  ['el-paso', 'El Paso', 'TX'], ['boston', 'Boston', 'MA'], ['portland', 'Portland', 'OR'],
  ['las-vegas', 'Las Vegas', 'NV'], ['detroit', 'Detroit', 'MI'], ['memphis', 'Memphis', 'TN'],
  ['louisville', 'Louisville', 'KY'], ['baltimore', 'Baltimore', 'MD'], ['milwaukee', 'Milwaukee', 'WI'],
  ['albuquerque', 'Albuquerque', 'NM'], ['tucson', 'Tucson', 'AZ'], ['fresno', 'Fresno', 'CA'],
  ['sacramento', 'Sacramento', 'CA'], ['kansas-city', 'Kansas City', 'MO'], ['atlanta', 'Atlanta', 'GA'],
  ['omaha', 'Omaha', 'NE'], ['raleigh', 'Raleigh', 'NC'], ['miami', 'Miami', 'FL'],
  ['minneapolis', 'Minneapolis', 'MN'], ['tulsa', 'Tulsa', 'OK'], ['wichita', 'Wichita', 'KS'],
  ['new-orleans', 'New Orleans', 'LA'], ['cleveland', 'Cleveland', 'OH'], ['tampa', 'Tampa', 'FL'],
  ['orlando', 'Orlando', 'FL'], ['honolulu', 'Honolulu', 'HI'], ['pittsburgh', 'Pittsburgh', 'PA'],
  ['cincinnati', 'Cincinnati', 'OH'], ['st-louis', 'St. Louis', 'MO'], ['salt-lake-city', 'Salt Lake City', 'UT'],
  ['richmond', 'Richmond', 'VA'], ['fort-lauderdale', 'Fort Lauderdale', 'FL'], ['baton-rouge', 'Baton Rouge', 'LA'],
].map(([slug, name, state]) => ({ slug, name, state }))

export const stateByCode = (code: string) => STATES.find((s) => s.code === code.toUpperCase())
export const stateBySlug = (slug: string) => STATES.find((s) => s.slug === slug)
export const cityBySlug = (slug: string) => CITIES.find((c) => c.slug === slug)
export const citiesInState = (code: string) => CITIES.filter((c) => c.state === code)

/** "Miami, FL" → the city hub, "Texas" or "TX" → the state. Used by the search box. */
export function resolveLocation(input: string): { city?: City; state?: State } {
  const raw = input.trim()
  if (!raw) return {}
  const [cityPart, statePart] = raw.split(',').map((s) => s.trim())
  const st = statePart ? stateByCode(statePart) ?? stateBySlug(slugify(statePart)) : undefined
  const city = CITIES.find((c) => slugify(c.name) === slugify(cityPart) && (!st || c.state === st.code))
  if (city) return { city, state: stateByCode(city.state) }
  const state = stateByCode(raw) ?? stateBySlug(slugify(raw)) ?? st
  return { state }
}

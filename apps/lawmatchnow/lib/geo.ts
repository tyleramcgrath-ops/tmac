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

/** Approximate city-centre coordinates [lat, lng], used to place cities on the home page map. */
export const CITY_COORDS: Record<string, [number, number]> = {
  'new-york': [40.71, -74.01], 'los-angeles': [34.05, -118.24], chicago: [41.88, -87.63], houston: [29.76, -95.37],
  phoenix: [33.45, -112.07], philadelphia: [39.95, -75.17], 'san-antonio': [29.42, -98.49], 'san-diego': [32.72, -117.16],
  dallas: [32.78, -96.8], 'san-jose': [37.34, -121.89], austin: [30.27, -97.74], jacksonville: [30.33, -81.66],
  'fort-worth': [32.76, -97.33], columbus: [39.96, -83.0], charlotte: [35.23, -80.84], 'san-francisco': [37.77, -122.42],
  indianapolis: [39.77, -86.16], seattle: [47.61, -122.33], denver: [39.74, -104.99], nashville: [36.16, -86.78],
  'oklahoma-city': [35.47, -97.52], 'el-paso': [31.76, -106.49], boston: [42.36, -71.06], portland: [45.52, -122.68],
  'las-vegas': [36.17, -115.14], detroit: [42.33, -83.05], memphis: [35.15, -90.05], louisville: [38.25, -85.76],
  baltimore: [39.29, -76.61], milwaukee: [43.04, -87.91], albuquerque: [35.08, -106.65], tucson: [32.22, -110.97],
  fresno: [36.74, -119.79], sacramento: [38.58, -121.49], 'kansas-city': [39.1, -94.58], atlanta: [33.75, -84.39],
  omaha: [41.26, -95.93], raleigh: [35.78, -78.64], miami: [25.76, -80.19], minneapolis: [44.98, -93.27],
  tulsa: [36.15, -95.99], wichita: [37.69, -97.34], 'new-orleans': [29.95, -90.07], cleveland: [41.5, -81.69],
  tampa: [27.95, -82.46], orlando: [28.54, -81.38], honolulu: [21.31, -157.86], pittsburgh: [40.44, -79.99],
  cincinnati: [39.1, -84.51], 'st-louis': [38.63, -90.2], 'salt-lake-city': [40.76, -111.89], richmond: [37.54, -77.44],
  'fort-lauderdale': [26.12, -80.14], 'baton-rouge': [30.45, -91.19],
}

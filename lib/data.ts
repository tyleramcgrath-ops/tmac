export type Listing = {
  id: string
  title: string
  address: string
  city: string
  state: string
  zip: string
  beds: number
  baths: number
  sqft: number
  lotSqft: number
  yearBuilt: number
  propertyType: 'House' | 'Condo' | 'Townhouse' | 'Land' | 'Multi-Family'
  description: string
  features: string[]
  startingBid: number
  reservePrice?: number
  buyItNow?: number
  startsAt: number
  endsAt: number
  seller: string
  sellerRating: number
  palette: { from: string; via: string; to: string; accent: string }
  emoji: string
}

const DAY = 24 * 60 * 60 * 1000
const HOUR = 60 * 60 * 1000
const MIN = 60 * 1000

// We anchor seed timestamps to a fixed origin so they're stable for SSR,
// then bidders + countdowns extend them in client state.
const ORIGIN = 1_716_000_000_000

const palettes = {
  sunset: { from: '#fb923c', via: '#f43f5e', to: '#7c3aed', accent: '#fde047' },
  ocean:  { from: '#22d3ee', via: '#3b82f6', to: '#1e3a8a', accent: '#a5f3fc' },
  forest: { from: '#86efac', via: '#16a34a', to: '#064e3b', accent: '#fef9c3' },
  desert: { from: '#fde68a', via: '#f59e0b', to: '#9a3412', accent: '#fff7ed' },
  rose:   { from: '#fda4af', via: '#e11d48', to: '#881337', accent: '#fff1f2' },
  mint:   { from: '#a7f3d0', via: '#14b8a6', to: '#0f766e', accent: '#ecfeff' },
  lilac:  { from: '#e9d5ff', via: '#a855f7', to: '#581c87', accent: '#faf5ff' },
  slate:  { from: '#cbd5e1', via: '#475569', to: '#0f172a', accent: '#f8fafc' },
}

export const SEED_LISTINGS: Listing[] = [
  {
    id: 'lakeshore-craftsman',
    title: 'Lakeshore Craftsman with Dock',
    address: '412 Heron Bay Rd',
    city: 'Bend', state: 'OR', zip: '97701',
    beds: 4, baths: 3, sqft: 2840, lotSqft: 14200, yearBuilt: 2007,
    propertyType: 'House',
    description:
      'Wide-plank oak floors, vaulted cedar ceilings, and floor-to-ceiling windows framing the lake. Detached 2-car garage with finished loft. Private dock and fire-pit patio. Sold furnished — bid includes all interior staging pieces.',
    features: ['Private dock', 'Vaulted ceilings', 'Chef\'s kitchen', 'Heated floors', 'Detached garage + loft', 'Sold furnished'],
    startingBid: 615_000,
    reservePrice: 780_000,
    buyItNow: 925_000,
    startsAt: ORIGIN - 6 * DAY,
    endsAt: Date.now() + 2 * DAY + 4 * HOUR,
    seller: 'cascadia_estates',
    sellerRating: 98,
    palette: palettes.forest,
    emoji: '🌲',
  },
  {
    id: 'midcentury-glasshouse',
    title: 'Mid-Century Glass House on the Ridge',
    address: '88 Sunset Mesa Dr',
    city: 'Palm Springs', state: 'CA', zip: '92262',
    beds: 3, baths: 2, sqft: 2100, lotSqft: 11000, yearBuilt: 1962,
    propertyType: 'House',
    description:
      'A meticulously restored Krisel-style flat-roof original. Saltwater pool, terrazzo floors, and an open carport that screams convertibles. Mountain views from every wall — because most walls are windows.',
    features: ['Saltwater pool', 'Terrazzo floors', 'Carport', 'Mountain views', 'Original Krisel layout'],
    startingBid: 1_150_000,
    reservePrice: 1_400_000,
    startsAt: ORIGIN - 4 * DAY,
    endsAt: Date.now() + 19 * HOUR + 12 * MIN,
    seller: 'desert_modern_co',
    sellerRating: 99,
    palette: palettes.sunset,
    emoji: '🌵',
  },
  {
    id: 'brownstone-park-slope',
    title: 'Park Slope Brownstone — Triplex',
    address: '233 Garfield Pl',
    city: 'Brooklyn', state: 'NY', zip: '11215',
    beds: 5, baths: 3, sqft: 3600, lotSqft: 2000, yearBuilt: 1898,
    propertyType: 'Multi-Family',
    description:
      'Owner\'s triplex over a garden rental. Original mantles, parlor pocket doors, and a south-facing garden. Two blocks to Prospect Park. Rental currently generates $4,200/mo.',
    features: ['Garden rental unit', 'Original woodwork', '4 wood-burning fireplaces', 'Roof rights', 'Walk Score 98'],
    startingBid: 2_800_000,
    reservePrice: 3_250_000,
    buyItNow: 3_900_000,
    startsAt: ORIGIN - 8 * DAY,
    endsAt: Date.now() + 4 * DAY + 6 * HOUR,
    seller: 'park_slope_realty',
    sellerRating: 96,
    palette: palettes.rose,
    emoji: '🏛️',
  },
  {
    id: 'austin-loft-east',
    title: 'East Austin Industrial Loft',
    address: '1818 E Cesar Chavez St #4',
    city: 'Austin', state: 'TX', zip: '78702',
    beds: 2, baths: 2, sqft: 1480, lotSqft: 0, yearBuilt: 2014,
    propertyType: 'Condo',
    description:
      'Concrete floors, 18\' ceilings, exposed ductwork — the loft people pretend to want until they live in one. Rooftop pool, dog run, two assigned parking spots. HOA $480/mo includes water.',
    features: ['18ft ceilings', 'Rooftop pool', '2 parking spots', 'Pet friendly', 'EV charger'],
    startingBid: 420_000,
    startsAt: ORIGIN - 2 * DAY,
    endsAt: Date.now() + 11 * HOUR,
    seller: 'urban_atx',
    sellerRating: 94,
    palette: palettes.slate,
    emoji: '🏭',
  },
  {
    id: 'farmhouse-vermont',
    title: '1840s Vermont Farmhouse on 12 Acres',
    address: '76 Hollow Brook Ln',
    city: 'Stowe', state: 'VT', zip: '05672',
    beds: 4, baths: 2, sqft: 2960, lotSqft: 522_720, yearBuilt: 1842,
    propertyType: 'House',
    description:
      'Wide-board pine floors, two original fireplaces, restored timber-frame barn. 12 acres of pasture and woods, brook running through the property. Maple sugaring shack included. New roof 2023.',
    features: ['12 acres', 'Restored barn', 'Sugar shack', '2 fireplaces', 'Brook frontage'],
    startingBid: 540_000,
    reservePrice: 690_000,
    startsAt: ORIGIN - 5 * DAY,
    endsAt: Date.now() + 3 * DAY + 8 * HOUR,
    seller: 'green_mtn_homes',
    sellerRating: 97,
    palette: palettes.mint,
    emoji: '🍁',
  },
  {
    id: 'miami-tower-condo',
    title: 'Brickell Sky-Tower 41st Floor',
    address: '500 Brickell Ave #4108',
    city: 'Miami', state: 'FL', zip: '33131',
    beds: 2, baths: 2, sqft: 1320, lotSqft: 0, yearBuilt: 2019,
    propertyType: 'Condo',
    description:
      'Floor-to-ceiling water views east to the bay. Wraparound balcony, Bosch appliances, building has pool deck, gym, spa, valet, and a wine cellar with personal lockers. HOA $1,290/mo.',
    features: ['Bay views', 'Wraparound balcony', 'Concierge', 'Valet parking', 'Wine cellar'],
    startingBid: 875_000,
    buyItNow: 1_250_000,
    startsAt: ORIGIN - 3 * DAY,
    endsAt: Date.now() + 22 * HOUR + 40 * MIN,
    seller: 'brickell_living',
    sellerRating: 92,
    palette: palettes.ocean,
    emoji: '🌊',
  },
  {
    id: 'tahoe-aframe',
    title: 'Classic Tahoe A-Frame',
    address: '301 Pine Needle Way',
    city: 'South Lake Tahoe', state: 'CA', zip: '96150',
    beds: 3, baths: 2, sqft: 1640, lotSqft: 8400, yearBuilt: 1971,
    propertyType: 'House',
    description:
      'The A-Frame of every ski-week dream. Tongue-and-groove pine throughout, wood stove, ski-locker mudroom, and an outdoor hot tub on the back deck. 9 minutes to Heavenly base.',
    features: ['Wood stove', 'Hot tub', 'Ski locker', 'Cleared driveway easement', 'STR permit eligible'],
    startingBid: 685_000,
    reservePrice: 820_000,
    startsAt: ORIGIN - 7 * DAY,
    endsAt: Date.now() + 6 * DAY + 2 * HOUR,
    seller: 'alpine_holdings',
    sellerRating: 95,
    palette: palettes.slate,
    emoji: '⛷️',
  },
  {
    id: 'savannah-historic',
    title: 'Historic Savannah Carriage House',
    address: '14 W Jones St',
    city: 'Savannah', state: 'GA', zip: '31401',
    beds: 2, baths: 2, sqft: 1280, lotSqft: 1900, yearBuilt: 1857,
    propertyType: 'Townhouse',
    description:
      'Brick courtyard, gas lanterns, and a guest cottage out back. Steps from Forsyth Park. Recent kitchen and bath restorations preserve original brick and beams.',
    features: ['Brick courtyard', 'Guest cottage', 'Gas lanterns', 'Original heart-pine beams', 'Historic district'],
    startingBid: 720_000,
    reservePrice: 880_000,
    buyItNow: 1_050_000,
    startsAt: ORIGIN - 6 * DAY,
    endsAt: Date.now() + 1 * DAY + 16 * HOUR,
    seller: 'lowcountry_estates',
    sellerRating: 98,
    palette: palettes.desert,
    emoji: '🌳',
  },
  {
    id: 'denver-tudor',
    title: 'Park Hill Tudor with Studio',
    address: '2245 Forest St',
    city: 'Denver', state: 'CO', zip: '80207',
    beds: 4, baths: 3, sqft: 2980, lotSqft: 7800, yearBuilt: 1928,
    propertyType: 'House',
    description:
      'Steeply pitched roof, leaded-glass windows, original quarter-sawn oak. Detached studio (insulated, mini-split) currently used as a recording space. Walkable to the zoo.',
    features: ['Leaded glass', 'Detached studio', 'Mini-split HVAC', 'Original oak floors', 'Garden beds'],
    startingBid: 935_000,
    startsAt: ORIGIN - 2 * DAY,
    endsAt: Date.now() + 9 * HOUR + 30 * MIN,
    seller: 'mile_high_realty',
    sellerRating: 91,
    palette: palettes.lilac,
    emoji: '🏰',
  },
  {
    id: 'big-island-jungle',
    title: 'Off-Grid Big Island Jungle Bungalow',
    address: '13-1234 Volcano Hwy',
    city: 'Pahoa', state: 'HI', zip: '96778',
    beds: 1, baths: 1, sqft: 720, lotSqft: 43_560, yearBuilt: 2018,
    propertyType: 'House',
    description:
      'Catchment water, full solar, Starlink-ready. Open lanai under monkeypod trees. Outdoor shower, papaya and lilikoi mature on the property. 1 acre, mostly cleared.',
    features: ['Full solar', 'Catchment system', 'Outdoor shower', '1 acre', 'Mature fruit trees'],
    startingBid: 215_000,
    startsAt: ORIGIN - 1 * DAY,
    endsAt: Date.now() + 5 * HOUR + 12 * MIN,
    seller: 'aloha_offgrid',
    sellerRating: 89,
    palette: palettes.mint,
    emoji: '🌺',
  },
  {
    id: 'chicago-greystone',
    title: 'Logan Square Greystone Two-Flat',
    address: '2741 W Palmer Sq',
    city: 'Chicago', state: 'IL', zip: '60647',
    beds: 6, baths: 4, sqft: 3450, lotSqft: 3125, yearBuilt: 1906,
    propertyType: 'Multi-Family',
    description:
      'Owner duplex up + garden rental. Two-car garage with new EV outlet. Sits directly on the boulevard. Massive deck off the second floor with skyline views.',
    features: ['Two units', 'EV-ready garage', 'Boulevard frontage', 'Skyline-view deck', 'New tear-off roof'],
    startingBid: 780_000,
    reservePrice: 925_000,
    startsAt: ORIGIN - 4 * DAY,
    endsAt: Date.now() + 2 * DAY + 11 * HOUR,
    seller: 'palmer_square_re',
    sellerRating: 96,
    palette: palettes.rose,
    emoji: '🏙️',
  },
  {
    id: 'wyoming-ranch-land',
    title: '160 Acres Wyoming Rangeland',
    address: 'Lot 7 County Rd 41',
    city: 'Saratoga', state: 'WY', zip: '82331',
    beds: 0, baths: 0, sqft: 0, lotSqft: 6_969_600, yearBuilt: 0,
    propertyType: 'Land',
    description:
      'Raw 160-acre parcel adjacent to BLM access. Well drilled, septic perc-tested, power at road. Build-ready. Trout creek runs the western boundary. Mineral rights convey.',
    features: ['160 acres', 'Well drilled', 'Septic perc-tested', 'Creek frontage', 'Mineral rights'],
    startingBid: 295_000,
    startsAt: ORIGIN - 9 * DAY,
    endsAt: Date.now() + 7 * DAY + 14 * HOUR,
    seller: 'rocky_mtn_land_co',
    sellerRating: 93,
    palette: palettes.desert,
    emoji: '🏞️',
  },
]

export function getListing(id: string): Listing | undefined {
  return SEED_LISTINGS.find((l) => l.id === id)
}

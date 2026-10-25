// Sample Palm Beach County listings for the prototype. In production these come from
// Postgres; the shape here is the shape of the `listings` table (see PLAN.md §9).

export type ListingStatus = "live" | "upcoming" | "sold";

export type Room = { name: string; w: number; h: number; x: number; y: number };

export type Listing = {
  id: string;
  address: string;
  city: string;
  zip: string;
  neighborhood: string;
  type: "Single family" | "Townhome" | "Condo";
  beds: number;
  baths: number;
  sqft: number;
  lotSqft: number;
  yearBuilt: number;
  hoaMonthly: number;
  taxesYearly: number;
  status: ListingStatus;
  startingBid: number;
  /** Hidden from buyers — only "reserve met / not met" is ever shown. */
  reserve: number | null;
  buyNow: number | null;
  /** Gavel estimate (AVM) from county-recorded sales. */
  estimate: number;
  /** Hours from page load until the auction closes (negative = closed). */
  endsInHours: number;
  /** Seeded competing bids so the prototype auction feels alive. */
  seedBids: { bidder: string; max: number }[];
  watchers: number;
  /** Map position, 0–100 on the stylized Palm Beach County map. */
  pin: { x: number; y: number };
  palette: { body: string; roof: string; door: string; sky: string };
  headline: string;
  description: string;
  features: string[];
  rooms: Room[];
  openHouses: { label: string; live: boolean }[];
  selfTour: boolean;
  documents: { name: string; kind: "Disclosure" | "Inspection" | "Report" | "HOA" | "Title" | "Utility"; pages: number }[];
  scores: { label: string; value: string }[];
  soldPrice?: number;
};

const baseDocs: Listing["documents"] = [
  { name: "Seller's property disclosure", kind: "Disclosure", pages: 6 },
  { name: "Pre-listing home inspection", kind: "Inspection", pages: 42 },
  { name: "Wind mitigation + 4-point report", kind: "Report", pages: 8 },
  { name: "Title commitment preview", kind: "Title", pages: 5 },
  { name: "12 months of utility bills", kind: "Utility", pages: 12 },
];

export const listings: Listing[] = [
  {
    id: "418-pershing-way",
    address: "418 Pershing Way",
    city: "West Palm Beach",
    zip: "33401",
    neighborhood: "Flamingo Park",
    type: "Single family",
    beds: 3,
    baths: 2,
    sqft: 1_840,
    lotSqft: 6_500,
    yearBuilt: 1956,
    hoaMonthly: 0,
    taxesYearly: 7_420,
    status: "live",
    startingBid: 585_000,
    reserve: 640_000,
    buyNow: 699_000,
    estimate: 655_000,
    endsInHours: 26.4,
    seedBids: [
      { bidder: "Bidder 7Q", max: 612_500 },
      { bidder: "Bidder K2", max: 627_500 },
    ],
    watchers: 214,
    pin: { x: 66, y: 40 },
    palette: { body: "#e9dcc7", roof: "#5b4636", door: "#2f5d50", sky: "#cfe4f2" },
    headline: "Restored 1950s block home in historic Flamingo Park, minutes from Clematis Street",
    description:
      "Owner-sold. Terrazzo floors restored in 2024, new roof (2022, transferable warranty), impact windows, and a fenced backyard with a saltwater pool. Seller has uploaded a full pre-listing inspection — read it before you bid.",
    features: ["Saltwater pool", "Roof 2022", "Impact windows", "Terrazzo floors", "Flood zone X", "A-rated schools"],
    rooms: [
      { name: "Living", w: 34, h: 30, x: 0, y: 0 },
      { name: "Kitchen", w: 26, h: 30, x: 34, y: 0 },
      { name: "Dining", w: 20, h: 30, x: 60, y: 0 },
      { name: "Primary", w: 30, h: 28, x: 0, y: 30 },
      { name: "Bath", w: 14, h: 28, x: 30, y: 30 },
      { name: "Bed 2", w: 20, h: 28, x: 44, y: 30 },
      { name: "Bed 3", w: 16, h: 28, x: 64, y: 30 },
    ],
    openHouses: [
      { label: "Sat 10:00–1:00 · in person", live: false },
      { label: "Sun 2:00 · livestream walkthrough with the owner", live: true },
    ],
    selfTour: true,
    documents: baseDocs,
    scores: [
      { label: "Flood risk", value: "Minimal (Zone X)" },
      { label: "Walk score", value: "71" },
      { label: "Commute to downtown", value: "12 min" },
      { label: "Insurance estimate", value: "$3,900/yr" },
    ],
  },
  {
    id: "214-ne-7th-ave",
    address: "214 NE 7th Ave",
    city: "Delray Beach",
    zip: "33483",
    neighborhood: "Del-Ida Park",
    type: "Single family",
    beds: 4,
    baths: 3,
    sqft: 2_610,
    lotSqft: 7_200,
    yearBuilt: 1925,
    hoaMonthly: 0,
    taxesYearly: 11_900,
    status: "live",
    startingBid: 895_000,
    reserve: 960_000,
    buyNow: null,
    estimate: 985_000,
    endsInHours: 3.2,
    seedBids: [
      { bidder: "Bidder M4", max: 930_000 },
      { bidder: "Bidder 9X", max: 975_000 },
      { bidder: "Bidder R1", max: 955_000 },
    ],
    watchers: 488,
    pin: { x: 70, y: 76 },
    palette: { body: "#f2efe6", roof: "#3c4a57", door: "#9b3d2c", sky: "#d9e9f5" },
    headline: "1925 cottage with a detached studio, a short walk to Atlantic Avenue",
    description:
      "Restored heart-pine floors, wraparound porch, elevated in 2021 above base flood elevation (certificate in the data room). Detached garage studio with its own bath.",
    features: ["Elevated 2021", "Garage studio", "Wraparound porch", "Heart-pine floors", "EV charger"],
    rooms: [
      { name: "Porch", w: 80, h: 10, x: 0, y: 0 },
      { name: "Living", w: 30, h: 26, x: 0, y: 10 },
      { name: "Dining", w: 22, h: 26, x: 30, y: 10 },
      { name: "Kitchen", w: 28, h: 26, x: 52, y: 10 },
      { name: "Primary", w: 30, h: 24, x: 0, y: 36 },
      { name: "Bed 2", w: 18, h: 24, x: 30, y: 36 },
      { name: "Bed 3", w: 16, h: 24, x: 48, y: 36 },
      { name: "Bed 4", w: 16, h: 24, x: 64, y: 36 },
    ],
    openHouses: [{ label: "Today 4:00 · livestream final walkthrough", live: true }],
    selfTour: false,
    documents: [...baseDocs, { name: "Elevation certificate", kind: "Report", pages: 3 }],
    scores: [
      { label: "Flood risk", value: "Moderate (Zone AE, elevated)" },
      { label: "Walk score", value: "88" },
      { label: "Commute to downtown", value: "6 min" },
      { label: "Insurance estimate", value: "$6,800/yr" },
    ],
  },
  {
    id: "9218-laurel-oak-way",
    address: "9218 Laurel Oak Way",
    city: "Palm Beach Gardens",
    zip: "33418",
    neighborhood: "Gardens West",
    type: "Single family",
    beds: 4,
    baths: 2.5,
    sqft: 2_380,
    lotSqft: 9_100,
    yearBuilt: 1998,
    hoaMonthly: 85,
    taxesYearly: 6_100,
    status: "live",
    startingBid: 445_000,
    reserve: 485_000,
    buyNow: 525_000,
    estimate: 498_000,
    endsInHours: 74,
    seedBids: [{ bidder: "Bidder T3", max: 462_500 }],
    watchers: 131,
    pin: { x: 60, y: 22 },
    palette: { body: "#dfe5df", roof: "#6b5a4a", door: "#2c3e63", sky: "#d4e8ef" },
    headline: "Conservation-lot pool home in a gated A-school community",
    description: "No rear neighbors, new AC (2023), screened lanai, three-car garage. Self-tour any day 8am–8pm with a verified ID.",
    features: ["Conservation lot", "AC 2023", "Screened pool", "3-car garage", "Gated"],
    rooms: [
      { name: "Great room", w: 36, h: 30, x: 0, y: 0 },
      { name: "Kitchen", w: 24, h: 30, x: 36, y: 0 },
      { name: "Garage", w: 20, h: 30, x: 60, y: 0 },
      { name: "Primary", w: 28, h: 28, x: 0, y: 30 },
      { name: "Bed 2", w: 18, h: 28, x: 28, y: 30 },
      { name: "Bed 3", w: 17, h: 28, x: 46, y: 30 },
      { name: "Bed 4", w: 17, h: 28, x: 63, y: 30 },
    ],
    openHouses: [{ label: "Sat 11:00–2:00 · in person", live: false }],
    selfTour: true,
    documents: [...baseDocs, { name: "HOA budget + rules", kind: "HOA", pages: 18 }],
    scores: [
      { label: "Flood risk", value: "Minimal (Zone X)" },
      { label: "Walk score", value: "22" },
      { label: "Commute to downtown", value: "28 min" },
      { label: "Insurance estimate", value: "$3,100/yr" },
    ],
  },
  {
    id: "1120-lucerne-ave",
    address: "1120 Lucerne Ave",
    city: "Lake Worth Beach",
    zip: "33460",
    neighborhood: "Downtown",
    type: "Townhome",
    beds: 3,
    baths: 3.5,
    sqft: 1_960,
    lotSqft: 1_800,
    yearBuilt: 2021,
    hoaMonthly: 140,
    taxesYearly: 6_800,
    status: "live",
    startingBid: 499_000,
    reserve: null,
    buyNow: null,
    estimate: 552_000,
    endsInHours: 49,
    seedBids: [
      { bidder: "Bidder P8", max: 520_000 },
      { bidder: "Bidder L5", max: 507_500 },
    ],
    watchers: 167,
    pin: { x: 64, y: 54 },
    palette: { body: "#cfd6dc", roof: "#2b2f36", door: "#c9852f", sky: "#d7e6f3" },
    headline: "No-reserve auction: 2021 townhome with rooftop deck",
    description:
      "Absolute auction — the highest bid wins, no reserve. Builder warranty transfers. Rooftop deck with Intracoastal views, two-car garage.",
    features: ["No reserve", "Rooftop deck", "Builder warranty", "2-car garage", "Solar-ready"],
    rooms: [
      { name: "Garage", w: 40, h: 22, x: 0, y: 0 },
      { name: "Flex", w: 40, h: 22, x: 40, y: 0 },
      { name: "Living", w: 40, h: 18, x: 0, y: 22 },
      { name: "Kitchen", w: 40, h: 18, x: 40, y: 22 },
      { name: "Primary", w: 40, h: 18, x: 0, y: 40 },
      { name: "Bed 2", w: 20, h: 18, x: 40, y: 40 },
      { name: "Bed 3", w: 20, h: 18, x: 60, y: 40 },
    ],
    openHouses: [{ label: "Sun 12:00–3:00 · in person", live: false }],
    selfTour: true,
    documents: [...baseDocs, { name: "HOA budget + rules", kind: "HOA", pages: 22 }],
    scores: [
      { label: "Flood risk", value: "Minimal (Zone X)" },
      { label: "Walk score", value: "79" },
      { label: "Commute to downtown", value: "8 min" },
      { label: "Insurance estimate", value: "$2,600/yr" },
    ],
  },
  {
    id: "2700-n-ocean-blvd-402",
    address: "2700 N Ocean Blvd #402",
    city: "Boca Raton",
    zip: "33431",
    neighborhood: "Boca beachfront",
    type: "Condo",
    beds: 2,
    baths: 2,
    sqft: 1_310,
    lotSqft: 0,
    yearBuilt: 2006,
    hoaMonthly: 910,
    taxesYearly: 5_400,
    status: "upcoming",
    startingBid: 410_000,
    reserve: 455_000,
    buyNow: null,
    estimate: 468_000,
    endsInHours: 168,
    seedBids: [],
    watchers: 59,
    pin: { x: 74, y: 88 },
    palette: { body: "#eef1f3", roof: "#7a8b99", door: "#2a6f97", sky: "#cde7f6" },
    headline: "Ocean-view condo, milestone inspection passed",
    description:
      "Bidding opens after this weekend's open house. Building passed its 2025 milestone + SIRS reserve study (both in the data room) — no surprise assessments.",
    features: ["Water view", "Milestone passed", "SIRS funded", "Boat slip available", "Pool + gym"],
    rooms: [
      { name: "Living", w: 40, h: 30, x: 0, y: 0 },
      { name: "Kitchen", w: 20, h: 30, x: 40, y: 0 },
      { name: "Balcony", w: 20, h: 30, x: 60, y: 0 },
      { name: "Primary", w: 35, h: 28, x: 0, y: 30 },
      { name: "Bath", w: 15, h: 28, x: 35, y: 30 },
      { name: "Bed 2", w: 30, h: 28, x: 50, y: 30 },
    ],
    openHouses: [{ label: "Sat 1:00–4:00 · in person + livestream", live: true }],
    selfTour: false,
    documents: [
      ...baseDocs,
      { name: "Milestone inspection (2025)", kind: "Report", pages: 31 },
      { name: "SIRS reserve study", kind: "HOA", pages: 44 },
    ],
    scores: [
      { label: "Flood risk", value: "High (Zone AE, 4th floor)" },
      { label: "Walk score", value: "54" },
      { label: "Commute to downtown", value: "34 min" },
      { label: "Insurance estimate", value: "Covered by HOA master" },
    ],
  },
  {
    id: "1847-sandpiper-cir",
    address: "1847 Sandpiper Cir",
    city: "Jupiter",
    zip: "33458",
    neighborhood: "Jupiter",
    type: "Single family",
    beds: 3,
    baths: 2,
    sqft: 1_520,
    lotSqft: 5_000,
    yearBuilt: 2015,
    hoaMonthly: 0,
    taxesYearly: 5_200,
    status: "sold",
    startingBid: 399_000,
    reserve: 430_000,
    buyNow: null,
    estimate: 441_000,
    endsInHours: -40,
    seedBids: [],
    watchers: 302,
    pin: { x: 64, y: 9 },
    palette: { body: "#e4d4c0", roof: "#4a3f35", door: "#3b6e57", sky: "#d6e6f0" },
    headline: "Sold in 7 days — 23 bids, 11 verified bidders",
    description: "Seller paid a $499 flat fee instead of ~$26,600 in commissions.",
    features: ["Sold", "23 bids", "11 bidders", "Closed in 21 days"],
    rooms: [
      { name: "Living", w: 40, h: 30, x: 0, y: 0 },
      { name: "Kitchen", w: 40, h: 30, x: 40, y: 0 },
      { name: "Primary", w: 30, h: 28, x: 0, y: 30 },
      { name: "Bed 2", w: 25, h: 28, x: 30, y: 30 },
      { name: "Bed 3", w: 25, h: 28, x: 55, y: 30 },
    ],
    openHouses: [],
    selfTour: false,
    documents: baseDocs,
    scores: [
      { label: "Flood risk", value: "Moderate" },
      { label: "Walk score", value: "41" },
      { label: "Commute to downtown", value: "18 min" },
      { label: "Insurance estimate", value: "$3,400/yr" },
    ],
    soldPrice: 452_500,
  },
];

export function getListing(id: string): Listing | undefined {
  return listings.find((l) => l.id === id);
}

export const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export const usdShort = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${Math.round(n / 1_000)}K`;

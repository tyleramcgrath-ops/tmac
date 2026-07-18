// Sample / seeded data. Reloop's real pricing engine ingests sold-comp data
// via official marketplace APIs and seller-submitted sale confirmations —
// this file stands in for that pipeline in the prototype.

export type Platform = {
  id: string;
  name: string;
  color: string;
  fee: string;
};

export const PLATFORMS: Platform[] = [
  { id: "depop", name: "Depop", color: "#FF2300", fee: "10%" },
  { id: "poshmark", name: "Poshmark", color: "#901C42", fee: "20%" },
  { id: "ebay", name: "eBay", color: "#E53238", fee: "13.25%" },
  { id: "vinted", name: "Vinted", color: "#09B1BA", fee: "0%" },
  { id: "mercari", name: "Mercari", color: "#5B21B6", fee: "10%" },
  { id: "grailed", name: "Grailed", color: "#EFEFEF", fee: "9%" },
];

export type TickerEntry = {
  item: string;
  platform: string;
  price: number;
  delta: number;
};

export const TICKER: TickerEntry[] = [
  { item: "Carhartt WIP Detroit Jacket", platform: "Depop", price: 88, delta: 6.2 },
  { item: "Levi's 501 '93 Straight", platform: "Vinted", price: 34, delta: -2.1 },
  { item: "New Balance 990v5 Grey", platform: "eBay", price: 121, delta: 3.4 },
  { item: "Coach Vintage Crossbody", platform: "Poshmark", price: 76, delta: 11.5 },
  { item: "Nike ACG Fleece", platform: "Grailed", price: 64, delta: 1.2 },
  { item: "Patagonia Retro-X Vest", platform: "Depop", price: 95, delta: 8.9 },
  { item: "Miu Miu Ballet Flats", platform: "Poshmark", price: 210, delta: -4.6 },
  { item: "Champion Reverse Weave Hoodie", platform: "Mercari", price: 42, delta: 2.8 },
  { item: "Salomon XT-6 Phantom", platform: "eBay", price: 158, delta: 5.1 },
  { item: "Y2K Baby Tee Bundle (3)", platform: "Depop", price: 29, delta: -1.4 },
];

export type SaleComp = {
  platform: string;
  price: number;
  daysAgo: number;
  condition: "New" | "Excellent" | "Good" | "Fair";
};

export type ItemResult = {
  query: string;
  category: string;
  suggestedPriceLow: number;
  suggestedPriceHigh: number;
  medianSoldPrice: number;
  medianDaysToSell: number;
  sampleSize: number;
  trend: number;
  sparkline: number[];
  recentSales: SaleComp[];
};

export const SAMPLE_RESULTS: Record<string, ItemResult> = {
  "levi's 501": {
    query: "Levi's 501 '93 Straight Jeans",
    category: "Denim",
    suggestedPriceLow: 32,
    suggestedPriceHigh: 41,
    medianSoldPrice: 36,
    medianDaysToSell: 6,
    sampleSize: 412,
    trend: 4.3,
    sparkline: [28, 30, 29, 33, 31, 35, 34, 36, 38, 36, 37, 36],
    recentSales: [
      { platform: "Vinted", price: 34, daysAgo: 1, condition: "Excellent" },
      { platform: "Depop", price: 39, daysAgo: 2, condition: "Good" },
      { platform: "eBay", price: 42, daysAgo: 3, condition: "New" },
      { platform: "Poshmark", price: 31, daysAgo: 4, condition: "Fair" },
      { platform: "Mercari", price: 37, daysAgo: 6, condition: "Excellent" },
    ],
  },
  "new balance 990": {
    query: "New Balance 990v5",
    category: "Sneakers",
    suggestedPriceLow: 108,
    suggestedPriceHigh: 134,
    medianSoldPrice: 121,
    medianDaysToSell: 4,
    sampleSize: 289,
    trend: 7.8,
    sparkline: [96, 99, 101, 104, 108, 112, 110, 115, 118, 121, 119, 124],
    recentSales: [
      { platform: "eBay", price: 121, daysAgo: 1, condition: "Excellent" },
      { platform: "Grailed", price: 134, daysAgo: 1, condition: "New" },
      { platform: "Depop", price: 112, daysAgo: 3, condition: "Good" },
      { platform: "Mercari", price: 118, daysAgo: 4, condition: "Excellent" },
    ],
  },
  "carhartt detroit jacket": {
    query: "Carhartt WIP Detroit Jacket",
    category: "Outerwear",
    suggestedPriceLow: 74,
    suggestedPriceHigh: 96,
    medianSoldPrice: 88,
    medianDaysToSell: 5,
    sampleSize: 176,
    trend: 12.4,
    sparkline: [58, 61, 64, 68, 71, 75, 79, 82, 85, 88, 90, 88],
    recentSales: [
      { platform: "Depop", price: 88, daysAgo: 2, condition: "Excellent" },
      { platform: "eBay", price: 96, daysAgo: 2, condition: "New" },
      { platform: "Grailed", price: 91, daysAgo: 5, condition: "Excellent" },
      { platform: "Vinted", price: 74, daysAgo: 6, condition: "Good" },
    ],
  },
};

export const DEFAULT_QUERY = "levi's 501";

export type DraftListing = {
  title: string;
  brand: string;
  category: string;
  size: string;
  condition: string;
  description: string;
  suggestedPrice: number;
  tags: string[];
};

export const SAMPLE_DRAFT: DraftListing = {
  title: "Vintage Carhartt WIP Detroit Jacket — Sherpa Lined",
  brand: "Carhartt WIP",
  category: "Outerwear / Jackets",
  size: "M",
  condition: "Excellent — light wear on cuffs, no stains or tears",
  description:
    "Classic Detroit jacket in duck canvas with sherpa lining. Blanket-lined chest pocket, corduroy collar. Fits true to size, slightly boxy through the body. Smoke-free home.",
  suggestedPrice: 89,
  tags: ["carhartt", "detroit jacket", "workwear", "y2k", "streetwear", "sherpa"],
};

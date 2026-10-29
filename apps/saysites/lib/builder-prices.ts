// What the three best-known website builders charge, from their own pricing
// pages, for the homepage and /pricing comparison. Shown as an unnamed range
// (we never name or make claims about a competitor in public). Re-check
// quarterly; if a figure changes, update it here and the date with it.
// Sources (checked September 2026): squarespace.com/pricing,
// shopify.com/pricing, wix.com/plans. Monthly billing unless noted.

export const BUILDERS_CHECKED = 'September 2026'

export const BUILDER_RANGE = {
  // Cheapest plan that gives a business a website (one is yearly-billed).
  site: { low: 17, high: 39 },
  // Cheapest plan that can sell online.
  store: { low: 25, high: 39 },
  // Their cut of each sale on those plans, in percent.
  cut: { low: 0, high: 2 },
}

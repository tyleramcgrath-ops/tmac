# SaySites Store vs Shopify's merchant admin

Researched October 14, 2026 from Shopify's own help center and pricing page
(sources linked below). Internal notes: never name Shopify or any competitor
in SaySites marketing (CLAUDE.md). Facts marked (unverified) came from
memory of the admin and weren't confirmed on a Shopify page that day.

## What Shopify's admin does (the bar)

- **Products:** title, rich description, up to 250 media items, category from
  Shopify's product taxonomy, price, compare-at price, cost per item with
  margin, SKU, barcodes, weight and size, customs fields. Statuses are
  Active, Draft, Archived and Unlisted. A product can have 3 options and up
  to 2,048 variants, though Shopify warns many themes and apps break above
  100. Smart collections take up to 60 conditions. CSV import/export.
- **Inventory:** tracked per location as Available, Committed, Unavailable,
  On hand and Incoming. "Continue selling when out of stock" is set per
  variant.
- **Orders:** status, payment and fulfillment are separate fields, plus a
  return status. Shopify also has partial refunds with restock, returns with
  rules and fees, order edits, draft orders and invoices, abandoned
  checkouts with recovery emails, fraud analysis, packing slips, and a
  timeline with comments.
- **Checkout:** one page, with Shop Pay and other express wallets, address
  autocomplete, guest checkout, passwordless customer accounts, and tipping.
- **Shipping:** profiles and zones, flat, conditional or carrier-calculated
  rates, local delivery by postal code or radius with minimums, pickup, and
  label buying.
- **Tax:** Shopify Tax is free up to $100k in sales, then a per-order fee.
- **Discounts:** codes or automatic, as amount off products, amount off the
  order, buy X get Y, or free shipping. Each can have minimums, usage limits,
  dates, customer eligibility and combination rules.
- **Customers:** profiles, marketing consent, segments, tags and notes.
- **Analytics:**
  - Home cards show sessions, total sales, orders and conversion.
  - A funnel goes from sessions to add-to-cart, reached checkout and
    completed.
  - Reports cover sales, customers, finance, inventory and more.
- **Notifications:** order confirmation, shipping confirmation and updates,
  refund and cancellation for customers. New-order and summary emails for
  staff.
- **Plans (US, monthly):**

  | Plan | Price | Online card rate | Fee when not using Shopify Payments |
  |---|---|---|---|
  | Basic | $39 | 2.9% + 30¢ | 2% |
  | Grow | $105 | 2.7% + 30¢ | 1% |
  | Advanced | $399 | 2.5% + 30¢ | 0.6% |
  | Plus | from $2,300 | 2.25% + 30¢ | 0.2% |

## What merchants complain about (Shopify Community threads)

- **Apps:** paid apps stack up for basics, at $5 to $15 a month each:
  reviews, swatches, preorders, product options beyond the variant limit,
  and a discount field in the cart.
- **Third-party payments:** a 2% surcharge applies when using another
  payment processor.
- **Complexity:** setup is complex, and theme layout changes need Liquid
  code.

## How the SaySites Store answers it

| | Shopify | SaySites Store |
|---|---|---|
| Fee on sales | 2.9% + 30¢ on Basic, or a 2% surcharge with another processor | 0% from SaySites. Stripe's normal card fee goes on the owner's own account. |
| Price | from $39 a month, plus apps | Store plan from `PRICES.store` (lib/billing). Everything below is included, with no apps. |
| Setup | Many settings pages | A 5-step checklist on Store Home. Or tell Sofie: "add a candle for $24, 12 in stock". |
| Products | Full catalog | Options and variants (3 and 100), compare-at, cost and profit, SKU, sections, draft and unlisted, stock with "keep selling at zero" |
| Product pages | Theme-dependent | Each product gets its own fast page with full Google product data: variants, shipping and return policy |
| Cart and checkout | Shopify checkout | Cart with no JavaScript, then Stripe Checkout on the owner's account, with Apple Pay and Google Pay where Stripe offers them |
| Delivery | Profiles and zones | Flat rate with a free-over threshold and express option, pickup, and local delivery by ZIP with a minimum |
| Discounts | Many types | Codes or automatic, as percent, amount or free shipping, with minimum, dates and use limit. One discount plus free shipping can combine. |
| Orders | Full | Numbered orders, ship / ready / out for delivery / done, tracking links, notes timeline, refunds through Stripe with restock, CSV export |
| Customers | Profiles, segments | Built from orders: spend, order count, repeat rate |
| Analytics | Reports | Sales, orders, average order, profit, returning customers, best sellers, and a funnel counted without cookies |
| Emails | Templates | Confirmation, new-order alert with low stock, shipped / ready / out for delivery, refund |
| Speed | Theme-dependent | Every page passes the 95+ speed gate, with no client JavaScript |

## Not built yet (worth doing when customers ask)

- **Payments and orders:**
  - Settling refunds made directly in the Stripe dashboard.
  - Order edits.
  - Draft orders and invoices for phone sales.
- **Shipping:**
  - Weight-based or carrier-calculated rates.
  - Shipping labels.
  - Multiple locations.
- **Customers:**
  - Customer accounts.
  - Abandoned-checkout emails (they need marketing consent).
- **Catalog:**
  - Gift cards with balances.
  - Subscriptions.
  - Buy X get Y discounts.
  - CSV product import.
- **Sofie:** order actions such as "mark #1004 shipped".

## Sources (checked 2026-10-14)

- **Products:**
  - https://help.shopify.com/en/manual/products/details/product-details-page
  - https://help.shopify.com/en/manual/products/variants/add-variants
  - https://help.shopify.com/en/manual/products/collections/conditions
- **Orders:**
  - https://help.shopify.com/en/manual/orders/order-status
  - https://help.shopify.com/en/manual/fulfillment/managing-orders/refunding-orders
  - https://help.shopify.com/en/manual/orders/abandoned-checkouts
- **Local delivery:**
  - https://help.shopify.com/en/manual/fulfillment/setup/delivery-methods/local-delivery
- **Discounts:**
  - https://help.shopify.com/en/manual/discounts/discount-combinations
  - https://help.shopify.com/en/manual/discounts/discount-types
- **Tax and pricing:**
  - https://help.shopify.com/en/manual/taxes/shopify-tax/pricing
  - https://www.shopify.com/pricing
- **Merchant complaints:**
  - https://community.shopify.com/t/too-many-shortcomings-requiring-too-many-apps/181229
  - https://community.shopify.com/t/why-does-shopify-charge-a-2-transaction-fee-for-third-party-providers/246613
- **Stripe Connect, used for checkout:**
  - https://docs.stripe.com/connect/accounts-v2/connected-account-configuration
  - https://docs.stripe.com/connect/direct-charges

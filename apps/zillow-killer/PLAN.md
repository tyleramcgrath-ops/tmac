# Zillow Killer — Gavel Homes: Full Plan

> **One line:** eBay for houses. Owners list for a flat fee. Buyers see everything (3D, live stream, self-tour, the inspection report) without an agent, then bid in the open with verified buying power. Nobody pays the 5–6%.

Working brand: **Gavel Homes** (`gavelhomes.com` showed as available on GoDaddy on 2026-10-09; also open: `homegavel.com`, `bidmyhouse.com`, `ownerbid.com`, `openbidhomes.com`). Register it today along with the `.co` and `.app`, and run a USPTO trademark search before spending money on the brand (§12).

A clickable prototype of the product is in this folder (`pnpm dev`, see README). The bid engine in `lib/auction.ts` is production logic, not a mock, and it has tests.

---

## 1. The thesis: why now

1. **Commissions are finally out in the open.** The 2024 NAR settlement (Sitzer/Burnett) stopped sellers from offering buyer-agent pay through the MLS, and buyers now have to sign a written agreement before touring with an agent. Buyers can now *see* that they're paying an agent, and many are asking why.
2. **Buyers already do the agent's job.** About 95% of buyers start online, and most find the home they buy themselves. In the typical deal today, the agent mostly unlocks the door and handles the paperwork. Technology can do both of those things.
3. **Price discovery is broken.** Offers are blind and the seller's agent controls who hears what. An open auction with proxy bidding is a more honest way to set the price. It works for cars (Bring a Trailer, Cars & Bids), it works for collectibles (eBay), and Australia sells a large share of its homes at public auction.
4. **The pieces now exist as APIs:** phone LiDAR 3D scans, ID verification, bank and asset verification, smart locks with API access, remote online notarization (RON), e-closing, and LLMs that can answer questions grounded in a listing's documents.

**Beycome** (the reference) proves owners will sell without a listing agent. They charge a flat $99/$399/$999, rebate up to 2% to buyers, run their own title company ($99 settlement in FL) and an AI assistant ("Artur"), and operate in about 18 states. They're still a **flat-fee MLS listing service**, though: the sale itself still happens the old way, with private offers through agents. **Our wedge is the transaction itself:** open bidding, self-tours, and the full data room up front. Beycome gets you onto the MLS. We aim to replace what the MLS does.

## 2. Being honest about "wipe out realtors and the MLS"

You can't switch the MLS off on day one, and you don't need to. The plan has three stages:

| Stage | What we do with the MLS | Why |
|---|---|---|
| **Year 1: use it** | Our own brokerage puts Pro listings on the local MLS. The MLS syndicates them to Zillow, Realtor.com and Redfin, with "Bidding live on Gavel" in the remarks. | It's free traffic from the very portals we're competing with, and every buyer it brings in learns our brand. |
| **Year 2: make it optional** | Once a metro has enough verified bidders, new sellers choose "Gavel-only" (exclusive, no MLS) in exchange for a lower fee. | We get exclusive inventory, which is the moat. |
| **Year 3+: replace it** | Our own feed of verified bidders, listings, and recorded sold prices does the MLS's job (exposure, comps, cooperation) in our metros. | A network effect: sellers come for the bidders, and bidders come for the listings. |

**Agents:** we don't ban them. Buyers can bring an agent and pay that agent themselves. Sellers can offer a buyer-agent concession if they want to. We simply make the agent unnecessary. If the product is good, the share of deals with agents shrinks on its own. Being hostile to agents gets you lawsuits and MLS bans. Making them optional gets you market share.

## 3. Customers

- **Sellers (supply, the hard side):** equity-rich owners who hate the 6% (about $27K on a $450K home), mostly 35–65 years old, comfortable selling on Facebook Marketplace and eBay. Also landlords selling rentals, estate and probate sales (executors love auctions because they're defensible and fast), relocations, and divorces (where a transparent price ends fights).
- **Buyers (demand):** first-time buyers priced out by fees, investors, and move-up buyers who are tired of losing blind bidding wars. They also get a fair process: they can see the price and can't be quietly outbid.
- **Do not launch with:** new construction (builders have their own sales staff), luxury over $3M (needs a white-glove touch), or rural land.

## 4. Product: how a sale works

```
Seller lists ─▶ Capture day ─▶ "Opening soon" (3–5 days) ─▶ Live auction (5–14 days) ─▶ Winner ─▶ Contract ─▶ Escrow/title ─▶ Close
               photos, 3D,      self-tours, livestream        proxy bids, soft close     48h to sign +   7-day financing   e-close / RON
               lock, inspection open house, bidder verify     reserve, Buy Now           fund earnest    & appraisal window
```

### 4.1 Auction rules (implemented in `lib/auction.ts`; 14 tests)
- **Every bidder is verified:** photo ID plus a selfie match, and a lender pre-approval *or* bank-verified proof of funds. **Your verified amount is your bid ceiling.**
- **Proxy bidding (eBay style):** you enter a secret maximum, and the engine bids one increment at a time on your behalf. Increments are $1K under $100K, $2.5K up to $500K, $5K up to $1M, and $10K above that.
- **Soft close:** a bid in the last 5 minutes adds 5 minutes, so there's no sniping.
- **Hidden reserve:** the seller can set a minimum price. Bidders see only "reserve met / not met." When the top bidder's max reaches the reserve, the price jumps up to the reserve.
- **No-reserve auctions** are clearly badged and draw the most bidders. Push estate sales toward them.
- **Buy Now:** an optional instant-win price that disappears once the reserve is met.
- **Ties** go to the earlier bid.
- **Shill-bid prevention:** the seller and linked accounts are blocked. We match on device, payment method, address and identity, and flag anomalies (e.g., a bidder who only ever pushes the price up and never wins).
- **$2,500 bid deposit:** a card or ACH hold, not a charge. It becomes part of the earnest money if you win, and is forfeited only if you win and walk away without a contractual reason.
- **Second chance:** if the winner doesn't sign and fund within 48h, the runner-up is offered the home at their own max (the engine keeps track of the backup bidder).
- **Under the reserve:** the seller can accept, counter the high bidder, or relist.

### 4.2 Fixing the hard parts of auctioning a house
| Problem | Our fix |
|---|---|
| Buyers need an inspection | The seller provides a **pre-listing inspection** from an independent inspector the seller doesn't choose. The contract also gives a 7-day due-diligence window, but only for *undisclosed material defects*. |
| Financing falls through | Pre-approval is verified before bidding (through the lender's portal or Plaid). The contract has a financing/appraisal window. Bidders can declare an **appraisal-gap cover** when they register, and sellers see it. |
| The appraisal comes in under the bid | Same appraisal-gap mechanism. Our AVM shows a warning when bids run more than 8% over the estimate. |
| Winner's remorse or default | Bid deposit, then the second-chance offer to the backup bidder. Earnest money (3%) is due within 48h. |
| "Auction" sounds like foreclosure | Brand it as **"open bidding"** or **"live offers."** Never say "absolute sale" except on no-reserve listings. Use bright photography and normal neighborhoods. |
| Sellers fear a low price | Hidden reserve, the estimate shown on the listing, and coaching on starting bids (a low start draws more bidders, and the reserve protects the downside). |

### 4.3 "So many ways to view it yourself" (the agent replacement)
1. **Guided photo capture app.** The app walks the seller through a shot list (horizon level, lights on, no people). The $149 pro shoot is included in Pro. Edits are labeled; we don't allow fake skies or object removal that hides defects.
2. **3D walkthrough.** Captured with a phone's LiDAR (Matterport's iPhone capture, or our own Gaussian-splat pipeline later). You can measure any wall.
3. **Auto floor plan** with room dimensions, generated from the scan.
4. **Livestream open house hosted by the owner.** Viewers ask questions in chat ("open the electrical panel"). It's recorded and attached to the listing. This is also our **TikTok and Reels content engine**.
5. **Self-tours.** ID-verified buyers book a slot. A smart lock (Igloohome, Yale or Schlage with API access; or a key-safe lockbox at first) issues a one-time code for 45 minutes. The seller is notified. An exterior camera is optional; interior cameras are banned (they create wiretap and privacy risk).
6. **Video walkthrough plus drone** for houses on lots and waterfront.
7. **Data room** with the disclosure, inspection, wind-mitigation and 4-point reports (FL insurance), title commitment preview, HOA documents, permits, utility bills, flood zone and elevation certificate, and an insurance quote. These are things buyers usually only see *after* going under contract. Showing them before bidding is what makes it safe to bid without an agent.
8. **"Ask this home" AI.** An LLM answers only from that listing's documents and cites the page. If it can't answer, the question goes to the seller, and the answer is posted publicly so every bidder sees the same information (which is also a fair-housing safeguard).
9. **Neighborhood layer:** commute times, flood risk (FEMA plus First Street), walk score, noise, sun path, and school boundaries (with a "verify with the district" caveat). We never show "safety" or demographic scores, which would be a fair-housing problem.

### 4.4 Closing (where deals die, so own it)
- The winning bid automatically generates the **Gavel standard purchase contract**. It is attorney-drafted for each state (we can't use the Florida Realtors/Bar forms without a license from them). Both parties e-sign it.
- **Escrow and title** go through a partner title agency at first. We launch **Gavel Title** in month 9–12, the way Beycome did. Title is the most reliable profit center in the deal.
- **Closing tracker:** every milestone works like a flight status (earnest money received, title cleared, appraisal in, clear to close).
- **Wire-fraud protocol:** wire instructions appear *only* in the app, are confirmed by a phone call to a number on file, and never go by email. Use a verification service like CertifID. Wire fraud is the #1 real-world risk in a no-agent product.
- **RON / e-closing** where the state allows it (FL does).

## 5. Business model and unit economics

| Revenue line | Price | Notes |
|---|---|---|
| Seller: Basic | $0 | Supply growth. Self-shot photos, standard contract. |
| Seller: **Pro** | **$499** | Pro media, 3D, inspection coordination, smart lock, yard sign, optional MLS. Paid up front and *not contingent on a sale* (important for licensing, see §6). |
| Seller: Concierge | $1,499 | Human transaction coordinator, hosted livestream, attorney review. |
| Featured placement | $99–$199 | Homepage and alert boosts. |
| Title and settlement | ~$1,000–$1,800 gross margin per deal once we own Gavel Title | The biggest profit line. |
| Mortgage | Affiliate or JV lender, ~$1,500–$3,000 per funded loan | Must follow RESPA: an Affiliated Business Arrangement disclosure, and no referral fees. |
| Insurance, home warranty, moving | ~$100–$400 per deal | Through a licensed agency. |
| Buyer side | **Free** | Never charge a buyer's premium. Buyers hate it, and it kills bids. |

**Contribution per closed sale (steady state, one metro):** about $500 seller fee + $1,300 title + 30% mortgage attach × $2,500 ($750) + $200 ancillaries = **~$2,750**. Minus about $600 in variable costs (capture, inspection subsidy, TC time, payments), that's **~$2,150 contribution**.

| | Year 1 (Tampa Bay) | Year 2 (FL: 4 metros) | Year 3 (FL + TX + AZ + NC) |
|---|---|---|---|
| Listings | 600 | 3,000 | 12,000 |
| Closed sales (65% sell-through) | 390 | 1,950 | 7,800 |
| Revenue | ~$0.6M | ~$4.5M | ~$20M |
| Seller savings vs 5.5% | ~$9.6M | ~$48M | ~$190M |

The "savings delivered" number is the marketing number, so publish it live on the homepage.

## 6. Legal and licensing (do this first; it's the real barrier)

*This section is a roadmap for your lawyer, not legal advice. Every item needs to be confirmed by a licensed real estate attorney in each state.*

1. **Real estate brokerage license.** Anyone who negotiates sales or runs auctions for compensation needs one in most states. The safest structure is the one Beycome and Redfin use: **Gavel Realty, LLC** is a licensed brokerage with a **broker of record** in each state, either hired or contracted. This also gets us MLS membership. Fees tied to whether a sale happens ("success fees") almost always require a license, so we keep seller fees flat and up front.
2. **Auctioneer license.** Many states license auctioneers (FL, TX, GA, NC, TN and others). Several exempt real estate sales conducted by a licensed broker. **Get a written opinion** for each launch state before turning bidding on.
3. **Launch state: Florida.** It's a disclosure state (sold prices are public, so our AVM works), closings don't require an attorney, RON is legal, FSBO and auction volume are high, and buyers are used to wind-mitigation and 4-point reports. Its seller disclosure duty comes from case law (*Johnson v. Davis*), so collect a full disclosure form anyway. Texas is the second state, but it's a non-disclosure state (sold prices aren't public), so comps are harder. **Avoid at launch:** states that require an attorney at closing (NY, MA, GA, SC, CT, DE and others) and states with heavy auction-specific rules.
4. **RESPA Section 8:** no kickbacks for referrals to title, mortgage or insurance. Use Affiliated Business Arrangement disclosures, and pay employees no per-referral bonuses.
5. **Fair Housing Act:** no steering. Ad targeting must not use protected classes (Meta's housing ad category rules apply). Q&A answers are public to all bidders, there are no demographic overlays, and every page carries the Equal Housing Opportunity notice.
6. **Federal lead-based paint disclosure** for homes built before 1978.
7. **TCPA / CAN-SPAM:** get express written consent before texting. Outbid alerts by SMS are transactional, but marketing texts need opt-in.
8. **Privacy:** pre-approval and bank data are sensitive. Use SOC 2-ready vendors, encrypt at rest, and follow GLBA-style safeguards if we touch lending.
9. **ADA / WCAG 2.2 AA** for the website. Real estate sites are frequent targets of accessibility lawsuits.
10. **Terms:** Auction Terms of Sale, Bidder Agreement (covering the deposit, default and the second-chance offer), Seller Listing Agreement (non-contingent fee, reserve rules, shill-bidding ban), and a Self-Tour Agreement (liability, cameras).
11. **Insurance:** E&O (errors and omissions), cyber, general liability, and a crime/fidelity policy for escrow.

## 7. Go-to-market: winning one metro first

**Launch market: Tampa Bay (Hillsborough + Pinellas).** It has high volume, a large FSBO population, many retirees with equity, and investors who like auctions. Beycome is strong in FL, so our differentiation has to be the live bidding experience, not just a lower fee. *(Alternatives if you're based elsewhere: Jacksonville, Phoenix, Charlotte.)*

**Rule: get 50 listings before spending on buyers.** Buyers follow inventory.

Supply (sellers):
1. **The founder's network plus 10 "hero" listings.** Subsidize them heavily (free Pro), pick photogenic homes with no reserve or a low reserve, and document every one. The first 10 sold-by-bidding stories ("sold in 7 days, 23 bids, kept $26K") are the whole marketing plan.
2. **Expired and withdrawn MLS listings.** Owners who already failed with an agent. Reach them by direct mail (public records). Check the TCPA and Do Not Call registry before any phone calls.
3. **Estate, probate and divorce attorneys, plus CPAs.** Auctions give a defensible, documented market price, which is exactly what fiduciaries need.
4. **SEO:** pages like "sell my house without a realtor in Tampa," commission calculators, neighborhood sold-price pages, and every auction result as a public page. The `seo-intel` tooling in this repo can drive this.
5. **Yard signs with a QR code that shows the live bid**, which is a street-level ad.
6. **Landlords and small investors** (they're repeat sellers).

Demand (buyers):
1. **Livestream auction endings and open houses** on TikTok, Reels and YouTube Shorts ("this house just sold live for $X"). Real estate plus a countdown is watchable content. The `shorts` tooling in this repo can automate clips.
2. **Saved-search alerts** for "auction ending in 1 hour," "reserve just met," and "no-reserve home listed."
3. **Partner lenders** who pre-approve buyers and send them to us (lenders love buyers who are already verified).
4. **Investor lists:** local REIA groups.

**PR angle:** "The 6% is dead," with a live counter of savings delivered. Pitch every local TV station on the first no-reserve auction.

## 8. Competition

| Player | What they are | Our edge |
|---|---|---|
| **Zillow** | The biggest portal; makes money selling buyer leads to agents (Premier Agent) | Zillow's revenue *depends on agents*. It can't kill commissions without killing itself. That's the classic innovator's dilemma. |
| **Beycome** | Flat-fee MLS, buyer rebate, own title, AI assistant | They're still private offers through the MLS. We own the auction, the self-tour and the data room. |
| **Redfin** (now Rocket) / discount brokers | Agents at lower commissions | Lower than 6% is still thousands of dollars. We're a flat fee. |
| **Auction.com / Xome / Ten-X** | Foreclosure, REO and commercial auctions | That's distressed inventory. We're normal homeowners with a consumer-grade experience. |
| **Opendoor / Offerpad** | iBuyers that buy at a discount | We get sellers *market price* via competition. iBuyers charge 5–10% in spread and fees. |
| **FSBO.com / Facebook Marketplace / Craigslist** | Listings only | No verification, no contract, no closing. We handle everything after "I'm interested." |

**Moats in order:** (1) verified-bidder liquidity in each metro, (2) exclusive Gavel-only inventory, (3) owned title and closing data, (4) the sold-price and bidding dataset that makes our AVM better than Zestimate in our metros, (5) the brand as "the place homes sell in public."

## 9. Technology

**Stack** (it matches the rest of this repo, so you already know how to run it):
- **Web:** Next.js 16 (App Router) + Tailwind 4 on Vercel. **Mobile:** an Expo/React Native app in Phase 2 (capture and bidding alerts need native).
- **DB:** Postgres (Neon or Supabase) + PostGIS for parcels and map search.
- **Bid engine:** the `lib/auction.ts` rules run server-side in a **single serializable transaction with the auction row locked (`SELECT … FOR UPDATE`)**. Every bid gets an idempotency key, and an append-only `bids` ledger is the audit trail. Server time is the only clock.
- **Realtime:** Ably or Pusher (or Supabase Realtime) channels per auction for price, clock and outbid pushes. A scheduled worker closes auctions, with a re-check, because soft close moves the end time.
- **Search and map:** Mapbox GL with PostGIS; Typesense or Postgres FTS for text.
- **Identity:** Persona or Stripe Identity. **Funds:** Plaid (Assets, Auth). **Payments and deposit holds:** Stripe (manual-capture PaymentIntents for card holds; ACH for larger amounts).
- **Pre-approval verification:** start by uploading the letter and calling the lender to verify. Later, lender API partnerships.
- **Contracts:** Dropbox Sign or DocuSign API, with state templates. **Closing:** the title partner's API (e.g., Qualia) plus our own milestone tracker.
- **Media:** Mux (video and livestream), Matterport SDK at first (in-house 3D splats later), Cloudflare R2 + Images.
- **Property data:** county parcel and recorded-sale data (ATTOM or Regrid), FEMA NFHL flood, First Street, school boundary data, and Walk Score. **AVM:** gradient-boosted model on recorded sales, cross-checked against live bid data.
- **Smart locks:** Igloohome or Yale/August APIs for one-time codes. Fallback is a code-changing key safe.
- **AI:** Claude for the "Ask this home" assistant (answers come only from that listing's documents, with citations), listing-description drafts, disclosure-gap checks, and a seller copilot.
- **Notifications:** Postmark (email), Twilio (SMS with consent), and push.
- **Observability and safety:** Sentry, audit logs on every bid and state change, and anomaly detection for shill bidding.

**Core tables:** `users`, `identities` (KYC status), `buying_power` (amount, source, expires), `properties` (parcel, facts), `listings` (status, fees, MLS flag), `auctions` (start, reserve, buy_now, ends_at, soft-close settings), `bids` (ledger: bidder, max, shown amount, auto, created_at, idempotency key), `deposits` (hold id, status), `tours` (slot, lock code, audit), `documents` (data room), `questions` (public Q&A), `contracts`, `transactions` (milestones), `payouts`.

**Auction state machine:** `draft → capture → opening_soon → live → (extended)* → ended → {sold → contract → escrow → closed} | {reserve_not_met → countered | relisted} | {no_bids → relisted} | {winner_default → second_chance → contract}`.

## 10. Roadmap

| When | Milestone |
|---|---|
| **Weeks 0–4** | Form the entity, open a bank account, hire counsel, secure a broker of record and the FL brokerage license, get the auctioneer-exemption opinion, register the domain and trademark, and draft the contract and terms. **The prototype is done (this folder).** |
| **Months 1–4: MVP** | Real accounts, listing creation, media upload, map search, KYC + proof of funds, server-side bid engine + realtime, deposits, contract generation + e-sign, partner title, admin console. **Pilot: 10 subsidized hero listings.** |
| **Months 4–9** | Self-tour smart locks, livestream open houses, 3D, "Ask this home" AI, AVM, lender partner, MLS syndication for Pro, mobile app. **Goal: 50 live listings/month in Tampa Bay, 65% sell-through.** |
| **Months 9–18** | Gavel Title, Orlando, Jacksonville and South FL, Gavel-only exclusive tier, investor features (bulk bidding, watchlists). **Seed/Series A on the metrics.** |
| **Year 2–3** | Texas, Arizona, North Carolina; mortgage JV; the replacement-MLS data feed (§2). |

**KPIs to watch weekly:** listings live, sell-through rate (% of auctions that close a sale), median verified bidders per auction (target ≥5), sale price ÷ AVM (target ≥100%), days from list to contract, winner default rate (target <5%), contract-to-close rate, seller NPS, and cost to acquire a listing.

## 11. Team and budget

**Lean (bootstrap / angel, ~$350–500K for 12 months):**
- You (CEO, sales, sellers)
- 1 senior full-stack engineer + AI coding tools (this repo already builds Next apps)
- 1 contract designer (part-time)
- Broker of record (contract, ~$2–4K/month)
- 1 transaction coordinator / ops (licensed; also hosts livestreams)
- Real estate attorney on retainer (~$3–5K/month at first; ~$15–25K upfront for contracts and terms)
- Photographers and inspectors paid per job

**Faster (seed, ~$1.5–2.5M):** add 2 engineers, a growth marketer, a second TC, and a head of title/escrow.

**Monthly run-rate costs (lean):** infrastructure + APIs ~$1–2K (Vercel, DB, Mapbox, Persona, Plaid, Mux, Twilio scale with usage); insurance ~$1–2K; MLS dues ~$100–300; marketing $5–15K.

## 12. Your checklist: everything you need, in order

**This week**
- [ ] Register **gavelhomes.com** (plus `.co`, `.app`, and `bidmyhouse.com` as a redirect). Lock down social handles.
- [ ] USPTO trademark knockout search for "Gavel Homes" in classes 35/36. Check that no state real estate company already uses "Gavel."
- [ ] Book consultations with a **Florida real estate/regulatory attorney**. Bring §6 as the agenda.
- [ ] Decide on the broker of record: get your own FL broker license (it takes time: sales associate experience is required first) **or** hire or contract a licensed FL broker. The fastest path is to contract one.

**Weeks 2–4**
- [ ] Form the entities: **Gavel Homes, Inc.** (Delaware C-corp, the tech company) + **Gavel Realty, LLC** (FL brokerage), with a services agreement between them. Get EINs and bank accounts.
- [ ] Get the written auctioneer-license opinion for FL.
- [ ] Have the attorney draft the purchase contract, auction terms, bidder agreement, seller agreement and self-tour agreement.
- [ ] Get E&O, GL and cyber insurance quotes.
- [ ] Join a Tampa Bay MLS through the brokerage (needed for syndication).
- [ ] Sign the title/escrow partner. Shop 3 Tampa title agencies for a bulk rate and API access.
- [ ] Open vendor accounts: Stripe, Persona (or Stripe Identity), Plaid, Mapbox, Mux, Twilio, Postmark, ATTOM or Regrid, and a smart-lock vendor.

**Month 2+**
- [ ] Hire the engineer and build the MVP from this prototype (§10).
- [ ] Line up the 10 hero sellers (friends, family, estate attorneys).
- [ ] Build a bench of photographers and inspectors (per-job pricing).
- [ ] Set up the content engine (livestreams, TikTok, SEO pages).

## 13. Biggest risks and mitigations
1. **Not enough sellers (chicken and egg).** Mitigate with one metro only, subsidized hero listings, MLS syndication for reach, and expired-listing outreach.
2. **Licensing or auction-law misstep.** Mitigate with the brokerage structure, written opinions, and flat non-contingent fees.
3. **Low bidder counts make auctions look weak.** Mitigate with a 3–5 day "opening soon" period to build a bidder pool, coaching toward low starting bids and no reserve, and minimum marketing before an auction opens.
4. **Winner default / financing failure.** Mitigate with verified buying power, deposits, the appraisal-gap declaration, and the backup bidder.
5. **Wire fraud.** Mitigate with in-app-only instructions, call-back verification, and a CertifID-style service.
6. **Self-tour incidents (theft, squatting).** Mitigate with ID verification, one-time codes, seller approval for each tour, exterior cameras, and insurance.
7. **Industry retaliation (MLS rule changes, lawsuits).** Mitigate by keeping agents optional rather than banned, following MLS rules while we use the MLS, and documenting everything.
8. **Beycome or Zillow copying the model.** Mitigate with speed, density in each metro, the owned closing stack, and brand.

---

### What's built in this folder
- `lib/auction.ts`: the real bid engine (proxy bidding, increments, verified buying-power ceiling, shill block, soft close, hidden reserve with jump, Buy Now, tie-break, settlement with backup bidder). Tests are in `lib/auction.test.ts` (`pnpm test`).
- `/`: landing page, live auctions, the six ways to view a home, savings calculator, competitor comparison.
- `/homes`: search, filters (status, beds, price, self-tour), and a map with live price pins.
- `/homes/[id]`: photo, 3D, floor plan, livestream and neighborhood tabs; data room; "Ask this home"; self-tour booking; and a **working live bid panel** (verify → deposit → proxy bid → rival bidder → outbid alert → bid history).
- `/sell`: pricing tiers, listing wizard with reserve coaching and a FL net sheet, and the timeline.
- `/how-it-works`: every auction rule plus an FAQ.

Sample listings are fictional and live in `lib/listings.ts`.

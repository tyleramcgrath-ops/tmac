# Gavel Homes: The Plan

> **One line:** eBay for houses, launched in Palm Beach County. Owners list for a flat fee. Buyers see everything on their own (3D walkthrough, live-streamed open house, self-tour, the inspection report) and then bid in the open with verified buying power. A licensed brokerage, run by a broker with 40 years in Palm Beach County, keeps every sale compliant.

Companion documents:
- **[`PARTNER_PLAN.md`](./PARTNER_PLAN.md)**: the plan for our founding broker (Mom), covering her role, what changes for her, and her first 90 days.
- **[`INVESTOR_PLAN.md`](./INVESTOR_PLAN.md)**: the story for investors.
- **Demo:** `demo/gavel-demo.html` walks through the whole project in five minutes (seller, buyer, live auction, broker console, closing). The Next.js app in this folder is the working prototype.

This plan has no dollar figures on purpose. Fees, budgets and funding get decided later, with the founding broker and investors in the room.

---

## 1. Why now
1. **Commissions are out in the open.** The 2024 NAR settlement ended buyer-agent pay through the MLS and made buyers sign written agreements before touring. For the first time, buyers see the fee directly.
2. **Buyers already do most of the work.** Nearly every buyer starts online, and most find the home they buy themselves. In many deals today, the agent's job is to unlock the door and handle the paperwork. Technology now does both.
3. **Blind offers frustrate everyone.** Sellers wonder if they left money on the table, and buyers lose bidding wars they never saw. Open bidding with proxy bids works for cars (Bring a Trailer), collectibles (eBay), and most homes in Australia.
4. **The building blocks exist:** phone 3D scanning, ID and funds verification, smart locks with access codes, remote online notarization (legal in Florida), and AI that answers questions from a listing's own documents.

**Beycome** (the reference) proves owners will sell without a listing agent. It's still a flat-fee MLS listing, though, and the sale still happens the old way with private offers through agents. **Our wedge is the transaction itself:** open bidding, self-tours, and every document up front.

## 2. Why Palm Beach County first
Palm Beach County suits auctions better than almost anywhere in the country:

- **A large, active market:** 39 cities and towns, from Jupiter and Tequesta down to Boca Raton, with high sales volume in every price range.
- **Out-of-town buyers.** Seasonal residents and relocating buyers from the Northeast often can't fly down for every showing. 3D tours, live-streamed open houses and online bidding fit how they already buy.
- **Equity-rich retirees and estates.** Long-time owners, estate and probate sales, and downsizers want a fast, defensible, transparent price. That is exactly what an open auction provides.
- **Condos after Surfside.** Florida's milestone-inspection and reserve-study (SIRS) laws made condo buyers anxious about surprise assessments. Our data room puts the milestone report, SIRS and association budget in front of every bidder before they bid, which is a strong selling point in Palm Beach.
- **Florida law fits the model.** Florida is a disclosure state (sold prices are public, so our valuations work), closings don't require an attorney, remote online notarization is legal, and Florida's default **transaction broker** relationship (limited representation of both sides) fits a platform model naturally.
- **The founding broker's home turf.** Forty years of relationships with attorneys, title companies, inspectors, lenders, associations and past clients. No competitor can buy that.

**Start with:** West Palm Beach, Lake Worth Beach, Boynton Beach, Delray Beach, Palm Beach Gardens, Jupiter and Wellington (single-family homes, townhomes and condos at broad price points). **Later:** the island of Palm Beach and estate-level luxury, which need a white-glove version.

## 3. Being honest about "wipe out realtors and the MLS"
We don't fight the industry on day one. We make agents optional and the MLS unnecessary, in stages:

| Stage | What we do with the MLS | Why |
|---|---|---|
| **Year 1: use it** | Our brokerage lists homes on the local MLS (BeachesMLS), which feeds Zillow and Realtor.com, with "Bidding live on Gavel" in the listing. | Free reach from the portals we're competing with. Every visitor learns our name. |
| **Year 2: make it optional** | Once Palm Beach has enough verified bidders, sellers can choose to list on Gavel only. | Exclusive listings are the moat. |
| **Year 3+: replace it** | Our feed of verified bidders, listings and recorded sold prices does the MLS's job (exposure, comps, cooperation) in our markets. | A network effect: sellers come for the bidders, and bidders come for the homes. |

**Agents are welcome, not required.** Buyers can bring their own agent. Sellers can offer a buyer-agent concession if they choose. Our founding broker's licensed team becomes the expert help people *choose* to call, rather than the gatekeeper they *have* to go through. Treating agents as optional instead of as enemies keeps us out of lawsuits and MLS disputes, and it's the reason a 40-year broker can lead this with a clear conscience.

## 4. How a sale works
```
Seller lists → Capture day → "Opening soon" (3–5 days) → Live auction (5–14 days) → Winner → Contract → Escrow & title → Close
               photos, 3D,    self-tours, livestream,       proxy bids, soft close,    48h to sign    financing &       e-closing
               lock, inspection  bidders get verified       hidden reserve              and fund       appraisal window  or RON
```

### 4.1 Auction rules (built and tested in `lib/auction.ts`)
- **Every bidder is verified:** photo ID + selfie, and a lender pre-approval or bank-verified proof of funds. **Verified buying power is your bid ceiling.**
- **Proxy bidding:** enter the most you'd pay, and the system bids for you one step at a time, only as high as needed.
- **Soft close:** a bid in the last 5 minutes adds 5 minutes. No sniping.
- **Hidden reserve:** bidders see only "reserve met" or "not met." No-reserve auctions are clearly labeled and draw the most bidders.
- **Buy Now:** an optional instant-win price that disappears once the reserve is met.
- **No shill bidding:** sellers and linked accounts are blocked, and the broker console flags suspicious patterns.
- **Refundable bid deposit** (a card hold) proves bidders are serious. It becomes part of the deposit if you win and is released if you lose.
- **Backup buyer:** if the winner doesn't sign and fund escrow in 48 hours, the runner-up gets the home at their own max bid.
- **Under the reserve:** the seller can accept, counter the high bidder, or relist.

### 4.2 Solving what makes houses hard to auction
| Problem | Our answer |
|---|---|
| Buyers need an inspection | A pre-listing inspection by an independent inspector is in the data room, plus a short due-diligence window for undisclosed defects. |
| Financing falls through | Pre-approval is verified before bidding. The contract has a financing and appraisal window. Bidders can declare an appraisal-gap amount they'll cover. |
| Condo and HOA approval (very common in Palm Beach) | Association rules, the application and the approval timeline are in the data room. The contract includes the association-approval period, and bidders can pre-submit their application. |
| Winner backs out | Bid deposit, then the backup buyer. |
| "Auction" sounds like foreclosure | We call it **open bidding**, with bright photography and normal neighborhoods. "Absolute auction" appears only on no-reserve sales. |
| Sellers fear a low price | Hidden reserve, a valuation from public county sales, starting-bid coaching, and a review with the broker before going live. |

### 4.3 Seeing a home without an agent
1. **Guided photo capture**: the app walks the seller through every shot, or a pro shoots it. Edits are labeled; no fake skies or hidden cracks.
2. **3D walkthrough**: a phone LiDAR scan you can walk and measure.
3. **Auto floor plan** with room dimensions.
4. **Live-streamed open house**: the owner walks the home while viewers ask in chat ("open the electrical panel"). It's recorded, and seasonal buyers up north love it.
5. **Self-tours**: ID-verified buyers book a time slot and get a one-time smart-lock code. The owner approves and is notified. No interior cameras.
6. **Data room**: disclosure, inspection, wind-mitigation and 4-point reports, flood zone, title preview, utility bills, and for condos the milestone inspection, SIRS, budget and rules.
7. **"Ask this home" AI**: answers only from the listing's documents. Questions it can't answer go to the seller, and the answers are published for every bidder.
8. **Neighborhood**: commute, flood risk, walkability and school boundaries. No demographic or "safety" scores (that's a fair-housing issue).

### 4.4 Closing
- The winning bid generates an attorney-drafted Florida purchase contract that both parties e-sign. The broker reviews every contract.
- **Escrow and title** go through partner title companies the founding broker already trusts. Deposits go to the title company, not the brokerage, which keeps her trust-account exposure simple. An in-house title agency comes later.
- **Closing tracker**: every step works like a flight status (deposit received, title clear, appraisal in, clear to close).
- **Wire-fraud protection**: wire instructions appear only in the app and are confirmed by phone, never sent by email.

## 5. The founding broker's role (summary; full plan in `PARTNER_PLAN.md`)
- **Broker of record and co-founder.** Gavel's Florida brokerage operates under her license and supervision.
- **Compliance owner.** She approves the contract, auction terms, disclosures and fair-housing policy, and supervises every listing through the **broker console**.
- **Market maker.** Her network supplies the first sellers (estate attorneys, CPAs, past clients, associations), the vendor bench (title, inspectors, photographers, lenders), and instant credibility in local press.
- **Expert on call.** Her licensed team staffs the premium "broker-guided" option for sellers and buyers who want a professional at their side.

## 6. Business model (structure only; figures to be decided together)
- **Sellers** pay a flat listing fee in tiers: self-serve, pro media, and broker-guided. The fee is paid up front and doesn't depend on whether the home sells.
- **Buyers** pay nothing. There's never a buyer's premium.
- **Closing services**: title and settlement through partners, later an owned title agency.
- **Partner services**: mortgage, insurance, home warranty and moving, all with proper RESPA disclosures and no referral kickbacks.

## 7. Legal and licensing checklist (for our real estate attorney)
1. **Brokerage:** Gavel operates as a Florida brokerage with the founding broker as qualifying broker. Decide whether that's a new entity under her license or an affiliation with her existing firm.
2. **Auctioneer licensing:** get a written opinion on whether Florida's auctioneer law applies to online real estate auctions run by a licensed broker.
3. **Brokerage relationship:** confirm we use the transaction-broker disclosure (Florida's default) on every listing and bidder account.
4. **Escrow:** deposits held by the partner title company. Confirm FREC rules on bid-deposit holds.
5. **Contract and terms:** purchase contract, auction terms, bidder agreement, seller agreement, self-tour agreement.
6. **RESPA** (no referral payments), **Fair Housing** (no steering, careful ad targeting), **lead-paint disclosure** for homes built before 1978, **TCPA** (text consent), **ADA** website accessibility, data privacy.
7. **Insurance:** E&O, cyber, general liability, crime/fidelity.

## 8. Go-to-market in Palm Beach County
**Rule: get 50 listings before spending on buyers.** Buyers follow homes.

Sellers:
1. **Ten launch homes from the founding broker's network**: photogenic, sensibly priced, with low or no reserve. Document each one. "Sold in 7 days, 23 bids" is the marketing.
2. **Estate, probate, trust and divorce attorneys, plus CPAs and wealth managers.** Fiduciaries need a transparent, documented price. An open auction is exactly that, and she already knows these people.
3. **Condo and HOA boards.** We offer a free milestone/SIRS-ready listing package that helps the whole building's resale value.
4. **Expired listings** (owners who already tried the old way), reached by direct mail.
5. **Local SEO and yard signs** with a QR code showing the live bid.

Buyers:
1. **Live-streamed auction endings and open houses** on social video ("this Delray townhome just sold live").
2. **Seasonal and northern buyers**: alerts, 3D and remote bidding, marketed in the Northeast feeder markets.
3. **Lenders** who pre-approve buyers and send them to us.
4. **Local press**: "40-year Palm Beach broker launches home auctions."

## 9. Competition
| Player | What they are | Our edge |
|---|---|---|
| **Zillow** | A portal that makes money selling leads to agents | Its business depends on agents, so it can't remove them. |
| **Beycome** | Flat-fee MLS listing | Still private offers. We run the actual sale. |
| **Redfin / discount brokers** | Cheaper agents | Still a percentage. We're a flat fee. |
| **Auction.com / Xome** | Foreclosure and bank-owned auctions | Distressed homes. We sell normal homes with a consumer experience. |
| **Opendoor / iBuyers** | Buy at a discount | We get the seller market price through competition. |

**Moats:** verified-bidder density in Palm Beach, exclusive listings, the founding broker's relationships and reputation, owned closing data, and a sold-price and bidding dataset that sharpens our valuations.

## 10. Technology
- **Web:** Next.js + Tailwind (this repo). **Mobile:** React Native app for capture and bid alerts.
- **Database:** Postgres + PostGIS. **Bid engine:** `lib/auction.ts` running server-side in a locked transaction, with an append-only bid ledger.
- **Realtime:** a WebSocket service for live prices and outbid alerts.
- **Verification:** Persona or Stripe Identity (ID), Plaid (funds), Stripe (deposit holds).
- **Contracts and closing:** an e-sign API, the title partner's API, our milestone tracker.
- **Media:** video and livestream service, 3D capture SDK, image CDN.
- **Data:** Palm Beach County property appraiser and recorded sales, FEMA flood maps, school boundaries.
- **AI:** Claude for "Ask this home," listing drafts, disclosure-gap checks and broker-console summaries.
- **Broker console:** listing approvals, bidder verification review, flagged-bid review, contract review, escrow status. It's how a licensed broker supervises the platform.

## 11. Roadmap
| When | Milestone |
|---|---|
| **Now** | Founding broker on board. Attorney engaged. Brand and domain secured. Demo and prototype done (this folder). |
| **Phase 1 (MVP)** | Real accounts, listing creation, verified bidding, server-side auctions, contracts, partner title, broker console. **Pilot: 10 launch homes in Palm Beach County.** |
| **Phase 2** | Self-tour smart locks, livestream open houses, 3D, "Ask this home," valuations, lender partner, MLS syndication, mobile app. |
| **Phase 3** | Broward and Martin/St. Lucie counties, Gavel-only listings, in-house title, investor tools. |
| **Phase 4** | Other Florida metros, then other disclosure states. |

**Weekly scorecard:** live listings, sell-through rate, verified bidders per auction (target 5+), sale price vs. valuation, days to contract, winner default rate, seller satisfaction.

## 12. Next steps
- [ ] Walk the founding broker through the demo and `PARTNER_PLAN.md`.
- [ ] Register gavelhomes.com and run a trademark search.
- [ ] Book the Florida real estate attorney (agenda: §7).
- [ ] Decide on the brokerage structure with the founding broker.
- [ ] Pick 10 launch homes from her network.
- [ ] Share `INVESTOR_PLAN.md` and the demo with the first investors.
- [ ] Turn the prototype into the MVP (§11).

## 13. Biggest risks
1. **Too few sellers early.** Mitigate by focusing on one county, the broker's network, launch homes, and MLS reach.
2. **Licensing or auction-law misstep.** Mitigate with the broker of record, a written legal opinion, and flat up-front fees.
3. **Too few bidders.** Mitigate with the "opening soon" period, coaching toward low starting bids, and alerts.
4. **Winner default or financing failure.** Mitigate with verified buying power, deposits, appraisal-gap declarations, and the backup buyer.
5. **Wire fraud.** Mitigate with in-app-only instructions and phone verification.
6. **Industry pushback.** Mitigate by keeping agents optional rather than banned, following MLS rules, and leaning on a respected broker's reputation.

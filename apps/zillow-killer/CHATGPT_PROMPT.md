You are a senior product designer, marketplace strategist and software architect. Design the complete website, product and business model for **Gavel Homes**, a real estate marketplace I'm launching. Be specific and concrete. Don't give me generic advice.

## The concept
Gavel Homes is "eBay for houses." Homeowners list their homes for a flat fee instead of paying a 5–6% commission. Buyers see everything on their own and then bid in an open, live online auction with verified buying power. The goal is to make listing agents and the MLS unnecessary over time. Agents are welcome but optional; nobody is forced to pay one.

Reference competitor: beycome.com (flat-fee MLS listing, buyer rebates, own title company, AI assistant). Gavel goes further by running the sale itself as open bidding.

## Launch market and team
- **Market:** Palm Beach County, Florida (West Palm Beach, Delray Beach, Boca Raton, Jupiter, Palm Beach Gardens, Lake Worth Beach, Boynton Beach, Wellington). It has many seasonal and out-of-state buyers, estates and trusts, and a large condo market affected by Florida's post-Surfside milestone-inspection and reserve-study (SIRS) laws.
- **Founding broker:** my mother, a licensed Florida broker with 40 years in Palm Beach County. She is broker of record and co-founder. Gavel operates as a licensed Florida brokerage using the transaction-broker relationship. She supervises every listing, flagged bid and contract through a **broker console**.
- **Year 1:** list on the local MLS (BeachesMLS) for reach. **Year 2:** offer Gavel-only exclusive listings. **Year 3+:** our verified-bidder network replaces the MLS in our markets.

## Auction rules (already built and tested; design around them)
- Every bidder verifies identity (photo ID + selfie) and buying power (lender pre-approval or bank-verified proof of funds). **Verified buying power is the bid ceiling.**
- Proxy bidding: the bidder enters a secret max, and the system bids one increment at a time. Increments: $1K under $100K, $2.5K to $500K, $5K to $1M, $10K above.
- Soft close: a bid in the last 5 minutes extends the auction 5 minutes.
- Optional hidden reserve (bidders only see "met / not met"); no-reserve auctions are clearly labeled. When a leader's max reaches the reserve, the price jumps to the reserve.
- Optional Buy Now price that disappears once the reserve is met.
- Ties go to the earlier bid. Sellers and linked accounts are blocked from bidding.
- Refundable bid deposit (card hold).
- If the winner doesn't sign and fund escrow within 48 hours, the runner-up is offered the home at their own max (backup buyer).
- Below reserve: the seller can accept, counter the high bidder, or relist.
- The contract has a short due-diligence window (for undisclosed defects only), a financing/appraisal window, an optional appraisal-gap declaration, and a condo/HOA association-approval period.

## Ways buyers see a home without an agent
Guided or pro photography (edits labeled, no deceptive edits), 3D LiDAR walkthrough, auto floor plan with dimensions, owner-hosted livestream open house with live Q&A (recorded), ID-verified self-tours with one-time smart-lock codes, a data room (disclosure, pre-listing inspection, wind-mitigation and 4-point reports, flood zone, title preview, utility bills; for condos: milestone inspection, SIRS, budget, rules), an "Ask this home" AI that answers only from the listing's documents (unanswered questions go to the seller and answers are published for all bidders), and neighborhood data (commute, flood risk, walkability, school boundaries; no demographic or "safety" scores, for fair-housing reasons).

## Closing
The winning bid auto-generates an attorney-drafted Florida contract, e-signed by both parties and reviewed by the broker. Escrow and title go through partner title companies (deposits never sit in the brokerage trust account). Closing is shown as a milestone tracker. Remote online notarization is available. Wire instructions appear only in-app and are confirmed by phone.

## What I need from you
Deliver all of the following, in this order, with clear headings:

1. **Brand and positioning:** brand personality, tagline options, voice guidelines, and how to avoid "foreclosure auction" connotations (we say "open bidding").
2. **Design system:** color palette (light and dark), typography pairing, spacing scale, radius/shadow rules, iconography, and component list (listing card, live bid panel, countdown, reserve badge, verification stepper, data-room list, milestone tracker, map pin, broker-console table rows, alerts/toasts). Describe each component's states.
3. **Sitemap and every page/screen**, with layout and content for each:
   - Public: home, search (map + list + filters), listing detail, live auction view, how bidding works, sell landing page, pricing, about/founding broker, FAQ, legal pages.
   - Buyer: sign-up, verification flow, saved searches and alerts, watchlist, my bids, self-tour booking, livestream viewer, contract signing, closing tracker.
   - Seller: listing wizard (address → valuation → starting bid/reserve → auction dates → capture scheduling → disclosures → review), seller dashboard (live bids, bidders' verified buying power, questions to answer, tour approvals), accept/counter flow, closing tracker.
   - Broker console: approval queue, fair-housing language checks, flagged-bid review (shill patterns), contract sign-off, escrow and deposit status, audit log.
   - Admin/ops: capture scheduling, vendor management (photographers, inspectors, title), support.
   - Mobile app: which flows go native (capture, bid alerts, self-tour unlock).
4. **Key user journeys** as step-by-step flows: a seller lists and sells; a northern buyer verifies, tours remotely and wins; a buyer is outbid in the final minute; a winner defaults and the backup buyer takes over; a condo sale with association approval; the broker's daily review.
5. **Data model:** every entity with fields, types and relationships (users, identities/KYC, buying_power, properties, listings, auctions, bids ledger, deposits, tours, documents, questions, contracts, transactions/milestones, vendors, broker reviews, audit log), plus the auction and listing state machines.
6. **Technical architecture:** Next.js + Tailwind front end, Postgres + PostGIS, a server-side bid engine in a locked transaction with an append-only bid ledger, realtime updates over WebSockets, identity/funds/payment providers, e-signature, title partner integration, media (video, livestream, 3D), maps, AI assistant, notifications, security and compliance (RESPA, Fair Housing, TCPA, ADA/WCAG 2.2 AA, data privacy).
7. **Business model:** propose seller fee tiers (self-serve, pro media, broker-guided), why buyers should never pay a fee, closing-services and partner-services revenue that stays RESPA-compliant, and the metrics that prove the model (sell-through rate, verified bidders per auction, sale price vs. valuation, days to contract, default rate).
8. **Go-to-market for Palm Beach County:** 10 launch homes from the broker's network; estate/probate attorneys, CPAs and condo boards as channels; livestream and social-video content; reaching seasonal Northeast buyers.
9. **Risks and mitigations:** licensing and auction law, low bidder counts, financing failures, wire fraud, self-tour safety, industry pushback.
10. **A phased build plan:** MVP scope vs. later phases, with the order to build screens and features.

Present page designs as detailed written wireframes (sections top to bottom, components, copy examples). Use real Palm Beach County examples (e.g., a 3-bed 1950s block home in Flamingo Park, West Palm Beach; a 1925 cottage in Del-Ida Park, Delray Beach; an oceanfront condo in Boca Raton). Where Florida law matters, say what a Florida real estate attorney should confirm. Don't treat it as settled.

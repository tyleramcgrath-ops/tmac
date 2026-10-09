import { Logo } from "./site-header";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t bg-surface">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 text-sm text-ink-dim sm:grid-cols-[2fr_1fr_1fr] sm:px-6">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-sm">
            Homes sold by their owners, bought by verified bidders. Flat fees, open bids, every document up front.
          </p>
          <p className="text-xs text-ink-mute">
            Prototype. Sample listings are fictional. Gavel Homes will operate through a licensed real estate brokerage
            in each state it serves. Equal Housing Opportunity.
          </p>
        </div>
        <div className="space-y-2">
          <p className="font-semibold text-ink">Buyers</p>
          <p>Live auctions</p>
          <p>Self-tours</p>
          <p>Get verified to bid</p>
        </div>
        <div className="space-y-2">
          <p className="font-semibold text-ink">Sellers</p>
          <p>Flat-fee listing</p>
          <p>Photo + 3D capture</p>
          <p>Net sheet</p>
        </div>
      </div>
    </footer>
  );
}

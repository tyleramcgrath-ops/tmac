import { ListingWizard } from "@/components/listing-wizard";

export const metadata = { title: "Sell your home by auction for a flat fee — Gavel" };

const tiers = [
  {
    name: "Basic",
    price: "$0",
    note: "pay nothing unless you want more",
    items: ["Listing + live auction on Gavel", "Guided phone photo capture", "Seller disclosure + data room", "Standard contract & e-sign"],
  },
  {
    name: "Pro",
    price: "$499",
    note: "most sellers pick this",
    featured: true,
    items: [
      "Everything in Basic",
      "Pro photos, 3D scan + floor plan",
      "Pre-listing inspection (we schedule it)",
      "Smart lock + self-tour scheduling",
      "Yard sign with live-bid QR code",
      "Listed on the MLS → Zillow, Realtor.com*",
    ],
  },
  {
    name: "Concierge",
    price: "$1,499",
    note: "a human runs it with you",
    items: ["Everything in Pro", "Dedicated transaction coordinator", "Livestream open house hosted for you", "Reserve-price strategy session", "Attorney contract review (1 hr)"],
  },
];

export default function SellPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
      <h1 className="font-display text-5xl font-semibold tracking-tight">Sell to the highest bidder.</h1>
      <p className="mt-3 max-w-2xl text-lg text-ink-dim">
        Flat fee. Buyers compete in the open, so you see exactly what the market will pay. You approve the reserve, the
        dates, and every self-tour.
      </p>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {tiers.map((t) => (
          <div key={t.name} className={`card p-6 ${t.featured ? "ring-2 ring-accent" : ""}`}>
            <p className="text-sm font-semibold uppercase tracking-wide text-ink-dim">{t.name}</p>
            <p className="mt-2 font-mono text-4xl font-semibold">{t.price}</p>
            <p className="text-sm text-ink-mute">{t.note}</p>
            <ul className="mt-5 space-y-2 text-sm">
              {t.items.map((i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-live">✓</span> {i}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-mute">
        *MLS syndication is optional and runs through our brokerage. Buyers who bring their own agent pay that agent
        themselves unless you choose to offer a concession. Fees are paid up front and are not contingent on a sale.
      </p>

      <div className="mt-16 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <ListingWizard />
        <div className="space-y-4 text-sm text-ink-dim">
          <h2 className="font-display text-2xl font-semibold text-ink">What happens after you list</h2>
          {[
            ["Day 0", "Capture visit: photos, 3D scan, smart lock install. Inspection booked."],
            ["Days 1–3", "Listing goes public as “bidding opens soon.” Buyers get verified, self-tour, and join your live open house."],
            ["Days 4–10", "Auction runs. You watch bids and verified buying power live. Soft close prevents last-second sniping."],
            ["Close", "You accept the winner (or counter if under reserve). Contract auto-signed, earnest money to escrow, title opens. Typical close: 21–30 days."],
          ].map(([d, t]) => (
            <div key={d} className="card flex gap-4 p-4">
              <p className="w-20 shrink-0 font-mono font-semibold text-accent">{d}</p>
              <p>{t}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

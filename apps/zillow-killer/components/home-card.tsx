import Link from "next/link";
import { type Listing, usd } from "@/lib/listings";
import { displayPrice } from "@/lib/seed";
import { HouseArt } from "./house-art";
import { Countdown } from "./countdown";

export function StatusPill({ listing }: { listing: Listing }) {
  if (listing.status === "sold")
    return <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-white">Sold</span>;
  if (listing.status === "upcoming")
    return <span className="rounded-full bg-navy px-2.5 py-1 text-xs font-semibold text-white">Bidding opens soon</span>;
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-live">
      <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-live" /> Live auction
    </span>
  );
}

export function HomeCard({ listing }: { listing: Listing }) {
  const shown = displayPrice(listing);
  return (
    <Link href={`/homes/${listing.id}`} className="card group block overflow-hidden transition hover:-translate-y-0.5">
      <div className="relative aspect-[16/10] overflow-hidden">
        <HouseArt listing={listing} className="h-full w-full transition duration-500 group-hover:scale-[1.03]" />
        <div className="absolute left-3 top-3">
          <StatusPill listing={listing} />
        </div>
        {listing.reserve === null && listing.status === "live" && (
          <span className="absolute right-3 top-3 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-white">
            No reserve
          </span>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-mute">
              {listing.status === "sold" ? "Sold for" : listing.seedBids.length ? "Current bid" : "Starting bid"}
            </p>
            <p className="font-mono text-2xl font-semibold">{usd(shown)}</p>
          </div>
          {listing.status === "live" && (
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-ink-mute">Ends in</p>
              <p className="text-sm font-semibold">
                <Countdown endsInHours={listing.endsInHours} />
              </p>
            </div>
          )}
        </div>
        <div>
          <p className="font-semibold">{listing.address}</p>
          <p className="text-sm text-ink-dim">
            {listing.neighborhood}, {listing.city} · {listing.beds} bd · {listing.baths} ba · {listing.sqft.toLocaleString()} sqft
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs text-ink-dim">
          <span className="rounded-full bg-surface-2 px-2 py-0.5">{listing.seedBids.length} bidders</span>
          <span className="rounded-full bg-surface-2 px-2 py-0.5">{listing.watchers} watching</span>
          {listing.selfTour && <span className="rounded-full bg-surface-2 px-2 py-0.5">Self-tour</span>}
        </div>
      </div>
    </Link>
  );
}

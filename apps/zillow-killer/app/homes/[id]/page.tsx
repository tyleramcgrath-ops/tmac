import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getListing, listings, usd } from "@/lib/listings";
import { Viewer } from "@/components/viewer";
import { BidPanel } from "@/components/bid-panel";
import { SelfTour } from "@/components/self-tour";
import { AskListing } from "@/components/ask-listing";
import { StatusPill } from "@/components/home-card";

export function generateStaticParams() {
  return listings.map((l) => ({ id: l.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const l = getListing(id);
  return { title: l ? `${l.address}, ${l.city} — Gavel` : "Home not found — Gavel" };
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = getListing(id);
  if (!listing) notFound();

  const facts = [
    ["Type", listing.type],
    ["Beds / baths", `${listing.beds} / ${listing.baths}`],
    ["Interior", `${listing.sqft.toLocaleString()} sqft`],
    ["Lot", listing.lotSqft ? `${listing.lotSqft.toLocaleString()} sqft` : "—"],
    ["Built", String(listing.yearBuilt)],
    ["HOA", listing.hoaMonthly ? `${usd(listing.hoaMonthly)}/mo` : "None"],
    ["Taxes", `${usd(listing.taxesYearly)}/yr`],
    ["Gavel estimate", usd(listing.estimate)],
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <StatusPill listing={listing} />
            <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-ink-dim">Sold by owner</span>
          </div>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">{listing.address}</h1>
          <p className="text-ink-dim">
            {listing.neighborhood} · {listing.city}, FL {listing.zip}
          </p>
        </div>
        <p className="text-sm text-ink-dim">{listing.watchers} people watching</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <Viewer listing={listing} />

          <section className="card p-6">
            <h2 className="font-display text-2xl font-semibold">{listing.headline}</h2>
            <p className="mt-3 text-ink-dim">{listing.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {listing.features.map((f) => (
                <span key={f} className="rounded-full bg-surface-2 px-3 py-1 text-sm">
                  {f}
                </span>
              ))}
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {facts.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs uppercase tracking-wide text-ink-mute">{k}</dt>
                  <dd className="font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-semibold">Data room</h2>
            <p className="text-sm text-ink-dim">Everything an agent would have handed you after you went under contract — before you bid.</p>
            <ul className="mt-4 divide-y">
              {listing.documents.map((d) => (
                <li key={d.name} className="flex items-center justify-between py-3 text-sm">
                  <span>
                    <span className="mr-2 rounded bg-surface-2 px-1.5 py-0.5 text-xs text-ink-dim">{d.kind}</span>
                    {d.name}
                  </span>
                  <span className="text-ink-mute">{d.pages} pp · PDF</span>
                </li>
              ))}
            </ul>
          </section>

          <AskListing listing={listing} />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <BidPanel listing={listing} />
          {listing.selfTour && listing.status !== "sold" && <SelfTour address={listing.address} />}
          <div className="rounded-2xl border border-dashed p-4 text-xs text-ink-mute">
            Winning bid becomes a purchase contract (Gavel standard &ldquo;as-is&rdquo; form with a 7-day financing/appraisal
            window). Earnest money: 3% to the escrow agent within 48 hours. Wire instructions are only ever given inside the
            app and confirmed by phone — never by email.
          </div>
        </aside>
      </div>
    </div>
  );
}

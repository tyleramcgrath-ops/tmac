"use client";

import { useMemo, useState } from "react";
import { Sparkline } from "@/components/sparkline";
import { DEFAULT_QUERY, SAMPLE_RESULTS } from "@/lib/sample-data";

const QUICK_SEARCHES = Object.keys(SAMPLE_RESULTS);

export default function PriceIntelPage() {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [submitted, setSubmitted] = useState(DEFAULT_QUERY);

  const result = useMemo(() => {
    const key = Object.keys(SAMPLE_RESULTS).find((k) =>
      submitted.toLowerCase().includes(k) || k.includes(submitted.toLowerCase())
    );
    return key ? SAMPLE_RESULTS[key] : null;
  }, [submitted]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <span className="font-mono text-[12px] uppercase tracking-wider text-accent">
        02 — Price Intelligence
      </span>
      <h1 className="font-display mt-3 text-4xl font-medium tracking-tight text-ink sm:text-5xl">
        What will it actually sell for?
      </h1>
      <p className="mt-4 max-w-2xl text-ink-dim leading-relaxed">
        Search any item and see real sold-comp data pulled from across every
        major resale platform — median price, sell-through time, and the
        trend line, before you commit to a listing price.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(query);
        }}
        className="mt-8 flex flex-col gap-3 sm:flex-row"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Levi's 501, New Balance 990, Carhartt Detroit Jacket"
          className="flex-1 rounded-xl border border-border bg-surface px-4 py-3.5 font-mono text-sm text-ink placeholder:text-ink-mute outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="rounded-xl bg-accent px-6 py-3.5 font-mono text-sm font-medium text-bg transition-transform hover:scale-[1.02]"
        >
          Get comps →
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {QUICK_SEARCHES.map((q) => (
          <button
            key={q}
            onClick={() => {
              setQuery(SAMPLE_RESULTS[q].query);
              setSubmitted(q);
            }}
            className="rounded-full border border-border-soft px-3 py-1.5 font-mono text-[12px] text-ink-mute transition-colors hover:border-accent hover:text-accent"
          >
            {SAMPLE_RESULTS[q].query}
          </button>
        ))}
      </div>

      {result ? (
        <div className="card-soft rise mt-12 rounded-2xl border border-border/70 bg-surface p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <span className="font-mono text-[12px] uppercase tracking-wider text-ink-mute">
                {result.category}
              </span>
              <h2 className="font-display mt-1 text-2xl font-medium text-ink">
                {result.query}
              </h2>
            </div>
            <div className="text-right">
              <div className="font-mono text-[12px] text-ink-mute">Suggested price</div>
              <div className="font-display text-3xl font-medium text-accent">
                ${result.suggestedPriceLow}–${result.suggestedPriceHigh}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Sparkline data={result.sparkline} positive={result.trend >= 0} />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
            <Stat label="Median sold" value={`$${result.medianSoldPrice}`} />
            <Stat
              label="30-day trend"
              value={`${result.trend >= 0 ? "+" : ""}${result.trend}%`}
              positive={result.trend >= 0}
            />
            <Stat label="Median time to sell" value={`${result.medianDaysToSell} days`} />
            <Stat label="Sample size" value={`${result.sampleSize} sales`} />
          </div>

          <div className="mt-8">
            <div className="font-mono text-[12px] uppercase tracking-wider text-ink-mute">
              Recent sales, cross-platform
            </div>
            <div className="mt-3 divide-y divide-border-soft overflow-hidden rounded-xl border border-border">
              {result.recentSales.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-3 font-mono text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-ink">{s.platform}</span>
                    <span className="rounded-full border border-border-soft px-2 py-0.5 text-[11px] text-ink-mute">
                      {s.condition}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-ink-dim">
                    <span>{s.daysAgo}d ago</span>
                    <span className="text-ink">${s.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between rounded-xl border border-accent/30 bg-accent/[0.06] px-5 py-4">
            <span className="text-sm text-ink-dim">
              Ready to list at the data-backed price?
            </span>
            <a
              href="/cross-list"
              className="font-mono text-[13px] text-accent hover:underline"
            >
              List this item →
            </a>
          </div>
        </div>
      ) : (
        <div className="mt-12 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-ink-mute">
          No comps found for &ldquo;{submitted}&rdquo; in this prototype&apos;s
          sample set — try one of the quick searches above.
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="bg-bg p-5">
      <div className="font-mono text-[11px] uppercase tracking-wider text-ink-mute">
        {label}
      </div>
      <div
        className={`font-display mt-1.5 text-xl font-medium ${
          positive === undefined ? "text-ink" : positive ? "text-accent" : "text-fall"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

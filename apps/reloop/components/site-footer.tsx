import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/80 bg-bg">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="font-display text-lg font-semibold text-ink">Reloop</div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-mute">
              The pricing &amp; distribution layer for secondhand fashion. Not
              another marketplace — the data and tools that make you better on
              all of them.
            </p>
          </div>
          <div>
            <div className="font-mono text-[12px] uppercase tracking-wider text-ink-mute">
              Product
            </div>
            <ul className="mt-4 space-y-2 text-sm text-ink-dim">
              <li><Link className="hover:text-accent" href="/price-intel">Price Intelligence</Link></li>
              <li><Link className="hover:text-accent" href="/cross-list">Cross-List</Link></li>
              <li><Link className="hover:text-accent" href="/safebuy">SafeBuy</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-mono text-[12px] uppercase tracking-wider text-ink-mute">
              Company
            </div>
            <ul className="mt-4 space-y-2 text-sm text-ink-dim">
              <li><span className="cursor-default">About</span></li>
              <li><span className="cursor-default">Careers</span></li>
              <li><span className="cursor-default">Trust &amp; Safety</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-border-soft pt-6 font-mono text-[11px] text-ink-mute sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Reloop. Prototype build — data shown is illustrative.</span>
          <span>Not affiliated with Depop, Poshmark, eBay, Vinted, Mercari, or Grailed.</span>
        </div>
      </div>
    </footer>
  );
}

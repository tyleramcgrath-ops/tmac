import Link from "next/link";

const NAV = [
  { href: "/price-intel", label: "Price Intel" },
  { href: "/cross-list", label: "Cross-List" },
  { href: "/safebuy", label: "SafeBuy" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="relative flex h-2.5 w-2.5">
            <span className="pulse-dot absolute inline-flex h-full w-full rounded-full bg-accent" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight text-ink group-hover:text-accent transition-colors">
            Reloop
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-mono text-[13px] uppercase tracking-wider text-ink-dim transition-colors hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/price-intel"
            className="hidden rounded-full border border-border px-4 py-2 font-mono text-[13px] text-ink-dim transition-colors hover:border-accent hover:text-accent sm:inline-block"
          >
            Log in
          </Link>
          <Link
            href="/cross-list"
            className="rounded-full bg-accent px-4 py-2 font-mono text-[13px] font-medium text-bg transition-transform hover:scale-[1.03]"
          >
            Start selling →
          </Link>
        </div>
      </div>
    </header>
  );
}

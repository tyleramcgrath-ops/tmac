import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="8" fill="var(--navy)" />
        <path d="M7 16 16 8l9 8v9H7z" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinejoin="round" />
        <rect x="13" y="17" width="9" height="3.4" rx="1" transform="rotate(-35 17.5 18.7)" fill="var(--accent)" />
      </svg>
      <span className="font-display text-xl font-semibold tracking-tight">Gavel</span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-1 text-sm font-medium text-ink-dim sm:gap-2">
          <Link href="/homes" className="rounded-full px-3 py-2 hover:bg-surface-2 hover:text-ink">
            Buy
          </Link>
          <Link href="/sell" className="rounded-full px-3 py-2 hover:bg-surface-2 hover:text-ink">
            Sell
          </Link>
          <Link href="/how-it-works" className="hidden rounded-full px-3 py-2 hover:bg-surface-2 hover:text-ink sm:block">
            How bidding works
          </Link>
          <Link href="/sell" className="ml-1 rounded-full bg-ink px-4 py-2 text-white hover:bg-navy">
            List your home
          </Link>
        </nav>
      </div>
    </header>
  );
}

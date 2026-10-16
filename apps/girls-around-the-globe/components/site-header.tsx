import Link from "next/link";
import { Logo } from "./logo";

const NAV = [
  { href: "/swipe", label: "Swipe" },
  { href: "/matches", label: "Matches" },
  { href: "/safety", label: "Safety" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2" aria-label="Girls Around the Globe home">
          <Logo />
          <span className="font-display text-lg font-semibold leading-none sm:text-xl">
            Girls Around the Globe
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hidden rounded-full px-3 py-2 text-ink-dim hover:bg-surface-2 hover:text-ink sm:inline-flex"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/join" className="btn btn-primary ml-1 !px-4 !py-2">
            Join free
          </Link>
        </nav>
      </div>
      <nav className="flex justify-around border-t text-sm sm:hidden">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className="flex-1 py-2 text-center text-ink-dim">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

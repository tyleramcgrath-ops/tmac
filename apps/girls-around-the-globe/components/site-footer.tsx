import Link from "next/link";
import { Wordmark } from "./logo";

export function SiteFooter() {
  return (
    <footer className="border-t bg-night">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 text-sm text-ink-dim sm:grid-cols-[1.4fr_1fr_1fr] sm:px-6">
        <div>
          <Wordmark height={64} />
          <p className="mt-4 max-w-xs">
            Serious dating for adults around the world. Respect first, and no paid arrangements, ever.
          </p>
        </div>
        <div className="flex flex-col gap-2.5">
          <Link href="/#try" className="hover:text-accent">Try it</Link>
          <Link href="/#cities" className="hover:text-accent">Cities</Link>
          <Link href="/premium" className="hover:text-accent">Globe+</Link>
          <Link href="/join" className="hover:text-accent">Create a profile</Link>
        </div>
        <div className="flex flex-col gap-2.5">
          <Link href="/safety" className="hover:text-accent">Safety center</Link>
          <Link href="/safety#guidelines" className="hover:text-accent">Community guidelines</Link>
          <Link href="/safety#report" className="hover:text-accent">Report a member</Link>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 border-t px-4 py-5 text-xs text-ink-mute sm:px-6">
        <span>© {new Date().getFullYear()} Girls Around the Globe · Adults 18+ only</span>
        <span>Photos on our marketing pages show models.</span>
      </div>
    </footer>
  );
}

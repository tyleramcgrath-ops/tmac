import Link from "next/link";
import { Wordmark } from "./logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm text-ink-dim sm:grid-cols-3 sm:px-6">
        <div>
          <Wordmark height={44} />
          <p className="mt-3 max-w-xs">
            Swipe the world and video chat tonight. Adults 18+ only. Consent first, and no paid
            arrangements, ever.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Link href="/swipe" className="hover:text-ink">Swipe</Link>
          <Link href="/premium" className="hover:text-ink">Globe+</Link>
          <Link href="/join" className="hover:text-ink">Create a profile</Link>
        </div>
        <div className="flex flex-col gap-2">
          <Link href="/safety" className="hover:text-ink">Safety center</Link>
          <Link href="/safety#guidelines" className="hover:text-ink">Community guidelines</Link>
          <Link href="/safety#report" className="hover:text-ink">Report a member</Link>
        </div>
      </div>
      <p className="border-t px-4 py-4 text-center text-xs text-ink-mute">
        © {new Date().getFullYear()} Girls Around the Globe · Adults 18+ only
      </p>
    </footer>
  );
}

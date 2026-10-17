import Link from "next/link";
import { logout } from "@/app/actions";
import { getMember } from "@/lib/members";
import { sessionUserId } from "@/lib/session";
import { Avatar } from "./avatar";
import { IncomingCall } from "./incoming-call";
import { Logo } from "./logo";

const APP_NAV = [
  { href: "/swipe", label: "Swipe" },
  { href: "/likes", label: "Likes" },
  { href: "/matches", label: "Chats" },
];

export async function SiteHeader() {
  const id = await sessionUserId();
  const me = id ? await getMember(id) : null;

  return (
    <header className="sticky top-0 z-30 border-b bg-bg/85 backdrop-blur">
      {me && <IncomingCall />}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href={me ? "/swipe" : "/"} className="flex items-center gap-2" aria-label="Girls Around the Globe home">
          <Logo size={44} priority />
        </Link>

        {me ? (
          <nav className="flex items-center gap-1 text-sm">
            {APP_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hidden rounded-full px-3 py-2 text-ink-dim hover:bg-surface-2 hover:text-ink sm:inline-flex"
              >
                {item.label}
              </Link>
            ))}
            {me.premium ? (
              <Link href="/premium" className="chip !bg-transparent border border-gold/60 !text-gold">Globe+</Link>
            ) : (
              <Link href="/premium" className="chip bg-gold !text-on-accent font-semibold">Get Globe+</Link>
            )}
            <Link href="/me" className="ml-1" aria-label="Your profile">
              <Avatar profile={me} size="sm" className="!h-9 !w-9 ring-1 ring-accent/60" />
            </Link>
            <form action={logout} className="hidden sm:block">
              <button type="submit" className="rounded-full px-3 py-2 text-ink-mute hover:text-ink">Log out</button>
            </form>
          </nav>
        ) : (
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/#try" className="hidden rounded-full px-3 py-2 text-ink-dim hover:text-accent sm:inline-flex">
              Try it
            </Link>
            <Link href="/#cities" className="hidden rounded-full px-3 py-2 text-ink-dim hover:text-accent md:inline-flex">
              Cities
            </Link>
            <Link href="/safety" className="hidden rounded-full px-3 py-2 text-ink-dim hover:text-accent sm:inline-flex">
              Safety
            </Link>
            <Link href="/login" className="rounded-full px-3 py-2 text-ink-dim hover:bg-surface-2 hover:text-ink">
              Log in
            </Link>
            <Link href="/join" className="btn btn-primary !px-4 !py-2">Join free</Link>
          </nav>
        )}
      </div>
      {me && (
        <nav className="flex justify-around border-t text-sm sm:hidden">
          {APP_NAV.map((item) => (
            <Link key={item.href} href={item.href} className="flex-1 py-2 text-center text-ink-dim">
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

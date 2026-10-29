import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { ExpiresIn } from "@/components/expires-in";
import type { MatchSummary } from "@/lib/members";

export function MatchList({ matches, activeId }: { matches: MatchSummary[]; activeId?: string }) {
  const fresh = matches.filter((m) => !m.lastMessage);
  const chatting = matches.filter((m) => m.lastMessage);

  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-accent">New matches</h2>
      {fresh.length > 0 && (
        <p className="mt-1 text-xs text-ink-mute">New matches close after 24 hours if nobody says hi.</p>
      )}
      {fresh.length === 0 ? (
        <p className="mt-2 text-sm text-ink-mute">You&rsquo;ve messaged everyone 🎉</p>
      ) : (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
          {fresh.map(({ member: p, expiresAt }) => (
            <Link key={p.id} href={`/matches/${p.id}`} className="flex w-16 shrink-0 flex-col items-center gap-1 text-center text-xs">
              <Avatar profile={p} size="md" className={p.id === activeId ? "ring-2 ring-accent ring-offset-2" : ""} />
              {p.name}
              {expiresAt && <ExpiresIn at={expiresAt} />}
            </Link>
          ))}
        </div>
      )}

      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-accent">Messages</h2>
      <ul className="mt-2 divide-y">
        {chatting.length === 0 && <li className="py-3 text-sm text-ink-mute">Say hi to a new match.</li>}
        {chatting.map(({ member: p, lastMessage }) => (
          <li key={p.id}>
            <Link href={`/matches/${p.id}`} className={`flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-surface-2 ${p.id === activeId ? "bg-surface-2" : ""}`}>
              <Avatar profile={p} size="sm" />
              <span className="min-w-0">
                <span className="block font-semibold">{p.name} <span className="font-normal">{p.flag}</span></span>
                <span className="block truncate text-sm text-ink-dim">{lastMessage!.mine ? "You: " : ""}{lastMessage!.body}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

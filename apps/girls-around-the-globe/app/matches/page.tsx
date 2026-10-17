import type { Metadata } from "next";
import Link from "next/link";
import { matchesFor } from "@/lib/members";
import { requireUserId } from "@/lib/session";
import { MatchList } from "./match-list";

export const metadata: Metadata = {
  title: "Matches · Girls Around the Globe",
};

export default async function MatchesPage({ searchParams }: PageProps<"/matches">) {
  const id = await requireUserId("/matches");
  const matches = await matchesFor(id);
  const { reported } = await searchParams;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      {reported && (
        <p className="mb-6 rounded-xl bg-ok/10 px-4 py-3 text-sm text-ok">
          Thanks. Your report was sent to our team, and you won&rsquo;t see that member again.
        </p>
      )}
      {matches.length === 0 ? (
        <div className="card mx-auto max-w-md p-10 text-center">
          <p className="text-5xl">💌</p>
          <h1 className="mt-4 font-display text-3xl font-bold">No matches yet</h1>
          <p className="mt-2 text-ink-dim">When someone you liked likes you back, they&rsquo;ll show up here.</p>
          <Link href="/swipe" className="btn btn-primary mt-6">Start swiping</Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
          <MatchList matches={matches} />
          <div className="card hidden items-center justify-center p-10 text-ink-dim md:flex">
            Pick a match to start chatting.
          </div>
        </div>
      )}
    </div>
  );
}

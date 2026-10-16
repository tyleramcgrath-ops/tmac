"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/member-store";

export function ProfileActions({ id, name }: { id: string; name: string }) {
  const { matches, seen, swipe } = useStore();
  const [justMatched, setJustMatched] = useState(false);
  const matched = matches.includes(id);

  if (matched) {
    return (
      <div className="mt-4">
        {justMatched && <p className="mb-2 text-center font-semibold text-accent">It&rsquo;s a match! 💘</p>}
        <Link href={`/matches?to=${id}`} className="btn btn-primary w-full">Message {name}</Link>
      </div>
    );
  }

  if (seen.includes(id)) {
    return <p className="mt-4 text-center text-sm text-ink-mute">You&rsquo;ve already swiped on {name}.</p>;
  }

  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      <button type="button" onClick={() => swipe(id, false)} className="btn btn-ghost text-rose-500">✕ Pass</button>
      <button type="button" onClick={() => setJustMatched(swipe(id, true))} className="btn btn-primary">♥ Like</button>
    </div>
  );
}

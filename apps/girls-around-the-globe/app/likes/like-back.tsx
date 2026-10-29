"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { swipe } from "@/app/actions";

export function LikeBackButtons({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [matched, setMatched] = useState(false);
  const [busy, setBusy] = useState(false);

  if (matched) {
    return (
      <Link href={`/matches/${id}`} className="block bg-sunset py-2 text-center text-sm font-semibold text-on-accent">
        Matched! Message {name}
      </Link>
    );
  }

  const act = async (liked: boolean) => {
    setBusy(true);
    const res = await swipe(id, liked);
    setBusy(false);
    if (res.ok && res.match) setMatched(true);
    else router.refresh();
  };

  return (
    <div className="grid grid-cols-2 divide-x border-t text-sm">
      <button type="button" disabled={busy} onClick={() => act(false)} className="py-2 text-rose-500 hover:bg-surface-2" aria-label={`Pass on ${name}`}>✕</button>
      <button type="button" disabled={busy} onClick={() => act(true)} className="py-2 text-emerald-600 hover:bg-surface-2" aria-label={`Like ${name} back`}>♥</button>
    </div>
  );
}

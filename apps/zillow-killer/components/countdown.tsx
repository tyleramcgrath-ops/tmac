"use client";

import { auctionEndsAt, formatRemaining, useNow } from "@/lib/clock";

export function Countdown({ endsInHours, endsAt }: { endsInHours?: number; endsAt?: number }) {
  const now = useNow();
  if (now === null) return <span className="font-mono">—</span>;
  const end = endsAt ?? auctionEndsAt(endsInHours ?? 0);
  const left = end - now;
  return (
    <span className={`font-mono ${left < 3_600_000 && left > 0 ? "text-accent" : ""}`}>{formatRemaining(left)}</span>
  );
}

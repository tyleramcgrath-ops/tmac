"use client";

import { useEffect, useState } from "react";

// Auction end times in the sample data are relative to when the page first
// loaded, so every visit shows auctions that are actually live.
let pageLoad: number | null = null;

export function auctionEndsAt(endsInHours: number): number {
  if (pageLoad === null) pageLoad = Date.now();
  return pageLoad + endsInHours * 3_600_000;
}

/** Current time, ticking every second. null during server render. */
export function useNow(): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function formatRemaining(ms: number): string {
  if (ms <= 0) return "Closed";
  const s = Math.floor(ms / 1_000);
  const d = Math.floor(s / 86_400);
  const h = Math.floor((s % 86_400) / 3_600);
  const m = Math.floor((s % 3_600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${String(sec).padStart(2, "0")}s`;
  return `${m}m ${String(sec).padStart(2, "0")}s`;
}

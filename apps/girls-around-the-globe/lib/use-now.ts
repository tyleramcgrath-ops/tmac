"use client";

import { useSyncExternalStore } from "react";

// A shared clock for countdowns. The server renders null (its clock and the
// browser's never agree to the second), then the browser ticks every 30s.
let now: number | null = null;
const subscribers = new Set<() => void>();
let timer: number | undefined;

function subscribe(onTick: () => void) {
  subscribers.add(onTick);
  if (subscribers.size === 1) {
    // The last reading may be from long ago if nothing was listening.
    now = Date.now();
    timer = window.setInterval(() => {
      now = Date.now();
      subscribers.forEach((s) => s());
    }, 30_000);
  }
  return () => {
    subscribers.delete(onTick);
    if (subscribers.size === 0) window.clearInterval(timer);
  };
}

export function useNow(): number | null {
  return useSyncExternalStore(subscribe, () => (now ??= Date.now()), () => null);
}

// "2h 14m" / "38m" until `iso`, or null once it has passed.
export function timeLeft(iso: string, at: number): string | null {
  const ms = new Date(iso).getTime() - at;
  if (ms <= 0) return null;
  // Nearest minute, so a reading a second old doesn't show "4h 1m" for 4 hours.
  const mins = Math.max(1, Math.round(ms / 60000));
  const h = Math.floor(mins / 60);
  if (!h) return `${mins}m`;
  return mins % 60 ? `${h}h ${mins % 60}m` : `${h}h`;
}

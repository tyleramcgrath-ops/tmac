"use client";

import { timeLeft, useNow } from "@/lib/use-now";

// "⏳ 5h left" under a new match nobody has messaged yet.
export function ExpiresIn({ at }: { at: string }) {
  const now = useNow();
  const left = now === null ? null : timeLeft(at, now);
  if (!left) return null;
  const urgent = new Date(at).getTime() - (now ?? 0) < 3 * 3600_000;
  return (
    <span className={`block text-[10px] font-semibold leading-tight ${urgent ? "text-accent" : "text-ink-mute"}`}>
      ⏳ {left.split(" ")[0]}
    </span>
  );
}

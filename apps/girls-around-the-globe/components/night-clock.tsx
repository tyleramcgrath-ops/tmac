"use client";

import { useSyncExternalStore } from "react";
import { PASSPORT_CITIES } from "@/lib/profiles";
import { isNight, localTime } from "@/lib/night";

// One shared clock that ticks every 20 seconds while anything is watching it.
let current: Date | null = null;

function subscribe(onTick: () => void) {
  const timer = window.setInterval(() => {
    current = new Date();
    onTick();
  }, 20_000);
  return () => window.clearInterval(timer);
}

const getSnapshot = () => (current ??= new Date());
const getServerSnapshot = () => null;

// Live local time in each Passport city. Times only render in the browser:
// the server's clock and the visitor's would never agree to the second, and a
// mismatch breaks hydration, so the server renders placeholders.
export function NightClock({ compact = false }: { compact?: boolean }) {
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const cities = now
    ? [...PASSPORT_CITIES].sort((a, b) => Number(isNight(b.tz, now)) - Number(isNight(a.tz, now)))
    : PASSPORT_CITIES;
  const nightCount = now ? PASSPORT_CITIES.filter((c) => isNight(c.tz, now)).length : null;

  return (
    <div>
      {!compact && (
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink-mute">
          <span className="live-dot" aria-hidden="true" />
          {nightCount === null ? "Checking the clocks…" : `Night out in ${nightCount} of ${PASSPORT_CITIES.length} cities right now`}
        </p>
      )}
      <ul className={compact ? "flex gap-2 overflow-x-auto pb-1" : "grid grid-cols-2 gap-2 sm:grid-cols-4"}>
        {cities.map((c) => {
          const night = now ? isNight(c.tz, now) : false;
          return (
            <li
              key={c.city}
              className={`flex shrink-0 items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm transition-colors ${
                night ? "border-accent/50 bg-accent-soft" : "bg-surface/60 opacity-70"
              }`}
            >
              <span className="whitespace-nowrap">
                {c.flag} {c.city}
              </span>
              <span className={`whitespace-nowrap font-mono text-xs tabular-nums ${night ? "text-accent-deep" : "text-ink-mute"}`}>
                {now ? `${night ? "🌙 " : ""}${localTime(c.tz, now)}` : "--:--"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

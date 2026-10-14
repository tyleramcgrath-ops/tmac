"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { listings, usdShort } from "@/lib/listings";
import { displayPrice } from "@/lib/seed";
import { HomeCard } from "./home-card";

type StatusFilter = "all" | "live" | "upcoming" | "sold";

export function HomeSearch() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [beds, setBeds] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [selfTour, setSelfTour] = useState(false);
  const [hover, setHover] = useState<string | null>(null);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return listings.filter((l) => {
      if (needle && ![l.address, l.city, l.zip, l.neighborhood].some((f) => f.toLowerCase().includes(needle))) return false;
      if (status !== "all" && l.status !== status) return false;
      if (beds && l.beds < beds) return false;
      if (maxPrice && displayPrice(l) > maxPrice) return false;
      if (selfTour && !l.selfTour) return false;
      return true;
    });
  }, [q, status, beds, maxPrice, selfTour]);

  const select = "rounded-full border bg-surface px-3 py-2 text-sm";
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="City, neighborhood, or ZIP"
          className="min-w-56 flex-1 rounded-full border bg-surface px-4 py-2 text-sm outline-none focus:border-ink"
        />
        <select className={select} value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
          <option value="all">All auctions</option>
          <option value="live">Live now</option>
          <option value="upcoming">Opening soon</option>
          <option value="sold">Recently sold</option>
        </select>
        <select className={select} value={beds} onChange={(e) => setBeds(Number(e.target.value))}>
          <option value={0}>Any beds</option>
          {[2, 3, 4].map((b) => (
            <option key={b} value={b}>
              {b}+ beds
            </option>
          ))}
        </select>
        <select className={select} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))}>
          <option value={0}>Any price</option>
          {[450_000, 600_000, 800_000, 1_000_000].map((p) => (
            <option key={p} value={p}>
              Under {usdShort(p)}
            </option>
          ))}
        </select>
        <label className={`${select} flex cursor-pointer items-center gap-2`}>
          <input type="checkbox" checked={selfTour} onChange={(e) => setSelfTour(e.target.checked)} /> Self-tour
        </label>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div className="card relative order-last h-[420px] overflow-hidden lg:sticky lg:top-24 lg:order-first lg:h-[calc(100vh-8rem)]">
          <BayMap />
          {results.map((l) => (
            <Link
              key={l.id}
              href={`/homes/${l.id}`}
              onMouseEnter={() => setHover(l.id)}
              onMouseLeave={() => setHover(null)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-2.5 py-1 font-mono text-xs font-semibold shadow-md transition ${
                hover === l.id ? "z-10 scale-110 bg-accent text-white" : l.status === "sold" ? "bg-ink text-white" : "bg-white text-ink"
              }`}
              style={{ left: `${l.pin.x}%`, top: `${l.pin.y}%` }}
            >
              {l.status === "live" && <span className="pulse-dot mr-1 inline-block h-1.5 w-1.5 rounded-full bg-live align-middle" />}
              {usdShort(displayPrice(l))}
            </Link>
          ))}
          <p className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs text-ink-dim">
            Palm Beach County · {results.length} homes
          </p>
        </div>
        <div>
          <p className="mb-3 text-sm text-ink-dim">
            {results.length} {results.length === 1 ? "home" : "homes"} · every listing is owner-sold with a full data room
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            {results.map((l) => (
              <div key={l.id} onMouseEnter={() => setHover(l.id)} onMouseLeave={() => setHover(null)}>
                <HomeCard listing={l} />
              </div>
            ))}
          </div>
          {results.length === 0 && (
            <div className="card p-10 text-center text-ink-dim">
              No homes match. Save this search and we&apos;ll alert you the moment one lists.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Stylized Palm Beach County coast. Production uses Mapbox vector tiles with parcel outlines.
function BayMap() {
  const towns: [string, number, number][] = [
    ["Jupiter", 46, 8],
    ["Palm Beach Gardens", 34, 25],
    ["West Palm Beach", 40, 37],
    ["Wellington", 22, 47],
    ["Lake Worth Beach", 40, 58],
    ["Boynton Beach", 42, 66],
    ["Delray Beach", 44, 79],
    ["Boca Raton", 44, 94],
  ];
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
      <rect width="100" height="100" fill="#eef0e8" />
      <path d="M76 0c-2 20 2 40 0 60s-4 30-2 40h26V0z" fill="#bcd7e6" />
      <path d="M71 4c-1 20 1 40-1 58s-2 26-1 38" stroke="#bcd7e6" strokeWidth="1.6" fill="none" />
      <path d="M0 20h76M0 45h76M0 70h76M55 0v100M30 0v100" stroke="#dfe2d6" strokeWidth="0.6" />
      <text x="84" y="50" fontSize="3" fill="#6f8ea3" transform="rotate(90 84 50)">Atlantic Ocean</text>
      {towns.map(([name, x, y]) => (
        <text key={name} x={x} y={y} fontSize="2.6" fill="#8a909c">
          {name}
        </text>
      ))}
    </svg>
  );
}

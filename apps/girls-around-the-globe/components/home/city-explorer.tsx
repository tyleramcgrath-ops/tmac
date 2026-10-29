"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { localHour, localTime } from "@/lib/night";
import { useNow } from "@/lib/use-now";

const CITIES = [
  { city: "Cartagena", country: "Colombia", tz: "America/Bogota", lang: "Spanish", date: "Rooftop cocktails over the walled old town at sunset" },
  { city: "Medellín", country: "Colombia", tz: "America/Bogota", lang: "Spanish", date: "Coffee in El Poblado, then salsa in Laureles" },
  { city: "Mexico City", country: "Mexico", tz: "America/Mexico_City", lang: "Spanish", date: "A long lunch in Roma Norte that turns into dinner" },
  { city: "Rio de Janeiro", country: "Brazil", tz: "America/Sao_Paulo", lang: "Portuguese", date: "Sunset at Arpoador, then live samba in Lapa" },
  { city: "Buenos Aires", country: "Argentina", tz: "America/Argentina/Buenos_Aires", lang: "Spanish", date: "Malbec in Palermo and a late tango lesson" },
  { city: "Lima", country: "Peru", tz: "America/Lima", lang: "Spanish", date: "Ceviche by the sea in Barranco" },
  { city: "San Juan", country: "Puerto Rico", tz: "America/Puerto_Rico", lang: "Spanish, English", date: "Walking the blue streets of Old San Juan" },
  { city: "Santo Domingo", country: "Dominican Republic", tz: "America/Santo_Domingo", lang: "Spanish", date: "Bachata night in the Zona Colonial" },
];

function mood(city: string, hour: number): string {
  if (hour >= 18 && hour < 23) return `It's evening in ${city}. The perfect time for a video date.`;
  if (hour >= 23 || hour < 6) return `It's late in ${city}. Leave her a message to wake up to.`;
  if (hour < 12) return `It's morning in ${city}. Say good morning before her coffee gets cold.`;
  return `It's afternoon in ${city}. Plan something for tonight.`;
}

// Pick a city, see her local time right now. Times render in the browser only
// (the server's clock would never match the visitor's to the minute).
export function CityExplorer() {
  const [k, setK] = useState(0);
  const now = useNow();
  const at = now ? new Date(now) : null;
  const sel = CITIES[k];

  return (
    <div className="flex flex-wrap gap-8">
      <div role="group" aria-label="Cities" className="flex w-full max-w-sm flex-[1_1_280px] flex-col gap-1">
        {CITIES.map((c, n) => (
          <button
            key={c.city}
            type="button"
            aria-pressed={n === k}
            onClick={() => setK(n)}
            className={`flex min-h-14 items-center justify-between gap-3 rounded-2xl border px-5 text-left text-base font-semibold transition ${
              n === k ? "border-accent/45 bg-accent/10 text-ink" : "border-transparent text-ink-mute hover:bg-ink/5 hover:text-ink"
            }`}
          >
            <span>{c.city}</span>
            <span className={`text-sm ${n === k ? "text-accent" : "text-ink-mute/70"}`}>{at ? localTime(c.tz, at) : "--:--"}</span>
          </button>
        ))}
      </div>

      <div key={sel.city} className="pop relative flex min-h-[460px] flex-[3_1_520px] flex-col justify-between gap-10 overflow-hidden rounded-3xl border border-accent/25 bg-[radial-gradient(circle_at_85%_15%,rgb(233_207_150/0.14),transparent_55%)] bg-bg p-8 sm:p-12">
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-10 -right-16 opacity-[0.07]">
          <Logo size={180} />
        </div>
        <div className="relative flex flex-wrap justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink-mute">{sel.country}</p>
            <p className="mt-2 font-display text-6xl leading-[0.95] sm:text-7xl">{sel.city}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink-mute">Local time now</p>
            <p className="text-gold mt-2 text-5xl font-extrabold tracking-tight" data-testid="city-time">{at ? localTime(sel.tz, at) : "--:--"}</p>
          </div>
        </div>
        <p className="relative max-w-xl font-display text-3xl italic leading-snug">
          {at ? mood(sel.city, localHour(sel.tz, at)) : `${sel.city}, ${sel.country}.`}
        </p>
        <div className="relative flex flex-wrap items-center gap-x-12 gap-y-6 border-t pt-6">
          <div>
            <p className="text-xs font-bold text-ink-mute">She speaks</p>
            <p className="mt-1 font-semibold">{sel.lang}</p>
          </div>
          <div className="min-w-0 flex-[1_1_240px]">
            <p className="text-xs font-bold text-ink-mute">Perfect first date</p>
            <p className="mt-1 font-semibold text-ink-dim">{sel.date}</p>
          </div>
          <Link href="/join" className="btn border border-ink/25 hover:border-accent hover:text-accent">Meet women in {sel.city}</Link>
        </div>
      </div>
    </div>
  );
}

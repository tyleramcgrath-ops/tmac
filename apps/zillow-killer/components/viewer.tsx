"use client";

import { useState } from "react";
import type { Listing } from "@/lib/listings";
import { HouseArt } from "./house-art";

const tabs = ["Photos", "3D walkthrough", "Floor plan", "Live & video", "Neighborhood"] as const;
type Tab = (typeof tabs)[number];

// Plan units are half-feet.
const ft = (u: number) => `${Math.round(u / 2)}'`;

export function Viewer({ listing }: { listing: Listing }) {
  const [tab, setTab] = useState<Tab>("Photos");
  const [photo, setPhoto] = useState(0);
  const shots = ["Front · day", "Front · dusk", ...listing.rooms.map((r) => r.name)];

  return (
    <div className="card overflow-hidden">
      <div className="scrollbar-thin flex gap-1 overflow-x-auto border-b p-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${
              tab === t ? "bg-ink text-white" : "text-ink-dim hover:bg-surface-2"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="relative aspect-[16/10] bg-surface-2">
        {tab === "Photos" &&
          (photo < 2 ? (
            <HouseArt listing={listing} variant={photo === 1 ? "dusk" : "exterior"} className="h-full w-full" />
          ) : (
            <RoomShot name={shots[photo]} color={listing.palette.body} />
          ))}
        {tab === "3D walkthrough" && <Dollhouse listing={listing} />}
        {tab === "Floor plan" && <FloorPlan listing={listing} />}
        {tab === "Live & video" && <LivePanel listing={listing} />}
        {tab === "Neighborhood" && (
          <div className="grid h-full grid-cols-2 gap-3 p-6 sm:p-10">
            {listing.scores.map((s) => (
              <div key={s.label} className="rounded-2xl bg-surface p-4">
                <p className="text-xs uppercase tracking-wide text-ink-mute">{s.label}</p>
                <p className="mt-1 text-lg font-semibold">{s.value}</p>
              </div>
            ))}
          </div>
        )}
        {tab === "Photos" && (
          <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
            {photo + 1} / {shots.length} · {shots[photo]} · unedited
          </span>
        )}
      </div>

      {tab === "Photos" && (
        <div className="scrollbar-thin flex gap-2 overflow-x-auto p-3">
          {shots.map((s, i) => (
            <button
              key={s}
              onClick={() => setPhoto(i)}
              className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 text-[10px] ${photo === i ? "border-accent" : "border-transparent"}`}
            >
              {i < 2 ? (
                <HouseArt listing={listing} variant={i === 1 ? "dusk" : "exterior"} className="h-full w-full" />
              ) : (
                <span className="flex h-full items-center justify-center bg-surface-2 text-ink-dim">{s}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RoomShot({ name, color }: { name: string; color: string }) {
  return (
    <svg viewBox="0 0 400 250" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="250" fill={color} />
      <path d="M0 250 80 180h240l80 70z" fill="#c9b79c" />
      <path d="M80 30h240v150H80z" fill="#fbfaf6" />
      <rect x="150" y="60" width="100" height="80" fill="#cfe4f2" stroke="#fff" strokeWidth="6" />
      <path d="M0 0l80 30v150L0 250z" fill="#00000010" />
      <path d="M400 0l-80 30v150l80 70z" fill="#00000018" />
      <text x="200" y="215" textAnchor="middle" fontSize="16" fill="#5a6070" fontFamily="sans-serif">
        {name}
      </text>
    </svg>
  );
}

function Dollhouse({ listing }: { listing: Listing }) {
  return (
    <div className="flex h-full items-center justify-center overflow-hidden" style={{ perspective: "900px" }}>
      <div className="dollhouse relative" style={{ width: 320, height: 240 }}>
        {listing.rooms.map((r, i) => (
          <div
            key={r.name}
            className="absolute flex items-center justify-center border-2 border-white text-[10px] font-semibold text-ink"
            style={{
              left: `${(r.x / 80) * 100}%`,
              top: `${(r.y / 60) * 100}%`,
              width: `${(r.w / 80) * 100}%`,
              height: `${(r.h / 60) * 100}%`,
              background: i % 2 ? "#efe7da" : "#e3eef4",
              boxShadow: "0 0 0 1px #9aa0ad inset, 0 18px 0 -2px #00000012",
              transform: "translateZ(14px)",
            }}
          >
            {r.name}
          </div>
        ))}
      </div>
      <p className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs text-ink-dim">
        Hover to pause · production uses a LiDAR scan you can walk through room by room
      </p>
    </div>
  );
}

function FloorPlan({ listing }: { listing: Listing }) {
  return (
    <svg viewBox="-4 -4 88 68" className="h-full w-full bg-white p-4">
      {listing.rooms.map((r) => (
        <g key={r.name}>
          <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="#fafaf7" stroke="#14181f" strokeWidth="0.6" />
          <text x={r.x + r.w / 2} y={r.y + r.h / 2 - 1} textAnchor="middle" fontSize="2.6" fontWeight="600" fill="#14181f">
            {r.name}
          </text>
          <text x={r.x + r.w / 2} y={r.y + r.h / 2 + 2.6} textAnchor="middle" fontSize="2" fill="#5a6070">
            {ft(r.w)} × {ft(r.h)}
          </text>
        </g>
      ))}
    </svg>
  );
}

function LivePanel({ listing }: { listing: Listing }) {
  return (
    <div className="flex h-full flex-col justify-between bg-navy p-6 text-white">
      <div className="flex items-center gap-2 text-sm">
        <span className="pulse-dot h-2 w-2 rounded-full bg-accent" /> Owner-hosted livestream open house
      </div>
      <div className="space-y-2">
        {listing.openHouses.length === 0 && <p className="text-white/70">No upcoming open houses.</p>}
        {listing.openHouses.map((o) => (
          <div key={o.label} className="flex items-center justify-between rounded-xl bg-white/10 p-3 text-sm">
            <span>{o.label}</span>
            <button className="rounded-full bg-white px-3 py-1 font-semibold text-ink">{o.live ? "Set reminder" : "RSVP"}</button>
          </div>
        ))}
        <p className="pt-2 text-xs text-white/60">
          Viewers ask questions in chat (&ldquo;show the water heater label&rdquo;). Every stream is recorded and attached to the listing.
        </p>
      </div>
    </div>
  );
}

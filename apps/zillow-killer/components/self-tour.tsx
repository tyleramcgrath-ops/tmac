"use client";

import { useState } from "react";

const slots = ["Today 5:30pm", "Tomorrow 9:00am", "Tomorrow 12:30pm", "Sat 10:00am", "Sat 3:30pm"];

export function SelfTour({ address }: { address: string }) {
  const [slot, setSlot] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);
  if (booked)
    return (
      <div className="card space-y-2 p-6">
        <p className="font-semibold">Self-tour booked · {slot}</p>
        <p className="text-sm text-ink-dim">
          Your one-time door code arrives by text 10 minutes before your window and works for 45 minutes only. The owner sees
          your verified first name. Exterior cameras record arrivals; interior cameras are not allowed.
        </p>
      </div>
    );
  return (
    <div className="card space-y-3 p-6">
      <p className="font-semibold">Tour {address} on your own</p>
      <p className="text-sm text-ink-dim">ID-verified, smart-lock entry. No agent, no appointment calls.</p>
      <div className="flex flex-wrap gap-2">
        {slots.map((s) => (
          <button
            key={s}
            onClick={() => setSlot(s)}
            className={`rounded-full border px-3 py-1.5 text-sm ${slot === s ? "border-ink bg-ink text-white" : "hover:border-ink"}`}
          >
            {s}
          </button>
        ))}
      </div>
      <button
        disabled={!slot}
        onClick={() => setBooked(true)}
        className="w-full rounded-xl bg-ink py-3 font-semibold text-white disabled:opacity-40"
      >
        Book self-tour
      </button>
    </div>
  );
}

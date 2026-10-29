"use client";

import Link from "next/link";
import { useState } from "react";
import { VIBES, VIBE_SHORT, type Vibe } from "@/lib/profiles";

const CTA: Record<Vibe, string> = {
  relationship: "Find a relationship",
  marriage: "Find your future wife",
  dating: "Start meeting women",
};

// "I'm looking for" chips in the hero. The choice changes the button and
// carries over to sign-up, so the first step of the form is already done.
export function IntentPicker() {
  const [looking, setLooking] = useState<Vibe>("relationship");
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-sm font-semibold text-ink-mute">I&rsquo;m looking for</p>
        <div role="group" aria-label="What are you looking for?" className="flex flex-wrap gap-2">
          {VIBES.map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={looking === v}
              onClick={() => setLooking(v)}
              className={`min-h-11 rounded-full border px-5 text-sm font-semibold transition ${
                looking === v
                  ? "border-ink bg-ink text-bg"
                  : "border-ink/20 bg-ink/5 text-ink-dim hover:border-accent/60 hover:text-ink"
              }`}
            >
              {VIBE_SHORT[v]}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <Link href={`/join?looking=${looking}`} className="btn btn-primary !px-8 !py-4 text-base">
          {CTA[looking]}
          <span aria-hidden="true">→</span>
        </Link>
        <Link href="#try" className="text-sm font-semibold underline-offset-4 hover:underline">
          Try a swipe first
        </Link>
      </div>
    </div>
  );
}

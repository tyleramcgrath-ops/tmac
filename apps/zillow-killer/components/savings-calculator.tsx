"use client";

import { useState } from "react";
import { usd } from "@/lib/listings";

export function SavingsCalculator() {
  const [price, setPrice] = useState(450_000);
  const commission = price * 0.055;
  const gavel = 499;
  return (
    <div className="card p-6 sm:p-8">
      <label htmlFor="price" className="text-sm font-medium text-ink-dim">
        Your home&apos;s value
      </label>
      <p className="font-mono text-4xl font-semibold">{usd(price)}</p>
      <input
        id="price"
        type="range"
        min={150_000}
        max={2_000_000}
        step={5_000}
        value={price}
        onChange={(e) => setPrice(Number(e.target.value))}
        className="mt-4 w-full accent-[var(--accent)]"
      />
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-surface-2 p-4">
          <p className="text-xs uppercase tracking-wide text-ink-mute">Typical agents (5.5%)</p>
          <p className="font-mono text-2xl font-semibold line-through decoration-accent/70">{usd(commission)}</p>
        </div>
        <div className="rounded-xl bg-navy p-4 text-white">
          <p className="text-xs uppercase tracking-wide text-white/60">Gavel Pro, flat</p>
          <p className="font-mono text-2xl font-semibold">{usd(gavel)}</p>
        </div>
      </div>
      <p className="mt-4 text-lg">
        You keep <span className="font-mono font-semibold text-live">{usd(commission - gavel)}</span> more.
      </p>
      <p className="mt-2 text-xs text-ink-mute">
        Commission rates are negotiable and vary; 5.5% is a common combined listing + buyer-agent rate. Title, taxes and
        other closing costs apply either way.
      </p>
    </div>
  );
}

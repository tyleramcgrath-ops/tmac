"use client";

import { useState } from "react";

const STEPS = [
  {
    title: "Payment held in escrow",
    detail: "Your payment is captured immediately but held by Reloop — not released to the seller yet.",
  },
  {
    title: "Item authenticated & shipped",
    detail: "Flagged categories (designer, sneakers, streetwear) get AI + human authentication before the label prints.",
  },
  {
    title: "48-hour inspection window",
    detail: "Funds stay held until you confirm the item matches the listing — or the window closes.",
  },
  {
    title: "Seller paid",
    detail: "Funds release automatically. If something's wrong, you file a claim before this step instead.",
  },
];

const POLICY = [
  { k: "Refund if not as described", v: "100%, no questions inside 48h" },
  { k: "Counterfeit found on inspection", v: "Full refund + return label paid" },
  { k: "Claim response time", v: "Under 24 hours, always human-reviewed" },
  { k: "Off-platform payment", v: "Not covered — SafeBuy only protects in-app payments" },
];

export default function SafeBuyPage() {
  const [activeStep, setActiveStep] = useState(-1);
  const [running, setRunning] = useState(false);

  function runDemo() {
    setRunning(true);
    setActiveStep(0);
    STEPS.forEach((_, i) => {
      setTimeout(() => setActiveStep(i), i * 900);
    });
    setTimeout(() => setRunning(false), STEPS.length * 900);
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <span className="font-mono text-[12px] uppercase tracking-wider text-accent">
        03 — Trust
      </span>
      <h1 className="font-display mt-3 text-4xl font-medium tracking-tight text-ink sm:text-5xl">
        SafeBuy follows the buyer, not the app.
      </h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-ink-dim">
        Every purchase made through Reloop — regardless of which underlying
        marketplace the item lives on — runs through the same escrow and
        authentication pipeline. One trust layer, everywhere you buy.
      </p>

      <div className="card-soft mt-10 rounded-2xl border border-border/70 bg-surface p-6">
        <div className="flex items-center justify-between">
          <div className="font-mono text-[12px] uppercase tracking-wider text-ink-mute">
            Escrow timeline
          </div>
          <button
            onClick={runDemo}
            disabled={running}
            className="rounded-full border border-border px-4 py-1.5 font-mono text-[12px] text-ink-dim transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
          >
            {running ? "Running…" : "Simulate a purchase ▸"}
          </button>
        </div>

        <div className="mt-6 space-y-0">
          {STEPS.map((s, i) => {
            const done = i < activeStep;
            const active = i === activeStep;
            return (
              <div key={s.title} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-[12px] transition-colors ${
                      done
                        ? "border-accent bg-accent text-bg"
                        : active
                        ? "border-accent text-accent"
                        : "border-border text-ink-mute"
                    }`}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  {i < STEPS.length - 1 && (
                    <span
                      className={`w-px flex-1 ${
                        i < activeStep ? "bg-accent" : "bg-border"
                      }`}
                      style={{ minHeight: "2.5rem" }}
                    />
                  )}
                </div>
                <div className="pb-8">
                  <div
                    className={`font-medium ${
                      done || active ? "text-ink" : "text-ink-mute"
                    }`}
                  >
                    {s.title}
                  </div>
                  <p className="mt-1 max-w-lg text-sm leading-relaxed text-ink-dim">
                    {s.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-10">
        <div className="font-mono text-[12px] uppercase tracking-wider text-accent">
          The policy, in numbers
        </div>
        <div className="card-soft mt-4 divide-y divide-border-soft overflow-hidden rounded-2xl border border-border/70">
          {POLICY.map((p) => (
            <div
              key={p.k}
              className="flex flex-col justify-between gap-1 px-5 py-4 sm:flex-row sm:items-center"
            >
              <span className="text-sm text-ink-dim">{p.k}</span>
              <span className="font-mono text-sm text-ink">{p.v}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-ink-mute">
          This page states Reloop&apos;s actual protection terms up front, on
          purpose — most resale apps bury this in a help-center article.
          Fewer surprises is the product.
        </p>
      </div>
    </div>
  );
}

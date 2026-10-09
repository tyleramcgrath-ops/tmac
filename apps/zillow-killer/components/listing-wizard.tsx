"use client";

import { useState } from "react";
import { usd } from "@/lib/listings";

const steps = ["Address", "Pricing", "Schedule", "Review"] as const;

export function ListingWizard() {
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState("");
  const [estimate, setEstimate] = useState(450_000);
  const [starting, setStarting] = useState(405_000);
  const [reserve, setReserve] = useState<number | null>(440_000);
  const [days, setDays] = useState(7);
  const [done, setDone] = useState(false);

  const titleCosts = Math.round(estimate * 0.0055 + 1_200); // owner's title policy + settlement, FL rough
  const docStamps = Math.round(estimate * 0.007); // FL doc stamps on the deed
  const gavelFee = 499;
  const net = estimate - titleCosts - docStamps - gavelFee;
  const netAgent = estimate - titleCosts - docStamps - estimate * 0.055;

  if (done)
    return (
      <div className="card space-y-3 p-8">
        <p className="font-display text-3xl font-semibold">You&apos;re on the calendar.</p>
        <p className="text-ink-dim">
          A capture specialist will call to book photos, the 3D scan and the smart-lock install. Your inspection is
          requested. Bidding opens {days === 7 ? "a week" : `${days} days`} after the listing goes live.
        </p>
      </div>
    );

  const input = "w-full rounded-xl border bg-surface px-3 py-2.5 font-mono outline-none focus:border-ink";
  return (
    <div className="card p-6 sm:p-8">
      <div className="mb-6 flex gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex-1">
            <div className={`h-1.5 rounded-full ${i <= step ? "bg-accent" : "bg-surface-2"}`} />
            <p className={`mt-1.5 text-xs ${i === step ? "font-semibold" : "text-ink-mute"}`}>{s}</p>
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium">Property address</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="4127 W San Luis St, Tampa FL" className={input.replace("font-mono ", "")} />
          <p className="text-xs text-ink-mute">We pull the parcel, tax record and recent sales to estimate value and pre-fill the listing.</p>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4 text-sm">
          <Field label="Gavel estimate (from county sales)" value={estimate} onChange={setEstimate} cls={input} />
          <Field label="Starting bid — lower draws more bidders" value={starting} onChange={setStarting} cls={input} />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={reserve !== null} onChange={(e) => setReserve(e.target.checked ? Math.round(estimate * 0.97) : null)} />
            Set a hidden reserve (you&apos;re not obligated to sell below it)
          </label>
          {reserve !== null && <Field label="Reserve" value={reserve} onChange={setReserve} cls={input} />}
          {reserve !== null && reserve > estimate * 1.05 && (
            <p className="rounded-xl bg-accent/10 p-3 text-accent-deep">
              Reserves more than 5% over the estimate usually end unmet. Consider a lower reserve and let bidding push it up.
            </p>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3 text-sm">
          <p className="font-medium">Auction length</p>
          <div className="flex gap-2">
            {[5, 7, 10, 14].map((d) => (
              <button key={d} onClick={() => setDays(d)} className={`flex-1 rounded-xl border py-3 font-semibold ${days === d ? "border-ink bg-ink text-white" : ""}`}>
                {d} days
              </button>
            ))}
          </div>
          <p className="text-ink-mute">Auctions end on a weekday evening. Any bid in the final 5 minutes adds 5 minutes.</p>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3 text-sm">
          <p className="font-medium">Estimated net sheet at the estimate</p>
          <Row k="Sale price" v={usd(estimate)} />
          <Row k="Title, settlement & owner's policy (est.)" v={`−${usd(titleCosts)}`} />
          <Row k="Florida doc stamps (0.7%)" v={`−${usd(docStamps)}`} />
          <Row k="Gavel Pro" v={`−${usd(gavelFee)}`} />
          <div className="border-t pt-2">
            <Row k="You net" v={usd(net)} bold />
            <Row k="With a 5.5% commission you'd net" v={usd(netAgent)} />
          </div>
          <p className="text-xs text-ink-mute">
            Estimate only. Excludes your mortgage payoff, prorated taxes and any repairs or concessions.{" "}
            {address && <>Listing: {address}. </>}Starting bid {usd(starting)}, {reserve ? `reserve ${usd(reserve)}` : "no reserve"}, {days}-day auction.
          </p>
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <button disabled={step === 0} onClick={() => setStep(step - 1)} className="rounded-full px-4 py-2 text-sm text-ink-dim disabled:opacity-30">
          ← Back
        </button>
        <button
          onClick={() => (step === steps.length - 1 ? setDone(true) : setStep(step + 1))}
          className="rounded-full bg-accent px-6 py-2.5 font-semibold text-white hover:bg-accent-deep"
        >
          {step === steps.length - 1 ? "List with Gavel Pro — $499" : "Continue →"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, cls }: { label: string; value: number; onChange: (n: number) => void; cls: string }) {
  return (
    <label className="block space-y-1">
      <span className="font-medium">{label}</span>
      <input inputMode="numeric" className={cls} value={value.toLocaleString("en-US")} onChange={(e) => onChange(Number(e.target.value.replace(/[^0-9]/g, "")) || 0)} />
    </label>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-base font-semibold" : "text-ink-dim"}`}>
      <span>{k}</span>
      <span className="font-mono">{v}</span>
    </div>
  );
}

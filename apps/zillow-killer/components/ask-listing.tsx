"use client";

import { useState } from "react";
import { type Listing, usd } from "@/lib/listings";

// Prototype of the listing assistant. Production answers with an LLM grounded
// only in this listing's data room, and cites the page it found the answer on.
function answer(listing: Listing, q: string): string {
  const t = q.toLowerCase();
  const score = (label: string) => listing.scores.find((s) => s.label.toLowerCase().includes(label))?.value;
  if (/flood|storm|hurricane/.test(t)) return `Flood risk: ${score("flood")}. See the wind mitigation report and any elevation certificate in the data room.`;
  if (/insur/.test(t)) return `Estimated insurance: ${score("insurance")} (based on the wind mitigation + 4-point report).`;
  if (/tax/.test(t)) return `Last year's property taxes were ${usd(listing.taxesYearly)}. Taxes can reset after a sale — Florida's Save Our Homes cap doesn't transfer to you.`;
  if (/hoa|fee/.test(t)) return listing.hoaMonthly ? `HOA is ${usd(listing.hoaMonthly)}/month. Budget and rules are in the data room.` : "No HOA.";
  if (/roof|ac|age|old|built/.test(t)) return `Built in ${listing.yearBuilt}. Notable updates: ${listing.features.join(", ")}. Exact ages are on page 3 of the inspection.`;
  if (/reserve|minimum|lowest/.test(t)) return listing.reserve === null ? "This is a no-reserve auction — the highest bid wins." : "The reserve is hidden, but the bid panel shows the moment it's met.";
  if (/school/.test(t)) return "School assignments come from the district's boundary data and are shown in the Neighborhood tab. Always confirm with the district.";
  return "I couldn't find that in the data room. Your question was sent to the owner — answers are posted publicly on the listing so every bidder sees the same information.";
}

export function AskListing({ listing }: { listing: Listing }) {
  const [q, setQ] = useState("");
  const [log, setLog] = useState<{ q: string; a: string }[]>([]);
  return (
    <div className="card space-y-3 p-6">
      <p className="font-semibold">Ask about this home</p>
      <p className="text-sm text-ink-dim">Answers come from the documents below. Unanswered questions go to the owner and are published for all bidders.</p>
      {log.map((l, i) => (
        <div key={i} className="space-y-1 text-sm">
          <p className="font-medium">{l.q}</p>
          <p className="rounded-xl bg-surface-2 p-3 text-ink-dim">{l.a}</p>
        </div>
      ))}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!q.trim()) return;
          setLog([...log, { q, a: answer(listing, q) }]);
          setQ("");
        }}
        className="flex gap-2"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="How old is the roof? What's the flood risk?"
          className="flex-1 rounded-xl border bg-surface px-3 py-2 text-sm outline-none focus:border-ink"
        />
        <button className="rounded-xl bg-ink px-4 text-sm font-semibold text-white">Ask</button>
      </form>
    </div>
  );
}

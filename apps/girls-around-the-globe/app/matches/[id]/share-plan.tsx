"use client";

import { useState } from "react";
import { sharePlanAction } from "@/app/actions";

// A private link with who you're meeting, where and when, for a friend.
export function SharePlan({ matchId, name, onClose }: { matchId: string; name: string; onClose: () => void }) {
  const [place, setPlace] = useState("");
  const [when, setWhen] = useState("");
  const [note, setNote] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    // datetime-local is the browser's local time; send it as an instant.
    const startsAt = when ? new Date(when).toISOString() : "";
    const res = await sharePlanAction(matchId, { place, startsAt, note });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setUrl(res.url);
  };

  const share = async () => {
    const text = `I'm meeting ${name}. Here's where and when:`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "My plan tonight", text, url });
        return;
      } catch {
        // Cancelled or unsupported; fall back to copying.
      }
    }
    await navigator.clipboard?.writeText(url);
    setCopied(true);
  };

  return (
    <div className="border-b bg-surface-2/60 px-4 py-4" data-testid="share-plan">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">🛡️ Share my plan</h3>
          <p className="text-xs text-ink-dim">
            Send a friend a private link with {name}&rsquo;s first name, age and city, plus where and when you&rsquo;re meeting.
            It stops working 12 hours after the meetup.
          </p>
        </div>
        <button type="button" onClick={onClose} className="text-ink-mute hover:text-ink" aria-label="Close share plan">✕</button>
      </div>

      {url ? (
        <div className="mt-3 space-y-2">
          <input readOnly value={url} className="field text-xs" aria-label="Plan link" onFocus={(e) => e.currentTarget.select()} />
          <div className="flex gap-2">
            <button type="button" onClick={share} className="btn btn-primary !py-2 text-sm">
              {copied ? "Link copied ✓" : "Send to a friend"}
            </button>
            <a href={url} target="_blank" rel="noreferrer" className="btn btn-ghost !py-2 text-sm">Preview</a>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-3 grid gap-2 sm:grid-cols-2">
          <input
            className="field"
            placeholder="Where (bar, hotel, address)"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            maxLength={140}
            required
            aria-label="Where"
          />
          <input
            className="field"
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            required
            aria-label="When"
          />
          <input
            className="field sm:col-span-2"
            placeholder="Note for your friend (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={300}
            aria-label="Note"
          />
          {error && <p className="text-xs text-accent-deep sm:col-span-2" role="alert">{error}</p>}
          <button type="submit" className="btn btn-primary !py-2 text-sm sm:col-span-2" disabled={busy}>
            {busy ? "Creating link…" : "Create private link"}
          </button>
        </form>
      )}
    </div>
  );
}

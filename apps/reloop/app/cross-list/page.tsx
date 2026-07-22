"use client";

import { useState } from "react";
import { PLATFORMS, SAMPLE_DRAFT } from "@/lib/sample-data";

type Step = "upload" | "draft" | "publish";
type PlatformStatus = "idle" | "queued" | "live";

export default function CrossListPage() {
  const [step, setStep] = useState<Step>("upload");
  const [draft, setDraft] = useState(SAMPLE_DRAFT);
  const [selected, setSelected] = useState<string[]>(PLATFORMS.map((p) => p.id));
  const [statuses, setStatuses] = useState<Record<string, PlatformStatus>>(
    Object.fromEntries(PLATFORMS.map((p) => [p.id, "idle"]))
  );
  const [publishing, setPublishing] = useState(false);

  function togglePlatform(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  function publish() {
    setPublishing(true);
    setStep("publish");
    const next: Record<string, PlatformStatus> = { ...statuses };
    selected.forEach((id) => {
      next[id] = "queued";
    });
    setStatuses(next);

    selected.forEach((id, i) => {
      setTimeout(() => {
        setStatuses((prev) => ({ ...prev, [id]: "live" }));
      }, 500 + i * 420);
    });
  }

  const allLive =
    publishing && selected.every((id) => statuses[id] === "live");

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <span className="font-mono text-[12px] uppercase tracking-wider text-accent">
        01 — Distribution
      </span>
      <h1 className="font-display mt-3 text-4xl font-medium tracking-tight text-ink sm:text-5xl">
        List once. We handle the rest.
      </h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-ink-dim">
        Upload a photo, review what the AI drafted, choose where it goes.
        Every field stays editable — nothing publishes without you seeing it
        first.
      </p>

      {/* Step indicator */}
      <div className="mt-10 flex items-center gap-2 font-mono text-[12px] text-ink-mute">
        {(["upload", "draft", "publish"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                step === s
                  ? "border-accent text-accent"
                  : "border-border text-ink-mute"
              }`}
            >
              {i + 1}
            </span>
            <span className={step === s ? "text-ink" : ""}>
              {s === "upload" ? "Photo" : s === "draft" ? "Review draft" : "Publish"}
            </span>
            {i < 2 && <span className="mx-2 text-border">—</span>}
          </div>
        ))}
      </div>

      {step === "upload" && (
        <button
          onClick={() => setStep("draft")}
          className="group mt-10 flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-8 py-20 text-center transition-colors hover:border-accent"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border-soft text-2xl text-ink-mute transition-colors group-hover:border-accent group-hover:text-accent">
            +
          </div>
          <div className="font-mono text-sm text-ink-dim">
            Click to simulate a photo upload
          </div>
          <div className="max-w-sm text-xs text-ink-mute">
            In the full product, this scans the photo, detects brand/category/condition,
            and drafts the listing below in seconds.
          </div>
        </button>
      )}

      {step !== "upload" && (
        <div className="mt-10 grid gap-8 lg:grid-cols-5">
          <div className="card-soft rounded-2xl border border-border/70 bg-surface p-6 lg:col-span-2">
            <div className="aspect-square rounded-xl bg-gradient-to-br from-surface-2 via-surface to-bg flex items-center justify-center border border-border-soft">
              <span className="font-mono text-[11px] text-ink-mute">
                sample photo · carhartt-detroit.jpg
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2 font-mono text-[11px] text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              AI scan complete
            </div>
          </div>

          <div className="space-y-4 lg:col-span-3">
            <Field label="Title" value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Brand" value={draft.brand} onChange={(v) => setDraft({ ...draft, brand: v })} />
              <Field label="Size" value={draft.size} onChange={(v) => setDraft({ ...draft, size: v })} />
            </div>
            <Field label="Category" value={draft.category} onChange={(v) => setDraft({ ...draft, category: v })} />
            <Field label="Condition" value={draft.condition} onChange={(v) => setDraft({ ...draft, condition: v })} />
            <div>
              <label className="font-mono text-[11px] uppercase tracking-wider text-ink-mute">
                Description
              </label>
              <textarea
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                rows={4}
                className="mt-1.5 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent/[0.06] px-4 py-3">
              <span className="font-mono text-[12px] text-ink-dim">
                Price-intel suggested price
              </span>
              <span className="font-display text-lg text-accent">${draft.suggestedPrice}</span>
            </div>

            {step === "draft" && (
              <button
                onClick={() => setStep("publish")}
                className="w-full rounded-xl bg-accent px-6 py-3 font-mono text-sm font-medium text-bg transition-transform hover:scale-[1.01]"
              >
                Looks good — choose platforms →
              </button>
            )}
          </div>
        </div>
      )}

      {step === "publish" && (
        <div className="card-soft mt-10 rounded-2xl border border-border/70 bg-surface p-6">
          <div className="font-mono text-[12px] uppercase tracking-wider text-ink-mute">
            Publish to
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {PLATFORMS.map((p) => {
              const isSelected = selected.includes(p.id);
              const status = statuses[p.id];
              return (
                <button
                  key={p.id}
                  disabled={publishing}
                  onClick={() => togglePlatform(p.id)}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3.5 text-left transition-colors ${
                    isSelected ? "border-accent/50 bg-accent/[0.05]" : "border-border"
                  } ${publishing ? "cursor-default" : "hover:border-accent/50"}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    <div>
                      <div className="font-mono text-sm text-ink">{p.name}</div>
                      <div className="font-mono text-[11px] text-ink-mute">
                        Reloop fee replaces {p.fee}
                      </div>
                    </div>
                  </div>
                  <StatusPill status={publishing ? status : isSelected ? "idle" : undefined} selected={isSelected} />
                </button>
              );
            })}
          </div>

          {!publishing ? (
            <button
              onClick={publish}
              disabled={selected.length === 0}
              className="mt-6 w-full rounded-xl bg-accent px-6 py-3.5 font-mono text-sm font-medium text-bg transition-transform hover:scale-[1.01] disabled:opacity-40"
            >
              Publish to {selected.length} platform{selected.length === 1 ? "" : "s"} →
            </button>
          ) : (
            <div className="mt-6 rounded-xl border border-border-soft px-4 py-3 text-center font-mono text-[13px] text-ink-dim">
              {allLive ? (
                <span className="text-accent">
                  ✓ Live on {selected.length} platform{selected.length === 1 ? "" : "s"}. One listing, no manual re-posting.
                </span>
              ) : (
                "Publishing…"
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="font-mono text-[11px] uppercase tracking-wider text-ink-mute">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
      />
    </div>
  );
}

function StatusPill({
  status,
  selected,
}: {
  status?: PlatformStatus;
  selected: boolean;
}) {
  if (!selected) {
    return <span className="font-mono text-[11px] text-ink-mute">off</span>;
  }
  if (status === "live") {
    return <span className="font-mono text-[11px] text-accent">● live</span>;
  }
  if (status === "queued") {
    return <span className="font-mono text-[11px] text-ink-dim">posting…</span>;
  }
  return <span className="font-mono text-[11px] text-ink-dim">queued</span>;
}

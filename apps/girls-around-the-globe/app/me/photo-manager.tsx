"use client";

/* eslint-disable @next/next/no-img-element -- photos come from our auth-gated route */

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const MAX = 6;

export function PhotoManager({ photos }: { photos: string[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    for (const file of Array.from(files).slice(0, MAX - photos.length)) {
      const body = new FormData();
      body.append("photo", file);
      const res = await fetch("/api/photos", { method: "POST", body });
      if (!res.ok) {
        const { error: message } = await res.json().catch(() => ({ error: "Upload failed." }));
        setError(message);
        break;
      }
    }
    setBusy(false);
    if (input.current) input.current.value = "";
    router.refresh();
  };

  const remove = async (url: string) => {
    setBusy(true);
    await fetch(url, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  };

  return (
    <div className="mt-4">
      <div className="grid grid-cols-3 gap-3">
        {photos.map((url, i) => (
          <div key={url} className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-surface-2">
            <img src={url} alt={`Your photo ${i + 1}`} className="h-full w-full object-cover" />
            {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">Main</span>}
            <button
              type="button"
              disabled={busy}
              onClick={() => remove(url)}
              aria-label={`Delete photo ${i + 1}`}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-night shadow hover:bg-white"
            >
              ✕
            </button>
          </div>
        ))}
        {photos.length < MAX && (
          <button
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
            className="flex aspect-[3/4] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-ink-mute hover:border-accent hover:text-accent"
          >
            <span className="text-3xl">{busy ? "…" : "+"}</span>
            <span className="text-xs">{busy ? "Uploading" : "Add photo"}</span>
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => upload(e.target.files)}
        data-testid="photo-input"
      />
      {error && <p className="mt-3 text-sm text-accent-deep" role="alert">{error}</p>}
      <p className="mt-3 text-xs text-ink-mute">JPEG, PNG or WebP, up to 4 MB each. No nudity, no one else in your main photo, and only photos of you.</p>
    </div>
  );
}

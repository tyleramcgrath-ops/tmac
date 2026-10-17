"use client";

import { startTransition, useActionState } from "react";
import { updateProfile } from "@/app/actions";
import { COUNTRIES } from "@/lib/countries";
import type { Member } from "@/lib/members";
import { VIBE_EMOJI, VIBE_LABEL, type Vibe } from "@/lib/profiles";

export function ProfileForm({ me, countryCode }: { me: Member; countryCode: string }) {
  const [state, action, pending] = useActionState(updateProfile, undefined);
  const [p1, p2] = me.prompts;

  return (
    <form
      className="mt-4 space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Bio</span>
        <textarea name="bio" defaultValue={me.bio} maxLength={300} className="field min-h-24" />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">City</span>
          <input name="city" defaultValue={me.city} required maxLength={60} className="field" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Country</span>
          <select name="country" defaultValue={countryCode} required className="field">
            <option value="" disabled>Choose…</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Show me</span>
          <select name="showMe" defaultValue={me.showMe} className="field">
            <option value="women">Women</option>
            <option value="men">Men</option>
            <option value="everyone">Everyone</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">I&rsquo;m in the mood for</span>
          <select name="vibe" defaultValue={me.vibe} className="field">
            {(Object.keys(VIBE_LABEL) as Vibe[]).map((v) => (
              <option key={v} value={v}>{VIBE_EMOJI[v]} {VIBE_LABEL[v]}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Languages</span>
          <input name="languages" defaultValue={me.languages.join(", ")} placeholder="English, Spanish" maxLength={120} className="field" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Job</span>
          <input name="occupation" defaultValue={me.occupation} maxLength={60} className="field" />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Interests</span>
        <input name="interests" defaultValue={me.interests.join(", ")} placeholder="Surfing, live music, street food" maxLength={160} className="field" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Travelling? <span className="font-normal text-ink-mute">(optional)</span></span>
        <input name="traveling" defaultValue={me.traveling ?? ""} placeholder="e.g. In Lisbon until Sunday" maxLength={80} className="field" />
      </label>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Prompts</legend>
        {[p1, p2].map((p, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1fr_2fr]">
            <input name={`q${i + 1}`} defaultValue={p?.q ?? (i === 0 ? "Ideal first meet" : "Green flag")} maxLength={80} className="field" aria-label={`Prompt ${i + 1}`} />
            <input name={`a${i + 1}`} defaultValue={p?.a ?? ""} maxLength={160} className="field" aria-label={`Answer ${i + 1}`} placeholder="Your answer" />
          </div>
        ))}
      </fieldset>

      {state?.error && <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent-deep" role="alert">{state.error}</p>}
      {state?.ok && <p className="rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok" role="status">{state.ok}</p>}
      <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : "Save profile"}</button>
    </form>
  );
}

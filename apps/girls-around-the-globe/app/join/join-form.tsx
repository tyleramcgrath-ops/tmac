"use client";

import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { signup } from "@/app/actions";
import { COUNTRIES } from "@/lib/countries";

export function JoinForm() {
  const [state, action, pending] = useActionState(signup, undefined);
  const [step, setStep] = useState(1);
  const [gender, setGender] = useState("woman");
  const [showMe, setShowMe] = useState("men");

  // Every field stays mounted (just hidden) so one submit sends them all.
  const show = (n: number) => (step === n ? "space-y-5" : "hidden");

  return (
    <form
      className="card mt-8 space-y-5 p-6 sm:p-8"
      // Submit by hand: a form `action` makes React clear every field after
      // the attempt, so one typo would wipe the whole sign-up.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <div className="flex gap-1.5" aria-label={`Step ${step} of 3`}>
        {[1, 2, 3].map((n) => (
          <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-sunset" : "bg-surface-2"}`} />
        ))}
      </div>

      <div data-step="1" className={show(1)}>
        <h2 className="font-display text-2xl font-semibold">Your account</h2>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Email</span>
          <input name="email" type="email" required className="field" autoComplete="email" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Password</span>
          <input name="password" type="password" required minLength={8} className="field" autoComplete="new-password" />
          <span className="mt-1 block text-xs text-ink-mute">At least 8 characters.</span>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">First name</span>
          <input name="name" required maxLength={40} className="field" autoComplete="given-name" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Date of birth</span>
          <input name="birthdate" type="date" required className="field" />
          <span className="mt-1 block text-xs text-ink-mute">You must be 18 or older.</span>
        </label>
      </div>

      <div data-step="2" className={show(2)}>
        <h2 className="font-display text-2xl font-semibold">Where in the world?</h2>
        <fieldset>
          <legend className="mb-1 text-sm font-semibold">I am a</legend>
          <input type="hidden" name="gender" value={gender} />
          <div className="flex flex-wrap gap-2">
            {(["woman", "man", "nonbinary"] as const).map((g) => (
              <button key={g} type="button" onClick={() => setGender(g)} aria-pressed={gender === g} className={`btn !py-2 capitalize ${gender === g ? "btn-primary" : "btn-ghost"}`}>
                {g === "nonbinary" ? "Non-binary" : g}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-1 text-sm font-semibold">Show me</legend>
          <input type="hidden" name="showMe" value={showMe} />
          <div className="flex flex-wrap gap-2">
            {(["women", "men", "everyone"] as const).map((s) => (
              <button key={s} type="button" onClick={() => setShowMe(s)} aria-pressed={showMe === s} className={`btn !py-2 capitalize ${showMe === s ? "btn-primary" : "btn-ghost"}`}>
                {s}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">City</span>
            <input name="city" required maxLength={60} className="field" placeholder="e.g. Toronto" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Country</span>
            <select name="country" required className="field" defaultValue="">
              <option value="" disabled>Choose…</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Short bio <span className="font-normal text-ink-mute">(optional)</span></span>
          <textarea name="bio" className="field min-h-24" maxLength={300} placeholder="Where you're from, where you're headed, what you're into." />
        </label>
      </div>

      <div data-step="3" className={show(3)}>
        <h2 className="font-display text-2xl font-semibold">The ground rules</h2>
        <ul className="space-y-2 text-sm text-ink-dim">
          <li>✓ I&rsquo;m 18 or older and my photos are really me.</li>
          <li>✓ Consent comes first, every time, and it can be withdrawn at any time.</li>
          <li>✓ No paid or transactional arrangements of any kind.</li>
          <li>✓ I won&rsquo;t ask anyone for money, and I&rsquo;ll report anyone who asks me.</li>
          <li>✓ I&rsquo;ll treat people from every country and culture with respect.</li>
        </ul>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="agree" className="mt-1 accent-[var(--accent)]" />
          I agree to the <Link href="/safety#guidelines" className="underline" target="_blank">community guidelines</Link>.
        </label>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent-deep" role="alert">{state.error}</p>
      )}

      <div className="flex justify-between gap-3">
        {step > 1 ? (
          <button type="button" onClick={() => setStep(step - 1)} className="btn btn-ghost">Back</button>
        ) : <span />}
        {step < 3 ? (
          <button
            key="continue"
            type="button"
            className="btn btn-primary"
            onClick={(e) => {
              // Check this step's fields before moving on.
              const fields = e.currentTarget.form?.querySelectorAll<HTMLInputElement>(`[data-step="${step}"] :is(input, select, textarea)`);
              for (const f of fields ?? []) if (!f.reportValidity()) return;
              setStep(step + 1);
            }}
          >
            Continue
          </button>
        ) : (
          // Distinct key so React doesn't reuse the Continue button mid-click.
          <button key="submit" type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Creating your profile…" : "Create my profile"}
          </button>
        )}
      </div>

      <p className="text-center text-sm text-ink-dim">
        Already a member? <Link href="/login" className="font-semibold text-accent">Log in</Link>
      </p>
    </form>
  );
}

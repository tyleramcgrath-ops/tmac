"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore, type Member } from "@/lib/member-store";

function ageFrom(dob: string): number {
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

export function JoinForm() {
  const router = useRouter();
  const { setMember } = useStore();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<Member["gender"]>("woman");
  const [showMe, setShowMe] = useState<Member["showMe"]>("men");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");

  const next = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (step === 1) {
      if (!name.trim() || !dob) return setError("Add your first name and date of birth.");
      if (ageFrom(dob) < 18) return setError("Girls Around the Globe is for adults 18 and over only.");
      return setStep(2);
    }
    if (step === 2) {
      if (!city.trim()) return setError("Add the city you live in.");
      return setStep(3);
    }
    if (!agreed) return setError("Please agree to the community guidelines to continue.");
    setMember({
      name: name.trim(),
      age: ageFrom(dob),
      gender,
      showMe,
      city: city.trim(),
      bio: bio.trim(),
      joinedAt: new Date().toISOString(),
    });
    router.push("/swipe");
  };

  return (
    <form onSubmit={next} className="card mt-8 space-y-5 p-6 sm:p-8">
      <div className="flex gap-1.5" aria-label={`Step ${step} of 3`}>
        {[1, 2, 3].map((n) => (
          <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-accent" : "bg-surface-2"}`} />
        ))}
      </div>

      {step === 1 && (
        <>
          <h2 className="font-display text-2xl font-semibold">About you</h2>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">First name</span>
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Date of birth</span>
            <input type="date" className="field" value={dob} onChange={(e) => setDob(e.target.value)} />
            <span className="mt-1 block text-xs text-ink-mute">You must be 18+. We verify age with ID before you can message.</span>
          </label>
          <fieldset>
            <legend className="mb-1 text-sm font-semibold">I am a</legend>
            <div className="flex flex-wrap gap-2">
              {(["woman", "man", "nonbinary"] as const).map((g) => (
                <button key={g} type="button" onClick={() => setGender(g)} className={`btn !py-2 capitalize ${gender === g ? "btn-primary" : "btn-ghost"}`}>
                  {g === "nonbinary" ? "Non-binary" : g}
                </button>
              ))}
            </div>
          </fieldset>
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="font-display text-2xl font-semibold">Where in the world?</h2>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">City you live in</span>
            <input className="field" placeholder="e.g. Toronto" value={city} onChange={(e) => setCity(e.target.value)} />
          </label>
          <fieldset>
            <legend className="mb-1 text-sm font-semibold">Show me</legend>
            <div className="flex flex-wrap gap-2">
              {(["women", "men", "everyone"] as const).map((s) => (
                <button key={s} type="button" onClick={() => setShowMe(s)} className={`btn !py-2 capitalize ${showMe === s ? "btn-primary" : "btn-ghost"}`}>
                  {s}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Short bio</span>
            <textarea className="field min-h-24" maxLength={300} placeholder="Where you're from, where you're headed, what you're into." value={bio} onChange={(e) => setBio(e.target.value)} />
          </label>
        </>
      )}

      {step === 3 && (
        <>
          <h2 className="font-display text-2xl font-semibold">The ground rules</h2>
          <ul className="space-y-2 text-sm text-ink-dim">
            <li>✓ I&rsquo;m 18 or older and my photos are really me.</li>
            <li>✓ Consent comes first, every time, and it can be withdrawn at any time.</li>
            <li>✓ No paid or transactional arrangements of any kind.</li>
            <li>✓ I won&rsquo;t ask anyone for money, and I&rsquo;ll report anyone who asks me.</li>
            <li>✓ I&rsquo;ll treat people from every country and culture with respect.</li>
          </ul>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 accent-[var(--accent)]" />
            I agree to the community guidelines.
          </label>
        </>
      )}

      {error && <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent-deep" role="alert">{error}</p>}

      <div className="flex justify-between gap-3">
        {step > 1 ? (
          <button type="button" onClick={() => setStep(step - 1)} className="btn btn-ghost">Back</button>
        ) : <span />}
        <button type="submit" className="btn btn-primary">{step === 3 ? "Start swiping" : "Continue"}</button>
      </div>
    </form>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { PROFILES, VIBE_EMOJI, VIBE_LABEL, getProfile } from "@/lib/profiles";
import { ProfileActions } from "./profile-actions";

export function generateStaticParams() {
  return PROFILES.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/profile/[id]">): Promise<Metadata> {
  const { id } = await params;
  const p = getProfile(id);
  return { title: p ? `${p.name}, ${p.age} · ${p.city} · Girls Around the Globe` : "Profile not found" };
}

export default async function ProfilePage({ params }: PageProps<"/profile/[id]">) {
  const { id } = await params;
  const p = getProfile(id);
  if (!p) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link href="/swipe" className="text-sm text-ink-dim hover:text-ink">← Back to swiping</Link>

      <div className="mt-6 grid gap-8 md:grid-cols-[320px_1fr]">
        <div>
          <div className="card aspect-[3/4] overflow-hidden">
            <Avatar profile={p} size="lg" />
          </div>
          <ProfileActions id={p.id} name={p.name} />
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="font-display text-4xl font-semibold">
              {p.name}, {p.age}
            </h1>
            <p className="mt-1 text-ink-dim">
              {p.flag} {p.city}, {p.country} · {p.occupation} · {p.lastActive}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {p.verified ? (
                <span className="chip !bg-ok/10 !text-ok">✓ ID & photo verified</span>
              ) : (
                <span className="chip !bg-warn/10 !text-warn">Not yet verified</span>
              )}
              <span className="chip !bg-accent-soft !text-accent-deep">
                {VIBE_EMOJI[p.vibe]} {VIBE_LABEL[p.vibe]}
              </span>
              {p.traveling && <span className="chip">✈️ {p.traveling}</span>}
            </div>
          </div>

          <section className="card p-6">
            <h2 className="font-semibold">About me</h2>
            <p className="mt-2 text-ink-dim">{p.bio}</p>
          </section>

          {p.prompts.map((pr) => (
            <section key={pr.q} className="card p-6">
              <p className="text-sm text-ink-mute">{pr.q}</p>
              <p className="mt-1 font-display text-xl">{pr.a}</p>
            </section>
          ))}

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="card p-6">
              <h2 className="font-semibold">Languages</h2>
              <p className="mt-2 text-ink-dim">{p.languages.join(", ")}</p>
            </div>
            <div className="card p-6">
              <h2 className="font-semibold">Interests</h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {p.interests.map((i) => (
                  <span key={i} className="chip">{i}</span>
                ))}
              </div>
            </div>
          </section>

          <p className="text-xs text-ink-mute">
            Something feel off about this profile?{" "}
            <Link href="/safety#report" className="underline">Report it</Link>. Reports are reviewed by a
            person, and the member isn&rsquo;t told who reported them.
          </p>
        </div>
      </div>
    </div>
  );
}

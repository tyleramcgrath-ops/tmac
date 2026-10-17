/* eslint-disable @next/next/no-img-element -- photos come from our auth-gated route */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { getMember } from "@/lib/members";
import { VIBE_EMOJI, VIBE_LABEL } from "@/lib/profiles";
import { requireUserId } from "@/lib/session";
import { one } from "@/lib/db";
import { ProfileActions } from "./profile-actions";

export const metadata: Metadata = {
  title: "Profile · Girls Around the Globe",
};

export default async function ProfilePage({ params }: PageProps<"/profile/[id]">) {
  const { id } = await params;
  const me = await requireUserId(`/profile/${id}`);
  const p = await getMember(id);
  if (!p) notFound();

  const swiped = await one<{ liked: boolean }>("select liked from swipes where swiper_id = $1 and target_id = $2", [me, id]);
  const theyLiked = await one("select 1 from swipes where swiper_id = $1 and target_id = $2 and liked", [id, me]);
  const status = id === me ? "self" : swiped?.liked && theyLiked ? "matched" : swiped ? "swiped" : "open";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link href="/swipe" className="text-sm text-ink-dim hover:text-ink">← Back to swiping</Link>

      <div className="mt-6 grid gap-8 md:grid-cols-[320px_1fr]">
        <div>
          <div className="card aspect-[3/4] overflow-hidden">
            <Avatar profile={p} size="lg" />
          </div>
          {p.photos.length > 1 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {p.photos.slice(1).map((url) => (
                <img key={url} src={url} alt={`${p.name}'s photo`} className="aspect-square w-full rounded-xl object-cover" />
              ))}
            </div>
          )}
          {status === "self" ? (
            <Link href="/me" className="btn btn-ghost mt-4 w-full">Edit your profile</Link>
          ) : (
            <ProfileActions id={p.id} name={p.name} status={status} />
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="font-display text-4xl font-bold">{p.name}, {p.age}</h1>
            <p className="mt-1 text-ink-dim">
              {[`${p.flag} ${p.city}${p.country ? `, ${p.country}` : ""}`, p.occupation, p.lastActive].filter(Boolean).join(" · ")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {p.verified ? (
                <span className="chip !bg-ok/10 !text-ok">✓ ID & photo verified</span>
              ) : (
                <span className="chip !bg-warn/10 !text-warn">Not yet verified</span>
              )}
              <span className="chip !bg-accent-soft !text-accent-deep">{VIBE_EMOJI[p.vibe]} {VIBE_LABEL[p.vibe]}</span>
              {p.traveling && <span className="chip">✈️ {p.traveling}</span>}
            </div>
          </div>

          {p.bio && (
            <section className="card p-6">
              <h2 className="font-semibold">About me</h2>
              <p className="mt-2 whitespace-pre-wrap text-ink-dim">{p.bio}</p>
            </section>
          )}

          {p.prompts.map((pr) => (
            <section key={pr.q} className="card p-6">
              <p className="text-sm text-ink-mute">{pr.q}</p>
              <p className="mt-1 font-display text-xl">{pr.a}</p>
            </section>
          ))}

          {(p.languages.length > 0 || p.interests.length > 0) && (
            <section className="grid gap-4 sm:grid-cols-2">
              {p.languages.length > 0 && (
                <div className="card p-6">
                  <h2 className="font-semibold">Languages</h2>
                  <p className="mt-2 text-ink-dim">{p.languages.join(", ")}</p>
                </div>
              )}
              {p.interests.length > 0 && (
                <div className="card p-6">
                  <h2 className="font-semibold">Interests</h2>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.interests.map((i) => <span key={i} className="chip">{i}</span>)}
                  </div>
                </div>
              )}
            </section>
          )}

          <p className="text-xs text-ink-mute">
            Something feel off about this profile? Report it from the chat menu after matching, or see the{" "}
            <Link href="/safety#report" className="underline">safety center</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

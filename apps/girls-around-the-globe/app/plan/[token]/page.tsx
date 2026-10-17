import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { getPlan } from "@/lib/plans";
import { LocalTime } from "./local-time";

// Private: only people with the link can see it, and search engines never.
export const metadata: Metadata = {
  title: "A friend's plan · Girls Around the Globe",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function PlanPage({ params }: PageProps<"/plan/[token]">) {
  const { token } = await params;
  const plan = await getPlan(token);
  if (!plan) notFound();
  const { owner, match } = plan;

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-accent">🛡️ Shared plan</p>
      <h1 className="mt-2 font-display text-3xl font-bold">
        {owner.name} is meeting someone from Girls Around the Globe
      </h1>
      <p className="mt-2 text-ink-dim">
        {`${owner.name} shared this so a friend knows where they'll be. Check in with them afterwards.`}
      </p>

      <section className="card mt-6 space-y-5 p-6">
        <div className="flex items-center gap-4">
          <Avatar profile={{ name: match.name, palette: match.palette }} size="md" />
          <div>
            <p className="text-sm text-ink-mute">Meeting</p>
            <p className="font-display text-xl font-bold">{match.name}, {match.age}</p>
            <p className="text-sm text-ink-dim">{match.flag} {match.city}{match.country ? `, ${match.country}` : ""}</p>
          </div>
        </div>
        <div className="gold-rule" />
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-ink-mute">Where</dt>
            <dd className="mt-0.5 font-semibold" data-testid="plan-place">{plan.place}</dd>
          </div>
          <div>
            <dt className="text-sm text-ink-mute">When</dt>
            <dd className="mt-0.5 font-semibold"><LocalTime iso={plan.startsAt} /></dd>
          </div>
        </dl>
        {plan.note && (
          <div>
            <p className="text-sm text-ink-mute">Note from {owner.name}</p>
            <p className="mt-0.5 whitespace-pre-wrap">{plan.note}</p>
          </div>
        )}
      </section>

      <div className="mt-6 space-y-2 text-sm text-ink-dim">
        <p>If you can&rsquo;t reach {owner.name} and you&rsquo;re worried, call local emergency services and share this page with them.</p>
        <p className="text-xs text-ink-mute">This link expires 12 hours after the meetup.</p>
      </div>
      <Link href="/safety" className="btn btn-ghost mt-6">Safety tips</Link>
    </div>
  );
}

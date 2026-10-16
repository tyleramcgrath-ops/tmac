import type { Metadata } from "next";
import { demoUpgrade, openBillingPortal, startCheckout } from "@/app/actions";
import { PREMIUM_PRICE_LABEL, stripe } from "@/lib/billing";
import { FREE_DAILY_LIKES, FREE_DAILY_SUPER_LIKES, PREMIUM_DAILY_SUPER_LIKES, getMember } from "@/lib/members";
import { sessionUserId } from "@/lib/session";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Globe+ · Girls Around the Globe",
};

const FEATURES = [
  { icon: "✈️", title: "Passport", body: "Swipe in Lisbon, Tokyo or Medellín before your flight lands.", free: "—", plus: "✓" },
  { icon: "👀", title: "See who likes you", body: "Skip the guessing and match with people who already swiped right.", free: "—", plus: "✓" },
  { icon: "♥", title: "Likes", body: "Never run out of likes mid-trip.", free: `${FREE_DAILY_LIKES}/day`, plus: "Unlimited" },
  { icon: "★", title: "Super likes", body: "Stand out at the top of their deck.", free: `${FREE_DAILY_SUPER_LIKES}/day`, plus: `${PREMIUM_DAILY_SUPER_LIKES}/day` },
];

export default async function PremiumPage({ searchParams }: PageProps<"/premium">) {
  const id = await sessionUserId();
  const me = id ? await getMember(id) : null;
  const { success, error, feature } = await searchParams;
  const stripeReady = !!stripe();
  const demoAllowed = process.env.NODE_ENV !== "production" || !!process.env.ALLOW_DEMO_PREMIUM;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="card overflow-hidden">
        <div className="bg-sunset px-6 py-10 text-center text-white sm:px-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">✦ Globe+</p>
          <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">The whole world, unlocked.</h1>
          <p className="mx-auto mt-3 max-w-lg text-white/90">
            {feature === "passport"
              ? "Passport is a Globe+ feature. Upgrade to swipe in any city before you get there."
              : feature === "likes"
                ? "See everyone who already liked you, and match in one tap."
                : "Passport to any city, see who likes you, and never run out of likes."}
          </p>
        </div>

        <div className="p-6 sm:p-10">
          {success && me?.premium && (
            <p className="mb-6 rounded-xl bg-ok/10 px-4 py-3 text-center text-sm font-semibold text-ok">
              Welcome to Globe+! Everything is unlocked.
            </p>
          )}
          {error === "not-configured" && (
            <p className="mb-6 rounded-xl bg-warn/10 px-4 py-3 text-center text-sm text-warn">
              Payments aren&rsquo;t set up yet. Add a Stripe key to turn on checkout.
            </p>
          )}

          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-ink-mute">
                <th className="py-3 font-normal">Feature</th>
                <th className="py-3 text-center font-normal">Free</th>
                <th className="py-3 text-center font-semibold text-accent">Globe+</th>
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f) => (
                <tr key={f.title} className="border-b last:border-0">
                  <td className="py-4 pr-4">
                    <p className="font-semibold">{f.icon} {f.title}</p>
                    <p className="text-ink-dim">{f.body}</p>
                  </td>
                  <td className="py-4 text-center text-ink-mute">{f.free}</td>
                  <td className="py-4 text-center font-semibold text-accent">{f.plus}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-8 text-center">
            {!me ? (
              <Link href="/join" className="btn btn-primary">Create a free profile first</Link>
            ) : me.premium ? (
              <>
                <p className="font-semibold">You&rsquo;re a Globe+ member ✦</p>
                {stripeReady && (
                  <form action={openBillingPortal} className="mt-4">
                    <button type="submit" className="btn btn-ghost">Manage subscription</button>
                  </form>
                )}
              </>
            ) : (
              <>
                <p className="font-display text-3xl font-semibold">{PREMIUM_PRICE_LABEL}</p>
                <p className="text-sm text-ink-mute">Cancel any time.</p>
                <form action={startCheckout} className="mt-5">
                  <button type="submit" className="btn btn-primary min-w-56" disabled={!stripeReady}>
                    {stripeReady ? "Upgrade to Globe+" : "Checkout not set up yet"}
                  </button>
                </form>
                {!stripeReady && demoAllowed && (
                  <form action={demoUpgrade} className="mt-3">
                    <button type="submit" className="text-sm text-ink-dim underline">Try Globe+ free for 30 days (test mode)</button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

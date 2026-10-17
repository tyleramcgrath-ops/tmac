import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Safety center · Girls Around the Globe",
};

const MEETING = [
  "Video chat before you meet: tap 📹 Video in any match's chat. It's the fastest way to confirm someone is real, and you never have to share your number.",
  "On video, you can mute, turn your camera off or hang up any time. Calls aren't recorded, so never let anyone pressure you into something on camera.",
  "Meet somewhere public first, like a bar, café or busy square, and get there on your own.",
  "Share your plans and your match's profile with a friend.",
  "Keep your drink in sight, and leave whenever you want. You never owe anyone anything.",
  "Bring protection and talk about sexual health before things get physical.",
  "Abroad? Save the local emergency number and your embassy's contact details.",
];

const RED_FLAGS = [
  "Asks for money, gift cards, crypto, or help paying for a flight or visa",
  "Brings up rates, \"donations\" or \"roses\". Paid arrangements are banned here.",
  "Pushes to move the chat to WhatsApp or Telegram right away",
  "Won't video chat, or the photos look like a model's",
  "Says they love you within days, or shares an investment tip",
];

const GUIDELINES = [
  { title: "18+ only", body: "Anyone under 18 is removed immediately and reported where the law requires." },
  { title: "Casual, and upfront about it", body: "This site is for casual encounters only. Say what you want plainly, and take no for an answer." },
  { title: "Consent, always", body: "Enthusiastic, ongoing and freely given. \"No\", silence or a change of mind ends things. Pressure gets you banned." },
  { title: "No paid arrangements", body: "No escorting, sugar arrangements, or selling or buying sex or content. Profiles and messages that suggest it are removed." },
  { title: "Be real", body: "Your own photos, your real age, your real location. No impersonation, no catfishing." },
  { title: "Respect every culture", body: "No harassment, hate, or fetishizing people for their nationality or ethnicity." },
  { title: "No unsolicited explicit content", body: "Don't send explicit images unless both of you have clearly agreed to it." },
];

export default function SafetyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-5xl font-bold">Safety center</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-dim">
        Meeting someone from another country is half the fun. Here&rsquo;s how to keep it fun.
      </p>

      <section className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-display text-2xl font-bold">Before you meet</h2>
          <ul className="mt-4 space-y-3 text-ink-dim">
            {MEETING.map((t) => (
              <li key={t} className="flex gap-2"><span className="text-ok">✓</span>{t}</li>
            ))}
          </ul>
        </div>
        <div className="card p-6">
          <h2 className="font-display text-2xl font-bold">Red flags</h2>
          <ul className="mt-4 space-y-3 text-ink-dim">
            {RED_FLAGS.map((t) => (
              <li key={t} className="flex gap-2"><span className="text-warn">⚠</span>{t}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-ink-mute">
            Our scam shield flags messages like these automatically, but always trust your gut.
          </p>
        </div>
      </section>

      <section id="guidelines" className="mt-16 scroll-mt-24">
        <h2 className="font-display text-3xl font-bold">Community guidelines</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {GUIDELINES.map((g) => (
            <div key={g.title} className="card p-5">
              <h3 className="font-semibold">{g.title}</h3>
              <p className="mt-1 text-sm text-ink-dim">{g.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="report" className="mt-16 scroll-mt-24">
        <div className="card !bg-accent-soft p-8">
          <h2 className="font-display text-3xl font-bold text-accent-deep">Report a member</h2>
          <p className="mt-3 text-ink-dim">
            Use <strong>Report</strong> on any profile or chat. A person reviews every report, usually
            within a few hours, and the member is never told who reported them. If you&rsquo;re in
            danger, contact local emergency services first.
          </p>
          <Link href="/swipe" className="btn btn-primary mt-6">Back to swiping</Link>
        </div>
      </section>
    </div>
  );
}

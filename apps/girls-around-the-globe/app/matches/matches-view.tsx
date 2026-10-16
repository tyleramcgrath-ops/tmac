"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { getProfile, type Profile } from "@/lib/profiles";
import { useStore } from "@/lib/member-store";
import { scanMessage } from "@/lib/scam-guard";

// Demo replies so the chat feels alive until real messaging exists.
const REPLIES = [
  "Haha hi! Where are you writing from? 😊",
  "I love that you're not from here. Tell me something about your city.",
  "Are you ever travelling my way?",
  "Okay you're funny. What are you up to this weekend?",
];

export function MatchesView() {
  const params = useSearchParams();
  const router = useRouter();
  const { matches, threads } = useStore();
  const activeId = params.get("to");
  const active = activeId ? getProfile(activeId) : undefined;
  const matched = matches.map(getProfile).filter((p): p is Profile => !!p);
  const fresh = matched.filter((p) => !(threads[p.id]?.length));
  const chatting = matched.filter((p) => threads[p.id]?.length);

  if (matched.length === 0) {
    return (
      <div className="card mx-auto max-w-md p-10 text-center">
        <p className="text-5xl">💌</p>
        <h1 className="mt-4 font-display text-3xl font-semibold">No matches yet</h1>
        <p className="mt-2 text-ink-dim">When someone you liked likes you back, they&rsquo;ll show up here.</p>
        <Link href="/swipe" className="btn btn-primary mt-6">Start swiping</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[300px_1fr]">
      <aside className={active ? "hidden md:block" : ""}>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-accent">New matches</h2>
        {fresh.length === 0 ? (
          <p className="mt-2 text-sm text-ink-mute">You&rsquo;ve messaged everyone 🎉</p>
        ) : (
          <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
            {fresh.map((p) => (
              <button key={p.id} type="button" onClick={() => router.push(`/matches?to=${p.id}`)} className="flex w-16 shrink-0 flex-col items-center gap-1 text-xs">
                <Avatar profile={p} size="md" className={p.id === activeId ? "ring-2 ring-accent ring-offset-2" : ""} />
                {p.name}
              </button>
            ))}
          </div>
        )}

        <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-accent">Messages</h2>
        <ul className="mt-2 divide-y">
          {chatting.length === 0 && <li className="py-3 text-sm text-ink-mute">Say hi to a new match.</li>}
          {chatting.map((p) => {
            const last = threads[p.id].at(-1)!;
            return (
              <li key={p.id}>
                <button type="button" onClick={() => router.push(`/matches?to=${p.id}`)} className={`flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left hover:bg-surface-2 ${p.id === activeId ? "bg-surface-2" : ""}`}>
                  <Avatar profile={p} size="sm" />
                  <span className="min-w-0">
                    <span className="block font-semibold">{p.name} <span className="font-normal">{p.flag}</span></span>
                    <span className="block truncate text-sm text-ink-dim">{last.from === "me" ? "You: " : ""}{last.text}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {active && matches.includes(active.id) ? (
        <Chat profile={active} />
      ) : (
        <div className="card hidden items-center justify-center p-10 text-ink-dim md:flex">
          Pick a match to start chatting.
        </div>
      )}
    </div>
  );
}

function Chat({ profile: p }: { profile: Profile }) {
  const router = useRouter();
  const { threads, send, unmatch } = useStore();
  const thread = threads[p.id] ?? [];
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const warnings = scanMessage(draft);
  const foreign = p.languages[0] !== "English" ? p.languages[0] : null;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread.length, typing]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    send(p.id, { from: "me", text, at: new Date().toISOString() });
    setDraft("");
    setTyping(true);
    const mine = thread.filter((m) => m.from === "me").length;
    window.setTimeout(() => {
      setTyping(false);
      send(p.id, { from: "them", text: REPLIES[mine % REPLIES.length], at: new Date().toISOString() });
    }, 1400);
  };

  return (
    <section className="card flex h-[70vh] min-h-[480px] flex-col overflow-hidden">
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <button type="button" onClick={() => router.push("/matches")} className="text-ink-dim md:hidden" aria-label="Back to matches">←</button>
        <Link href={`/profile/${p.id}`} className="flex items-center gap-3">
          <Avatar profile={p} size="sm" />
          <span>
            <span className="block font-semibold">{p.name}, {p.age}</span>
            <span className="block text-xs text-ink-dim">{p.flag} {p.city}, {p.country} · {p.lastActive}</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => {
            unmatch(p.id);
            router.push("/matches");
          }}
          className="ml-auto rounded-full px-3 py-1 text-xs text-ink-mute hover:bg-surface-2 hover:text-ink"
        >
          Unmatch
        </button>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        <p className="mx-auto max-w-sm rounded-xl bg-surface-2 px-3 py-2 text-center text-xs text-ink-dim">
          You matched with {p.name}. Meeting up? Pick a public place first and tell a friend where you&rsquo;re going.
          We&rsquo;ll never ask you to send money, and neither should a match.
        </p>
        {thread.map((m, i) => (
          <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${m.from === "me" ? "rounded-br-sm bg-accent text-white" : "rounded-bl-sm bg-surface-2"}`}>
              {m.text}
              {m.from === "them" && foreign && (
                <span className="mt-1 block text-[11px] text-ink-mute">🌐 Translated from {foreign}</span>
              )}
              {m.from === "them" && scanMessage(m.text).length > 0 && (
                <span className="mt-1 block text-[11px] font-semibold text-warn">⚠ Be careful: this message {scanMessage(m.text).join(", ")}.</span>
              )}
            </div>
          </div>
        ))}
        {typing && <p className="text-xs text-ink-mute">{p.name} is typing…</p>}
        <div ref={endRef} />
      </div>

      {warnings.length > 0 && (
        <p className="border-t bg-warn/10 px-4 py-2 text-xs text-warn">
          ⚠ Heads up: your message {warnings.join(", ")}. <Link href="/safety" className="underline">Why we flag this</Link>
        </p>
      )}
      <form onSubmit={submit} className="flex gap-2 border-t p-3">
        <input
          className="field !rounded-full"
          placeholder={`Message ${p.name}…`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label={`Message ${p.name}`}
        />
        <button type="submit" className="btn btn-primary !px-5" disabled={!draft.trim()}>Send</button>
      </form>
    </section>
  );
}

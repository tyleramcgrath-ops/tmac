"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { reportAction, send, startCallAction, unmatchAction } from "@/app/actions";
import { Avatar } from "@/components/avatar";
import type { ChatMessage, Member } from "@/lib/members";
import { scanMessage } from "@/lib/scam-guard";
import { SharePlan } from "./share-plan";

const POLL_MS = 3000;

export function Chat({ other: p, initialMessages }: { other: Member; initialMessages: ChatMessage[] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [menu, setMenu] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const lastId = useRef(initialMessages.at(-1)?.id ?? 0);
  const warnings = scanMessage(draft);

  const pull = async () => {
    const res = await fetch(`/api/messages/${p.id}?after=${lastId.current}`, { cache: "no-store" });
    if (!res.ok) return;
    const { messages: fresh } = (await res.json()) as { messages: ChatMessage[] };
    if (fresh.length) {
      lastId.current = fresh.at(-1)!.id;
      setMessages((m) => [...m, ...fresh.filter((f) => !m.some((x) => x.id === f.id))]);
    }
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void pull();
    }, POLL_MS);
    return () => window.clearInterval(timer);
    // pull only reads refs and stable setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setError("");
    const res = await send(p.id, text);
    setSending(false);
    if (!res.ok) return setError(res.error ?? "Couldn't send that message.");
    setDraft("");
    await pull();
  };

  return (
    <section className="card flex h-[70vh] min-h-[480px] flex-col overflow-hidden">
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Link href="/matches" className="text-ink-dim md:hidden" aria-label="Back to matches">←</Link>
        <Link href={`/profile/${p.id}`} className="flex items-center gap-3">
          <Avatar profile={p} size="sm" />
          <span>
            <span className="block font-semibold">{p.name}, {p.age}</span>
            <span className="block text-xs text-ink-dim">{p.flag} {p.city}{p.country ? `, ${p.country}` : ""} · {p.lastActive}</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setPlanOpen((v) => !v)}
          aria-expanded={planOpen}
          className="ml-auto rounded-full border px-3 py-2 text-sm font-semibold hover:bg-surface-2"
          aria-label="Share my plan with a friend"
        >
          🛡️ <span className="hidden sm:inline">Share plan</span>
        </button>
        <button
          type="button"
          onClick={async () => {
            setError("");
            const res = await startCallAction(p.id);
            if (res && !res.ok) setError(res.error);
          }}
          className="flex items-center gap-1.5 rounded-full bg-sunset px-3.5 py-2 text-sm font-semibold text-on-accent shadow-[0_8px_20px_-10px_rgb(233_207_150)]"
          aria-label={`Video call ${p.name}`}
        >
          📹 <span className="hidden sm:inline">Video</span>
        </button>
        <div className="relative">
          <button type="button" onClick={() => setMenu((v) => !v)} aria-expanded={menu} aria-label="Chat options" className="rounded-full px-3 py-1 text-lg text-ink-mute hover:bg-surface-2 hover:text-ink">
            ⋯
          </button>
          {menu && (
            <div className="card absolute right-0 top-10 z-10 w-48 overflow-hidden py-1 text-sm">
              <button type="button" onClick={() => unmatchAction(p.id)} className="block w-full px-4 py-2 text-left hover:bg-surface-2">Unmatch</button>
              <button
                type="button"
                onClick={() => {
                  const reason = window.prompt(`What's wrong with ${p.name}'s profile or messages?`);
                  if (reason !== null) void reportAction(p.id, reason);
                }}
                className="block w-full px-4 py-2 text-left text-accent-deep hover:bg-surface-2"
              >
                Report & block
              </button>
            </div>
          )}
        </div>
      </header>
      {planOpen && <SharePlan matchId={p.id} name={p.name} onClose={() => setPlanOpen(false)} />}

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        <p className="mx-auto max-w-sm rounded-xl bg-surface-2 px-3 py-2 text-center text-xs text-ink-dim">
          You matched with {p.name}. Meeting up? Pick a public place first and use 🛡️ Share plan to tell a friend where you&rsquo;re going.
          We&rsquo;ll never ask you to send money, and neither should a match.
        </p>
        {messages.map((m) => {
          const flags = m.mine ? [] : scanMessage(m.body);
          return (
            <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-sm ${m.mine ? "rounded-br-sm bg-sunset text-on-accent" : "rounded-bl-sm bg-surface-2"}`}>
                {m.body}
                {flags.length > 0 && (
                  <span className="mt-1 block text-[11px] font-semibold text-warn">⚠ Be careful: this message {flags.join(", ")}.</span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {warnings.length > 0 && (
        <p className="border-t bg-warn/10 px-4 py-2 text-xs text-warn">
          ⚠ Heads up: your message {warnings.join(", ")}. <Link href="/safety" className="underline">Why we flag this</Link>
        </p>
      )}
      {error && <p className="border-t bg-accent-soft px-4 py-2 text-xs text-accent-deep" role="alert">{error}</p>}
      <form onSubmit={submit} className="flex gap-2 border-t p-3">
        <input
          className="field !rounded-full"
          placeholder={`Message ${p.name}…`}
          value={draft}
          maxLength={1000}
          onChange={(e) => setDraft(e.target.value)}
          aria-label={`Message ${p.name}`}
        />
        <button type="submit" className="btn btn-primary !px-5" disabled={!draft.trim() || sending}>Send</button>
      </form>
    </section>
  );
}

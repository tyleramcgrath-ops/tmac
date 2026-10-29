"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { answerCallAction, endCallAction } from "@/app/actions";
import { Avatar } from "./avatar";

type Incoming = { id: string; from: { name: string; flag: string; city: string; palette: [string, string]; photos: string[] } };

const POLL_MS = 3000;

// Rings on any page when a match video-calls you.
export function IncomingCall() {
  const router = useRouter();
  const pathname = usePathname();
  const [call, setCall] = useState<Incoming | null>(null);
  const [error, setError] = useState("");
  const inCall = pathname.startsWith("/call/");

  useEffect(() => {
    if (inCall) return;
    let stopped = false;
    let timer: number | undefined;
    const poll = async () => {
      try {
        if (document.visibilityState === "visible") {
          const res = await fetch("/api/calls/incoming", { cache: "no-store" });
          if (res.ok) setCall(((await res.json()) as { call: Incoming | null }).call);
        }
      } catch {
        // ignore and retry
      }
      if (!stopped) timer = window.setTimeout(poll, POLL_MS);
    };
    void poll();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [inCall]);

  if (!call || inCall) return null;

  const accept = async () => {
    const res = await answerCallAction(call.id);
    if (!res.ok) return setError(res.error ?? "This call has ended.");
    setCall(null);
    router.push(`/call/${call.id}`);
  };
  const decline = async () => {
    setCall(null);
    await endCallAction(call.id);
  };

  return (
    <div role="alertdialog" aria-label={`${call.from.name} is video calling you`} className="fixed inset-x-0 top-4 z-50 mx-auto w-[min(92vw,420px)]">
      <div className="card glow flex items-center gap-4 p-4">
        <span className="relative">
          <span className="absolute -inset-1 animate-ping rounded-full border border-accent/70" />
          <Avatar profile={call.from} size="md" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display font-bold">{call.from.name} {call.from.flag}</p>
          <p className="text-sm text-gold">{error || "📹 Incoming video call…"}</p>
        </div>
        <button type="button" onClick={decline} aria-label="Decline" className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-600 text-white">✕</button>
        <button type="button" onClick={accept} aria-label="Accept" className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white">📹</button>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { setPassport, swipe } from "@/app/actions";
import { Avatar } from "@/components/avatar";
import type { Member, SwipeQuota } from "@/lib/members";
import { PASSPORT_CITIES, VIBE_EMOJI, VIBE_LABEL } from "@/lib/profiles";

const THRESHOLD = 110;

type Me = Pick<Member, "name" | "palette" | "photos" | "premium" | "passport">;
type Fly = { dir: 1 | -1 } | null;
type Limit = "out-of-likes" | "out-of-super-likes" | null;

export function SwipeDeck({ me, initialDeck, quota: initialQuota }: { me: Me; initialDeck: Member[]; quota: SwipeQuota }) {
  const router = useRouter();
  const [deck, setDeck] = useState(initialDeck);
  const [quota, setQuota] = useState(initialQuota);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [fly, setFly] = useState<Fly>(null);
  const [expanded, setExpanded] = useState(false);
  const [match, setMatch] = useState<Member | null>(null);
  const [limit, setLimit] = useState<Limit>(null);
  const [, startTransition] = useTransition();
  const start = useRef<{ x: number; y: number } | null>(null);

  // A new server render (Passport change, refill) replaces the local deck.
  const [prevDeck, setPrevDeck] = useState(initialDeck);
  if (prevDeck !== initialDeck) {
    setPrevDeck(initialDeck);
    setDeck(initialDeck);
    setQuota(initialQuota);
  }

  const top = deck[0];
  const next = deck[1];

  const commit = useCallback(
    (dir: 1 | -1, isSuper = false) => {
      if (!top || fly) return;
      if (dir === 1 && quota.likesLeft === 0) return setLimit("out-of-likes");
      if (isSuper && quota.superLeft === 0) return setLimit("out-of-super-likes");

      setFly({ dir });
      const card = top;
      const result = swipe(card.id, dir === 1, isSuper);
      // Let the fly-out animation play before the card leaves the deck.
      window.setTimeout(async () => {
        const res = await result;
        setFly(null);
        setDrag({ x: 0, y: 0, active: false });
        setExpanded(false);
        if (!res.ok) {
          if (res.reason !== "not-found") setLimit(res.reason);
          else setDeck((d) => d.filter((m) => m.id !== card.id));
          return;
        }
        const rest = deck.filter((m) => m.id !== card.id);
        setDeck(rest);
        if (rest.length === 0) startTransition(() => router.refresh());
        if (dir === 1) {
          setQuota((q) => ({
            likesLeft: q.likesLeft === null ? null : Math.max(0, q.likesLeft - 1),
            superLeft: isSuper ? Math.max(0, q.superLeft - 1) : q.superLeft,
          }));
        }
        if (res.match) setMatch(card);
      }, 260);
    },
    [top, fly, quota, deck, router],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (match || limit || (e.target as HTMLElement).closest("select, input, textarea")) return;
      if (e.key === "ArrowLeft") commit(-1);
      if (e.key === "ArrowRight") commit(1);
      if (e.key === "ArrowUp") commit(1, true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commit, match, limit]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (fly) return;
    start.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDrag({ x: 0, y: 0, active: true });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!start.current) return;
    setDrag({ x: e.clientX - start.current.x, y: e.clientY - start.current.y, active: true });
  };
  const onPointerUp = () => {
    if (!start.current) return;
    start.current = null;
    if (drag.x > THRESHOLD) commit(1);
    else if (drag.x < -THRESHOLD) commit(-1);
    else setDrag({ x: 0, y: 0, active: false });
  };

  const x = fly ? fly.dir * 700 : drag.x;
  const y = fly ? drag.y : drag.y * 0.3;
  const likeOpacity = Math.max(0, Math.min(1, (fly?.dir === 1 ? THRESHOLD : drag.x) / THRESHOLD));
  const nopeOpacity = Math.max(0, Math.min(1, (fly?.dir === -1 ? THRESHOLD : -drag.x) / THRESHOLD));

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="flex items-center gap-2">
        <label className="flex-1">
          <span className="sr-only">Where to swipe</span>
          <select
            className="field !rounded-full !py-2 text-sm"
            value={me.premium ? (me.passport ?? "") : ""}
            onChange={(e) => {
              const city = e.target.value || null;
              if (city && !me.premium) {
                router.push("/premium?feature=passport");
                return;
              }
              startTransition(() => setPassport(city));
            }}
          >
            <option value="">🌍 Worldwide</option>
            {PASSPORT_CITIES.map((c) => (
              <option key={c.city} value={c.city}>
                ✈️ Passport: {c.flag} {c.city}{me.premium ? "" : " ✦"}
              </option>
            ))}
          </select>
        </label>
        <span className="chip whitespace-nowrap" title="Likes and super likes left today">
          ♥ {quota.likesLeft === null ? "∞" : quota.likesLeft} · ★ {quota.superLeft}
        </span>
      </div>

      <div className="relative mt-4 h-[min(64vh,620px)] w-full select-none">
        {!top && (
          <div className="card absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <p className="text-5xl">🌍</p>
            <p className="font-display text-2xl font-semibold">You&rsquo;ve seen everyone for now</p>
            <p className="text-ink-dim">
              New people join every day.{" "}
              {me.premium ? "Try Passport to swipe in another city." : "With Globe+ you can Passport to another city."}
            </p>
            {!me.premium && <Link href="/premium" className="btn btn-primary">Get Globe+</Link>}
          </div>
        )}

        {next && (
          <div className="card absolute inset-0 scale-[0.96] overflow-hidden opacity-90">
            <CardFace profile={next} />
          </div>
        )}

        {top && (
          <div
            key={top.id}
            role="group"
            aria-label={`${top.name}, ${top.age}. Swipe right to like, left to pass.`}
            className="card absolute inset-0 cursor-grab touch-none overflow-hidden active:cursor-grabbing"
            style={{
              transform: `translate(${x}px, ${y}px) rotate(${x / 18}deg)`,
              transition: drag.active && !fly ? "none" : "transform 260ms ease-out",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <CardFace profile={top} expanded={expanded} onToggle={() => setExpanded((v) => !v)} />
            <span className="pointer-events-none absolute left-6 top-8 -rotate-12 rounded-lg border-4 border-emerald-400 px-3 py-1 text-3xl font-black tracking-wider text-emerald-400" style={{ opacity: likeOpacity }}>
              LIKE
            </span>
            <span className="pointer-events-none absolute right-6 top-8 rotate-12 rounded-lg border-4 border-rose-500 px-3 py-1 text-3xl font-black tracking-wider text-rose-500" style={{ opacity: nopeOpacity }}>
              NOPE
            </span>
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-center gap-5">
        <RoundButton label="Pass" onClick={() => commit(-1)} disabled={!top} className="h-16 w-16 text-2xl text-rose-500">✕</RoundButton>
        <RoundButton label="Super like" onClick={() => commit(1, true)} disabled={!top} className="h-12 w-12 text-lg text-sky-500">★</RoundButton>
        <RoundButton label="Like" onClick={() => commit(1)} disabled={!top} className="h-16 w-16 text-2xl text-emerald-500">♥</RoundButton>
      </div>
      <p className="mt-3 text-center text-xs text-ink-mute">Drag the card, tap the buttons, or use ← ↑ → keys</p>

      {match && <MatchModal me={me} profile={match} onClose={() => setMatch(null)} />}
      {limit && <LimitModal limit={limit} onClose={() => setLimit(null)} />}
    </div>
  );
}

function CardFace({ profile: p, expanded = false, onToggle }: { profile: Member; expanded?: boolean; onToggle?: () => void }) {
  return (
    <div className="relative h-full w-full">
      <Avatar profile={p} size="lg" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-5 pt-24 text-white">
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold backdrop-blur">
            {VIBE_EMOJI[p.vibe]} {VIBE_LABEL[p.vibe]}
          </span>
          {p.verified && <span className="rounded-full bg-sky-500/80 px-2.5 py-0.5 text-xs font-semibold">✓ Verified</span>}
        </div>
        <div className="mt-2 flex items-end justify-between gap-3">
          <div>
            <p className="font-display text-3xl font-semibold leading-tight">
              {p.name} <span className="font-normal">{p.age}</span>
            </p>
            <p className="text-sm text-white/85">{p.flag} {p.city}{p.country ? `, ${p.country}` : ""}</p>
            {p.traveling && <p className="text-sm text-white/85">✈️ {p.traveling}</p>}
          </div>
          {onToggle && (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onToggle}
              aria-expanded={expanded}
              aria-label={expanded ? "Hide details" : "Show details"}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-ink"
            >
              {expanded ? "↓" : "↑"}
            </button>
          )}
        </div>
        {expanded ? (
          <div className="mt-3 max-h-48 space-y-2 overflow-y-auto text-sm">
            {p.bio && <p>{p.bio}</p>}
            {p.prompts.map((pr) => (
              <p key={pr.q}><span className="text-white/60">{pr.q}: </span>{pr.a}</p>
            ))}
            <p className="text-white/70">
              {[p.languages.length ? `Speaks ${p.languages.join(", ")}` : "", p.occupation].filter(Boolean).join(" · ")}
            </p>
            <Link href={`/profile/${p.id}`} onPointerDown={(e) => e.stopPropagation()} className="inline-block underline">Full profile</Link>
          </div>
        ) : (
          p.bio && <p className="mt-2 line-clamp-2 text-sm text-white/90">{p.bio}</p>
        )}
      </div>
    </div>
  );
}

function RoundButton({ label, className, children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`flex items-center justify-center rounded-full border bg-surface shadow-lg transition hover:scale-110 disabled:opacity-40 disabled:hover:scale-100 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

function MatchModal({ me, profile, onClose }: { me: Me; profile: Member; onClose: () => void }) {
  return (
    <div role="dialog" aria-modal="true" aria-label={`You matched with ${profile.name}`} className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-[#ff4f7b]/95 to-ink/95 p-6 text-center text-white">
      <div className="w-full max-w-sm">
        <p className="font-display text-5xl font-semibold italic">It&rsquo;s a match!</p>
        <p className="mt-3 text-white/80">You and {profile.name} liked each other.</p>
        <div className="mt-8 flex justify-center">
          <Avatar profile={me} size="xl" className="!h-32 !w-32 border-4 border-white" />
          <Avatar profile={profile} size="xl" className="-ml-6 !h-32 !w-32 border-4 border-white" />
        </div>
        <Link href={`/matches/${profile.id}`} className="btn mt-10 w-full bg-white !text-accent-deep hover:bg-white/90">Send a message</Link>
        <button type="button" onClick={onClose} className="btn mt-3 w-full border border-white/50 text-white hover:bg-white/10">Keep swiping</button>
      </div>
    </div>
  );
}

function LimitModal({ limit, onClose }: { limit: Exclude<Limit, null>; onClose: () => void }) {
  const likes = limit === "out-of-likes";
  return (
    <div role="dialog" aria-modal="true" aria-label="Daily limit reached" className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-6">
      <div className="card w-full max-w-sm p-8 text-center">
        <p className="text-5xl">{likes ? "💘" : "⭐"}</p>
        <h2 className="mt-4 font-display text-2xl font-semibold">
          {likes ? "You're out of likes for today" : "You're out of super likes"}
        </h2>
        <p className="mt-2 text-ink-dim">
          {likes ? "Free members get 25 likes a day. Globe+ members get unlimited likes." : "Globe+ members get 5 super likes every day."}
        </p>
        <Link href="/premium" className="btn btn-primary mt-6 w-full">Get Globe+</Link>
        <button type="button" onClick={onClose} className="btn btn-ghost mt-3 w-full">Not now</button>
      </div>
    </div>
  );
}

"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import camila from "@/public/home/camila.jpg";
import daniela from "@/public/home/daniela.jpg";
import isabela from "@/public/home/isabela.jpg";
import mariana from "@/public/home/mariana.jpg";
import valeria from "@/public/home/valeria.jpg";
import { Logo } from "@/components/logo";

// A playable preview of the app on the homepage. These are illustrative
// profiles (photos of models), not members, and the page says so.
type Demo = {
  name: string;
  age: number;
  city: string;
  langs: string;
  wants: string;
  tag: string;
  quote: string;
  photo: StaticImageData;
  pos: string;
  alt: string;
  likesBack: boolean;
};

const DEMO: Demo[] = [
  { name: "Valeria", age: 27, city: "Cartagena, Colombia", langs: "Spanish, English", wants: "Looking for a relationship", tag: "Salsa on Fridays", quote: "Sunset walks in the old town, and a man who calls when he says he will.", photo: valeria, pos: "50% 22%", alt: "Valeria, with long curly hair, on an evening street", likesBack: true },
  { name: "Isabela", age: 25, city: "Medellín, Colombia", langs: "Spanish, some English", wants: "Marriage & family", tag: "Wants kids", quote: "Sunday lunch with my family is sacred. Bring flowers, not excuses.", photo: isabela, pos: "55% 35%", alt: "Isabela smiling with a pink flower in her hair", likesBack: true },
  { name: "Camila", age: 29, city: "Mexico City, Mexico", langs: "Spanish, English", wants: "Looking for a relationship", tag: "Open to relocating", quote: "Tacos at 1am, museums on Sunday. Keep up with me.", photo: camila, pos: "58% 30%", alt: "Camila leaning against a stone column on a lit street at night", likesBack: false },
  { name: "Daniela", age: 26, city: "Barranquilla, Colombia", langs: "Spanish", wants: "Dating to see where it goes", tag: "Beach every weekend", quote: "Teach me your favorite song and I'll teach you to dance to it.", photo: daniela, pos: "55% 30%", alt: "Daniela with long dark hair in a tropical garden", likesBack: true },
  { name: "Mariana", age: 28, city: "Rio de Janeiro, Brazil", langs: "Portuguese, English", wants: "Looking for a relationship", tag: "Loves to travel", quote: "The city lights are better with someone to share them.", photo: mariana, pos: "42% 40%", alt: "Mariana smiling over her shoulder on a city street at night", likesBack: true },
];

const SWIPE_AT = 110;

function Heart({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 20.5s-7-4.3-9.2-8.7A5.3 5.3 0 0 1 12 6.4a5.3 5.3 0 0 1 9.2 5.4c-2.2 4.4-9.2 8.7-9.2 8.7z" />
    </svg>
  );
}

export function SwipeDemo() {
  const [i, setI] = useState(0);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [leaving, setLeaving] = useState<"left" | "right" | null>(null);
  const [match, setMatch] = useState<Demo | null>(null);
  const startX = useRef(0);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const top = DEMO[i];
  const next = DEMO[i + 1];

  const decide = (liked: boolean) => {
    if (!top || leaving) return;
    setDragging(false);
    setLeaving(liked ? "right" : "left");
    timer.current = window.setTimeout(() => {
      setI((n) => n + 1);
      setLeaving(null);
      setDrag(0);
      if (liked && top.likesBack) setMatch(top);
    }, 320);
  };

  let transform = `translateX(${drag}px) rotate(${drag / 18}deg)`;
  if (leaving === "right") transform = "translateX(140%) rotate(22deg)";
  if (leaving === "left") transform = "translateX(-140%) rotate(-22deg)";

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative aspect-[3/4.15] w-full max-w-[390px]">
        {next && !leaving && (
          <div aria-hidden="true" className="absolute inset-0 translate-y-4 scale-[0.94] overflow-hidden rounded-3xl bg-surface opacity-55">
            <Image src={next.photo} alt="" fill sizes="390px" className="object-cover" style={{ objectPosition: next.pos }} />
          </div>
        )}

        {top ? (
          <article
            aria-label={`${top.name}, ${top.age}, ${top.city}`}
            data-testid="demo-card"
            onPointerDown={(e) => {
              if (leaving) return;
              startX.current = e.clientX;
              e.currentTarget.setPointerCapture(e.pointerId);
              setDragging(true);
              setDrag(0);
            }}
            onPointerMove={(e) => dragging && setDrag(e.clientX - startX.current)}
            onPointerUp={() => {
              if (!dragging) return;
              if (Math.abs(drag) > SWIPE_AT) decide(drag > 0);
              else {
                setDragging(false);
                setDrag(0);
              }
            }}
            onPointerCancel={() => {
              setDragging(false);
              setDrag(0);
            }}
            className="absolute inset-0 cursor-grab touch-pan-y select-none overflow-hidden rounded-3xl border border-accent/25 bg-surface shadow-[0_40px_80px_-30px_rgb(0_0_0/0.9)] active:cursor-grabbing"
            style={{
              transform,
              opacity: leaving ? 0 : 1,
              transition: dragging ? "none" : "transform .32s cubic-bezier(.2,.7,.2,1), opacity .32s ease",
            }}
          >
            <Image src={top.photo} alt={top.alt} fill sizes="390px" draggable={false} className="pointer-events-none object-cover" style={{ objectPosition: top.pos }} priority={i === 0} />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 via-35% to-transparent to-65%" />

            <span aria-hidden="true" className="absolute left-5 top-7 -rotate-12 rounded-lg border-[2.5px] border-accent px-3 py-1 text-xl font-extrabold tracking-[0.12em] text-accent" style={{ opacity: Math.max(0, Math.min(1, drag / SWIPE_AT)) }}>LIKE</span>
            <span aria-hidden="true" className="absolute right-5 top-7 rotate-12 rounded-lg border-[2.5px] border-ink px-3 py-1 text-xl font-extrabold tracking-[0.12em] text-ink" style={{ opacity: Math.max(0, Math.min(1, -drag / SWIPE_AT)) }}>PASS</span>

            <div className="absolute inset-x-3.5 top-3.5 flex gap-1.5" aria-hidden="true">
              {DEMO.map((d, k) => (
                <span key={d.name} className={`h-0.5 flex-1 rounded-full ${k <= i ? "bg-accent" : "bg-white/30"}`} />
              ))}
            </div>

            <div className="absolute inset-x-0 bottom-0 space-y-2.5 p-5">
              <p className="flex items-baseline gap-2.5">
                <span className="font-display text-4xl leading-none">{top.name}</span>
                <span className="text-xl text-ink-dim">{top.age}</span>
                <span className="text-sm text-accent" title="Verified">✓</span>
              </p>
              <p className="text-sm text-ink-dim">{top.city} · {top.langs}</p>
              <div className="flex flex-wrap gap-1.5 text-xs font-bold">
                <span className="rounded-full border border-accent/55 bg-accent/15 px-3 py-1 text-accent-deep">{top.wants}</span>
                <span className="rounded-full border border-ink/25 px-3 py-1 text-ink">{top.tag}</span>
              </div>
              <p className="font-display text-xl italic leading-snug">&ldquo;{top.quote}&rdquo;</p>
            </div>
          </article>
        ) : (
          <div className="pop absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-3xl border border-accent/30 bg-[radial-gradient(circle_at_50%_30%,#241c14,#0f0c0b_70%)] p-9 text-center">
            <Logo size={70} />
            <p className="font-display text-3xl leading-tight">That&rsquo;s today&rsquo;s preview.</p>
            <p className="text-sm text-ink-dim">Make a free profile to meet real, verified women and see who has already liked you.</p>
            <Link href="/join" className="btn btn-primary">Create my free profile</Link>
            <button type="button" onClick={() => { setI(0); setMatch(null); }} className="min-h-11 text-sm font-semibold text-ink-dim hover:text-ink">
              Start over
            </button>
          </div>
        )}

        {match && (
          <div role="dialog" aria-label="It's mutual" className="pop absolute -inset-3 z-10 flex flex-col items-center justify-center gap-4 rounded-[28px] border border-accent/45 bg-bg/95 p-8 text-center backdrop-blur">
            <div className="flex items-center">
              <span className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-accent">
                <Image src={match.photo} alt="" fill sizes="96px" className="object-cover" style={{ objectPosition: match.pos }} />
              </span>
              <span className="pulse z-10 -mx-3 flex h-12 w-12 items-center justify-center rounded-full bg-sunset">
                <Heart className="h-5 w-5" />
              </span>
              <span className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-ink/40 bg-surface-2 font-bold text-accent">You</span>
            </div>
            <p className="font-display text-5xl text-gold">It&rsquo;s mutual.</p>
            <p className="max-w-xs text-sm text-ink-dim">You and {match.name} liked each other. Say hello, or ask for a video date.</p>
            <Link href="/join" className="btn btn-primary">Ask {match.name} for a video date</Link>
            <button type="button" onClick={() => setMatch(null)} className="min-h-11 text-sm font-semibold text-ink-dim hover:text-ink">
              Keep browsing
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-5">
        <button type="button" aria-label="Pass" onClick={() => decide(false)} disabled={!top} className="flex h-16 w-16 items-center justify-center rounded-full border border-ink/20 bg-ink/5 text-xl transition hover:scale-110 active:scale-95 disabled:opacity-40">
          ✕
        </button>
        <span className="min-w-14 text-center text-sm font-semibold text-ink-mute">{Math.min(i + 1, DEMO.length)} / {DEMO.length}</span>
        <button type="button" aria-label="Like" onClick={() => decide(true)} disabled={!top} className="flex h-16 w-16 items-center justify-center rounded-full bg-sunset text-on-accent shadow-[0_16px_34px_-14px_rgb(233_207_150/0.7)] transition hover:scale-110 active:scale-95 disabled:opacity-40">
          <Heart className="h-7 w-7" />
        </button>
      </div>
    </div>
  );
}

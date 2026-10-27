"use client";

// Glass cards that orbit the Compass. Positions are set on the elements every
// frame (no React re-render).
// - Desktop: a slow orbit on a tilted ellipse; cards behind the Compass sit
//   under it and dim, the orbit eases to a stop while a card is hovered or
//   focused, and the cursor nudges it.
// - Phones: a carousel ring in front of the Compass. Swipe to turn it; it
//   carries momentum and snaps to the nearest card with a tick and a buzz,
//   and drifts on by itself when left alone.
// Light filaments run from the Compass to every card.
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { buzz, tick } from "@/lib/sound";

export type OrbitItem = {
  key: string;
  className?: string;
  ariaLabel?: string;
  onClick: () => void;
  content: ReactNode;
};

const TAU = Math.PI * 2;
const damp = (a: number, b: number, l: number, dt: number) => a + (b - a) * (1 - Math.exp(-l * dt));

export default function OrbitField({ items, reduced, onHover }: { items: OrbitItem[]; reduced: boolean; onHover?: (on: boolean) => void }) {
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const lines = useRef<(SVGPathElement | null)[]>([]);
  const svg = useRef<SVGSVGElement>(null);
  const hovered = useRef<number | null>(null);
  const tilt = useRef(items.map(() => ({ x: 0, y: 0, tx: 0, ty: 0 })));
  // Carousel state for phones, in card units (0 = first card in front).
  const ring = useRef({ pos: 0, target: 0, vel: 0, dragging: false, startX: 0, startPos: 0, lastX: 0, lastT: 0, moved: false, idle: 0, front: -1 });
  const n = items.length;

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const start = last;
    let base = Math.PI / 4;
    let speed = 0;
    let nudge = 0;
    let px = 0;
    const R = ring.current;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "touch") px = (e.clientX / innerWidth - 0.5) * 2;
      if (!R.dragging) return;
      const dx = e.clientX - R.startX;
      if (Math.abs(dx) > 8) R.moved = true;
      const now = performance.now();
      const step = innerWidth * 0.42;
      R.vel = ((R.lastX - e.clientX) / step / Math.max(1, now - R.lastT)) * 1000;
      R.lastX = e.clientX;
      R.lastT = now;
      R.pos = R.startPos - dx / step;
    };
    const onUp = () => {
      if (!R.dragging) return;
      R.dragging = false;
      // Fling: carry the velocity a little way, then settle on a card.
      R.target = Math.round(R.pos + Math.max(-1.5, Math.min(1.5, R.vel * 0.22)));
      R.idle = 0;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const t = (now - start) / 1000;
      const W = innerWidth;
      const H = innerHeight;
      const compact = W <= 760;
      const mount = document.querySelector(".compass-mount")?.getBoundingClientRect();
      const cx = mount ? mount.left + mount.width / 2 : W / 2;
      const cy = mount ? mount.top + mount.height / 2 : H * 0.48;

      // Desktop orbit
      const rx = Math.min(W * 0.34, 640);
      const ry = H * 0.165;
      speed = damp(speed, reduced || hovered.current !== null ? 0 : TAU / 72, 2.4, dt);
      base += speed * dt;
      nudge = damp(nudge, reduced ? 0 : px * 0.22, 2, dt);

      // Phone carousel
      if (compact && !R.dragging) {
        R.idle += dt;
        if (!reduced && R.idle > 7) {
          R.target += 1;
          R.idle = 3;
        }
        R.pos = damp(R.pos, R.target, 6, dt);
      }
      const frontIdx = (((Math.round(R.pos) % n) + n) % n);
      if (compact && frontIdx !== R.front) {
        if (R.front !== -1) {
          tick(frontIdx);
          buzz(6);
        }
        R.front = frontIdx;
      }
      svg.current?.setAttribute("viewBox", `0 0 ${W} ${H}`);

      for (let i = 0; i < n; i++) {
        const el = cards.current[i];
        if (!el) continue;
        const delay = reduced ? 0 : 0.25 + i * 0.12;
        const k = reduced ? 1 : Math.min(1, Math.max(0, (t - delay) / 1.3));
        const intro = 1 - Math.pow(1 - k, 3);
        const tl = tilt.current[i] ?? { x: 0, y: 0, tx: 0, ty: 0 };
        tl.x = damp(tl.x, tl.tx, 8, dt);
        tl.y = damp(tl.y, tl.ty, 8, dt);
        const float = reduced ? 0 : Math.sin(t * 0.8 + i * 1.7) * (compact ? 3 : 5);
        let x: number, y: number, scale: number, face: number, front: number, under: boolean;
        if (compact) {
          // φ = 0 is the card in front, centred under the Compass.
          const phi = ((i - R.pos) / n) * TAU;
          front = (Math.cos(phi) + 1) / 2;
          x = cx + Math.sin(phi) * W * 0.34 * intro;
          y = cy + H * 0.26 * intro - (1 - Math.cos(phi)) * H * 0.1 + float;
          scale = (0.62 + 0.38 * front ** 1.5) * (0.55 + 0.45 * intro);
          face = -Math.sin(phi) * 38;
          under = Math.cos(phi) < -0.2;
        } else {
          const th = base + i * (TAU / Math.max(n, 1)) - nudge;
          const depth = Math.sin(th);
          front = (depth + 1) / 2;
          x = cx + Math.cos(th) * rx * intro;
          y = cy + depth * ry * intro + float;
          scale = (0.7 + 0.3 * front) * (0.55 + 0.45 * intro) * (hovered.current === i ? 1.06 : 1);
          face = -Math.cos(th) * 26;
          under = depth < -0.12;
        }
        el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) perspective(1100px) rotateY(${face + tl.y}deg) rotateX(${tl.x}deg) scale(${scale})`;
        el.style.zIndex = under ? "11" : String(20 + Math.round(front * 10));
        el.style.opacity = String(intro * (compact ? 0.2 + 0.8 * front ** 1.3 : 0.5 + 0.5 * front));
        el.style.setProperty("--depth", front.toFixed(3));
        el.style.setProperty("--tx", (tl.x + (compact ? 0 : 0)).toFixed(2));
        el.style.setProperty("--ty", (tl.y + face * 0.35).toFixed(2));
        el.style.setProperty("--sheen", `${(face * 4 + t * 6) % 360}deg`);
        el.tabIndex = compact && front < 0.9 ? -1 : 0;
        const line = lines.current[i];
        if (line) {
          const mx = (cx + x) / 2;
          const my = Math.min(cy, y) - (compact ? H * 0.04 : ry * 0.35);
          line.setAttribute("d", `M${cx} ${cy} Q${mx} ${my} ${x} ${y}`);
          line.style.opacity = String(intro * (0.12 + 0.6 * front ** 2) * (hovered.current === i ? 1.6 : 1));
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [n, reduced]);

  const enter = (i: number) => {
    if (hovered.current !== i && innerWidth > 760) tick(i);
    hovered.current = i;
    onHover?.(true);
  };
  const leave = (i: number) => {
    if (hovered.current === i) hovered.current = null;
    const tl = tilt.current[i];
    if (tl) tl.tx = tl.ty = 0;
    onHover?.(false);
  };
  const grab = (e: React.PointerEvent) => {
    if (innerWidth > 760 || e.pointerType === "mouse") return;
    const R = ring.current;
    R.dragging = true;
    R.moved = false;
    R.startX = R.lastX = e.clientX;
    R.lastT = performance.now();
    R.startPos = R.pos;
    R.vel = 0;
  };

  return (
    <div className="orbit-field">
      <svg ref={svg} className="orbit-filaments" aria-hidden="true" preserveAspectRatio="none">
        <defs>
          <linearGradient id="filament" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ffe6a8" stopOpacity="0.9" />
            <stop offset="1" stopColor="#bff6f0" stopOpacity="0.35" />
          </linearGradient>
        </defs>
        {items.map((it, i) => (
          <path key={it.key} ref={(el) => { lines.current[i] = el; }} stroke="url(#filament)" />
        ))}
      </svg>
      {/* Phones: swipe anywhere across the lower room to turn the ring */}
      <div className="orbit-swipe" onPointerDown={grab} aria-hidden="true" />
      {items.map((it, i) => (
        <button
          key={it.key}
          ref={(el) => { cards.current[i] = el; }}
          className={`orbit-card ${it.className ?? ""}`}
          aria-label={it.ariaLabel}
          onPointerDown={grab}
          onClick={(e) => {
            const R = ring.current;
            if (R.moved) {
              e.preventDefault();
              R.moved = false;
              return;
            }
            // On a phone, tapping a side card brings it to the front first.
            if (innerWidth <= 760) {
              const off = ((((i - R.pos) % n) + n + n / 2) % n) - n / 2;
              if (Math.abs(off) > 0.4) {
                R.target = Math.round(R.pos + off);
                R.idle = 0;
                return;
              }
            }
            it.onClick();
          }}
          onPointerEnter={(e) => e.pointerType !== "touch" && enter(i)}
          onPointerLeave={() => leave(i)}
          onFocus={() => enter(i)}
          onBlur={() => leave(i)}
          onPointerMove={(e) => {
            if (e.pointerType === "touch") return;
            const r = e.currentTarget.getBoundingClientRect();
            const u = (e.clientX - r.left) / r.width;
            const v = (e.clientY - r.top) / r.height;
            e.currentTarget.style.setProperty("--mx", `${(u * 100).toFixed(1)}%`);
            e.currentTarget.style.setProperty("--my", `${(v * 100).toFixed(1)}%`);
            const tl = tilt.current[i];
            if (tl && !reduced) {
              tl.ty = (u - 0.5) * 16;
              tl.tx = (0.5 - v) * 12;
            }
          }}
          style={{ opacity: 0 } as CSSProperties}
        >
          <span className="orbit-card-film" aria-hidden="true" />
          <span className="orbit-card-light" aria-hidden="true" />
          <span className="orbit-card-edge" aria-hidden="true" />
          <span className="card-index" aria-hidden="true">
            {String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
          </span>
          {it.content}
        </button>
      ))}
    </div>
  );
}

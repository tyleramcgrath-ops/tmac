"use client";

// Glass cards that orbit the Compass on a tilted ellipse. Positions are set on
// the elements every frame (no React re-render), cards behind the Compass sit
// under it and dim, the orbit slows to a stop while a card is hovered or
// focused, and light filaments run from the Compass to each card.
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export type OrbitItem = {
  key: string;
  className?: string;
  ariaLabel?: string;
  onClick: () => void;
  content: ReactNode;
};

const TAU = Math.PI * 2;
const damp = (a: number, b: number, l: number, dt: number) => a + (b - a) * (1 - Math.exp(-l * dt));

export default function OrbitField({
  items,
  reduced,
  onHover,
}: {
  items: OrbitItem[];
  reduced: boolean;
  onHover?: (on: boolean) => void;
}) {
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const lines = useRef<(SVGPathElement | null)[]>([]);
  const svg = useRef<SVGSVGElement>(null);
  const hovered = useRef<number | null>(null);
  const tilt = useRef(items.map(() => ({ x: 0, y: 0, tx: 0, ty: 0 })));
  const n = items.length;

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const start = last;
    let base = Math.PI / 4;
    let speed = 0;
    let nudge = 0;
    let px = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "touch") px = (e.clientX / innerWidth - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

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
      const rx = Math.min(W * 0.34, 640);
      const ry = compact ? H * 0.1 : H * 0.165;
      const still = reduced || compact;

      speed = damp(speed, still || hovered.current !== null ? 0 : TAU / 72, 2.4, dt);
      base += speed * dt;
      nudge = damp(nudge, still ? 0 : px * 0.22, 2, dt);
      const spacing = compact ? 1.24 : TAU / Math.max(n, 1);
      const origin = compact ? Math.PI / 2 - (spacing * (n - 1)) / 2 : base;
      svg.current?.setAttribute("viewBox", `0 0 ${W} ${H}`);

      for (let i = 0; i < n; i++) {
        const el = cards.current[i];
        if (!el) continue;
        const delay = reduced ? 0 : 0.25 + i * 0.12;
        const k = reduced ? 1 : Math.min(1, Math.max(0, (t - delay) / 1.3));
        const intro = 1 - Math.pow(1 - k, 3);
        const th = origin + i * spacing - (compact ? 0 : nudge);
        const depth = Math.sin(th);
        const front = (depth + 1) / 2;
        const float = reduced ? 0 : Math.sin(t * 0.8 + i * 1.7) * 5;
        // Phones: the cards sit side by side just under the Compass.
        const x = compact ? cx + (i - (n - 1) / 2) * W * 0.47 * intro : cx + Math.cos(th) * rx * intro;
        const y = compact ? cy + H * 0.075 * intro + float : cy + Math.sin(th) * ry * intro + float;
        const scale = (compact ? 1 : 0.7 + 0.3 * front) * (0.55 + 0.45 * intro) * (hovered.current === i ? 1.06 : 1);
        const tl = tilt.current[i] ?? { x: 0, y: 0, tx: 0, ty: 0 };
        tl.x = damp(tl.x, tl.tx, 8, dt);
        tl.y = damp(tl.y, tl.ty, 8, dt);
        const face = compact ? 0 : -Math.cos(th) * 26;
        el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) perspective(1100px) rotateY(${face + tl.y}deg) rotateX(${tl.x}deg) scale(${scale})`;
        el.style.zIndex = depth > -0.12 || compact ? "25" : "11";
        el.style.opacity = String(intro * (compact ? 1 : 0.62 + 0.38 * front));
        el.style.setProperty("--depth", front.toFixed(3));
        el.style.setProperty("--sheen", `${((th * 180) / Math.PI) % 360}deg`);
        const line = lines.current[i];
        if (line) {
          const mx = (cx + x) / 2;
          const my = Math.min(cy, y) - ry * 0.35;
          line.setAttribute("d", `M${cx} ${cy} Q${mx} ${my} ${x} ${y}`);
          line.style.opacity = String(intro * (0.15 + 0.6 * front) * (hovered.current === i ? 1.6 : 1));
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, [n, reduced]);

  const enter = (i: number) => {
    hovered.current = i;
    onHover?.(true);
  };
  const leave = (i: number) => {
    if (hovered.current === i) hovered.current = null;
    const tl = tilt.current[i];
    if (tl) tl.tx = tl.ty = 0;
    onHover?.(false);
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
      {items.map((it, i) => (
        <button
          key={it.key}
          ref={(el) => { cards.current[i] = el; }}
          className={`orbit-card ${it.className ?? ""}`}
          aria-label={it.ariaLabel}
          onClick={it.onClick}
          onPointerEnter={() => enter(i)}
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
          {it.content}
        </button>
      ))}
    </div>
  );
}

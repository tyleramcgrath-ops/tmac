"use client";

// The cards around the Compass, held still in two columns either side of it
// like holographic panels angled toward the desk. Hovering a card locks the
// Compass onto it: the needle swings to point at it, the core flares and the
// hairline between them lights up. Selected Work pages with large HUD arrows
// at the screen edges. On phones the cards become a swipe rail that snaps card
// by card (tick, short buzz) and the Compass follows whichever card is centred.
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { focus } from "@/lib/focus";
import { buzz, lock, tick } from "@/lib/sound";

export type DeckItem = {
  key: string;
  className?: string;
  ariaLabel?: string;
  onClick: () => void;
  content: ReactNode;
};

type Pager = { onPrev: () => void; onNext: () => void; prevLabel: string; nextLabel: string };

const phone = () => innerWidth <= 760;

function aimAt(el: Element | null | undefined) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  focus.x = r.left + r.width / 2;
  focus.y = r.top + r.height / 2;
  focus.active = true;
}

export default function CardDeck({
  items,
  layout,
  reduced,
  onHover,
  pager,
}: {
  items: DeckItem[];
  layout: "tiles" | "showcase";
  reduced: boolean;
  onHover?: (on: boolean) => void;
  pager?: Pager;
}) {
  const track = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const svg = useRef<SVGSVGElement>(null);
  const [current, setCurrent] = useState(0);
  const [hot, setHot] = useState<number | null>(null);
  const currentRef = useRef(0);
  const half = Math.ceil(items.length / 2);

  // Hairlines from the Compass core to the inner edge of each card, redrawn
  // while the cards rise in and whenever the window changes size.
  useEffect(() => {
    const draw = () => {
      const s = svg.current;
      if (!s) return;
      const mount = document.querySelector(".compass-mount")?.getBoundingClientRect();
      if (!mount || phone()) {
        s.replaceChildren();
        return;
      }
      s.setAttribute("viewBox", `0 0 ${innerWidth} ${innerHeight}`);
      const cx = mount.left + mount.width / 2;
      const cy = mount.top + mount.height / 2;
      s.innerHTML = cards.current
        .map((el, i) => {
          if (!el) return "";
          const r = el.getBoundingClientRect();
          const left = i < half;
          const x = left ? r.right : r.left;
          const y = r.top + r.height / 2;
          const bend = (x - cx) * 0.45;
          return `<path data-i="${i}" d="M${cx} ${cy} C${cx + bend} ${cy} ${x - bend * 0.6} ${y} ${x} ${y}"/><circle data-i="${i}" cx="${x}" cy="${y}" r="2.5"/>`;
        })
        .join("");
    };
    let raf = 0;
    const until = performance.now() + 2400;
    const loop = () => {
      draw();
      if (performance.now() < until) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    addEventListener("resize", draw);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", draw);
    };
  }, [items.length, layout, half]);

  useEffect(() => {
    svg.current?.querySelectorAll("[data-i]").forEach((el) => el.classList.toggle("hot", Number((el as SVGElement).dataset.i) === hot));
  }, [hot]);

  // Phones: which card is centred in the rail; the Compass follows it.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const settle = () => {
      if (!phone()) return;
      const mid = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      let dist = Infinity;
      cards.current.forEach((c, i) => {
        if (!c) return;
        const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
        if (d < dist) {
          dist = d;
          best = i;
        }
      });
      aimAt(cards.current[best]);
      if (best !== currentRef.current) {
        currentRef.current = best;
        setCurrent(best);
        tick(best);
        buzz(6);
      }
    };
    settle();
    el.addEventListener("scroll", settle, { passive: true });
    return () => {
      el.removeEventListener("scroll", settle);
      focus.active = false;
    };
  }, []);

  const lean = (el: HTMLElement, x: number, y: number) => {
    el.style.setProperty("--ry", `${x * 4}deg`);
    el.style.setProperty("--rx", `${-y * 3}deg`);
    el.style.setProperty("--mx", `${(x / 2 + 0.5) * 100}%`);
    el.style.setProperty("--my", `${(y / 2 + 0.5) * 100}%`);
  };

  const card = (it: DeckItem, i: number) => (
    <button
      key={it.key}
      ref={(el) => {
        cards.current[i] = el;
      }}
      className={`deck-card ${i < half ? "on-left" : "on-right"} ${it.className ?? ""} ${i === current ? "is-current" : ""} ${i === hot ? "is-hot" : ""}`}
      style={{ "--i": i } as CSSProperties}
      aria-label={it.ariaLabel}
      onClick={(e) => {
        // On a phone, tapping a card that isn't centred brings it to the
        // middle first; tapping the centred card opens it.
        if (phone() && i !== currentRef.current) {
          e.currentTarget.scrollIntoView({ behavior: reduced ? "auto" : "smooth", inline: "center", block: "nearest" });
          return;
        }
        it.onClick();
      }}
      onPointerEnter={(e) => {
        if (e.pointerType === "touch") return;
        aimAt(e.currentTarget);
        setHot(i);
        lock();
        onHover?.(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "touch") return;
        lean(e.currentTarget, 0, 0);
        focus.active = false;
        setHot(null);
        onHover?.(false);
      }}
      onFocus={(e) => {
        aimAt(e.currentTarget);
        setHot(i);
      }}
      onBlur={() => {
        if (!phone()) focus.active = false;
        setHot(null);
      }}
      onPointerMove={(e) => {
        if (e.pointerType === "touch" || reduced) return;
        const r = e.currentTarget.getBoundingClientRect();
        lean(e.currentTarget, ((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
      }}
    >
      <span className="deck-frame">
        <span className="deck-face">
          <span className="deck-sheen" aria-hidden="true" />
          <span className="deck-scan" aria-hidden="true" />
          {it.content}
        </span>
      </span>
    </button>
  );

  return (
    <div className={`deck deck--${layout}`} style={{ "--n": items.length } as CSSProperties}>
      <svg ref={svg} className="deck-links" aria-hidden="true" preserveAspectRatio="none" />
      <div className="deck-track" ref={track}>
        <div className="deck-side deck-side--left">{items.slice(0, half).map((it, i) => card(it, i))}</div>
        <div className="deck-side deck-side--right">{items.slice(half).map((it, i) => card(it, i + half))}</div>
      </div>
      {pager && (
        <>
          <button className="deck-nav deck-nav--prev" onClick={pager.onPrev} aria-label={`Previous websites, ${pager.prevLabel}`}>
            <span className="deck-nav-chevron" aria-hidden="true">‹</span>
            <span className="deck-nav-label">{pager.prevLabel}</span>
          </button>
          <button className="deck-nav deck-nav--next" onClick={pager.onNext} aria-label={`More websites, ${pager.nextLabel}`}>
            <span className="deck-nav-label">{pager.nextLabel}</span>
            <span className="deck-nav-chevron" aria-hidden="true">›</span>
          </button>
        </>
      )}
      {items.length > 1 && (
        <div className="deck-dots" aria-hidden="true">
          {items.map((it, i) => (
            <i key={it.key} className={i === current ? "on" : ""} />
          ))}
        </div>
      )}
    </div>
  );
}

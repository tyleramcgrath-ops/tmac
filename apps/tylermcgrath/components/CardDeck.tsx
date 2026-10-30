"use client";

// The cards in front of the Compass. They hold still so they can be read:
// - "tiles": the Studio and Tools cards as a row of glass tiles under the
//   Compass.
// - "showcase": Selected Work as a row of large website cards; the Compass
//   lifts and shrinks to make room (see .mode-work in immersive.css).
// On desktop a card leans a few degrees toward the cursor and a hairline of
// light links each card to the Compass. On phones the row becomes a swipe
// rail that snaps card by card, with a tick and a short buzz on each snap.
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { buzz, tick } from "@/lib/sound";

export type DeckItem = {
  key: string;
  className?: string;
  ariaLabel?: string;
  onClick: () => void;
  content: ReactNode;
};

const phone = () => innerWidth <= 760;

export default function CardDeck({
  items,
  layout,
  reduced,
  onHover,
}: {
  items: DeckItem[];
  layout: "tiles" | "showcase";
  reduced: boolean;
  onHover?: (on: boolean) => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const svg = useRef<SVGSVGElement>(null);
  const [current, setCurrent] = useState(0);
  const currentRef = useRef(0);

  // Hairlines from the Compass to each card, redrawn while the cards rise in
  // and whenever the window changes size.
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
      const cy = mount.top + mount.height * 0.62;
      const paths = cards.current.map((el) => {
        if (!el) return "";
        const r = el.getBoundingClientRect();
        const x = r.left + r.width / 2;
        const y = r.top + 2;
        return `<path d="M${cx} ${cy} C${cx} ${(cy + y) / 2} ${x} ${(cy + y) / 2} ${x} ${y}"/>`;
      });
      s.innerHTML = paths.join("");
    };
    let raf = 0;
    const until = performance.now() + 2200;
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
  }, [items.length, layout]);

  // Phones: which card is centred in the rail.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => {
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
      if (best !== currentRef.current) {
        currentRef.current = best;
        setCurrent(best);
        tick(best);
        buzz(6);
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const lean = (el: HTMLElement, x: number, y: number) => {
    el.style.setProperty("--ry", `${x * 5}deg`);
    el.style.setProperty("--rx", `${-y * 4}deg`);
    el.style.setProperty("--mx", `${(x / 2 + 0.5) * 100}%`);
    el.style.setProperty("--my", `${(y / 2 + 0.5) * 100}%`);
  };

  return (
    <div className={`deck deck--${layout}`} style={{ "--n": items.length } as CSSProperties}>
      <svg ref={svg} className="deck-links" aria-hidden="true" preserveAspectRatio="none" />
      <div className="deck-track" ref={track}>
        {items.map((it, i) => (
          <button
            key={it.key}
            ref={(el) => {
              cards.current[i] = el;
            }}
            className={`deck-card ${it.className ?? ""} ${i === current ? "is-current" : ""}`}
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
              tick(i);
              onHover?.(true);
            }}
            onPointerLeave={(e) => {
              lean(e.currentTarget, 0, 0);
              onHover?.(false);
            }}
            onPointerMove={(e) => {
              if (e.pointerType === "touch" || reduced) return;
              const r = e.currentTarget.getBoundingClientRect();
              lean(e.currentTarget, ((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
            }}
          >
            <span className="deck-sheen" aria-hidden="true" />
            {it.content}
          </button>
        ))}
      </div>
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

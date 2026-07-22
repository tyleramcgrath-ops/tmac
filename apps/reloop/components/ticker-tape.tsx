import { TICKER } from "@/lib/sample-data";

function TickerRow() {
  return (
    <>
      {TICKER.map((t, i) => (
        <div
          key={i}
          className="flex items-center gap-2 whitespace-nowrap px-6 font-mono text-[13px]"
        >
          <span className="text-ink-dim">{t.item}</span>
          <span className="text-ink-mute">· {t.platform}</span>
          <span className="font-medium text-ink">${t.price}</span>
          <span className={t.delta >= 0 ? "tape-up text-accent" : "tape-down text-fall"}>
            {t.delta >= 0 ? "+" : ""}
            {t.delta}%
          </span>
        </div>
      ))}
    </>
  );
}

export function TickerTape() {
  return (
    <div className="overflow-hidden border-y border-border/80 bg-surface py-3">
      <div className="marquee-track">
        <TickerRow />
        <TickerRow />
      </div>
    </div>
  );
}

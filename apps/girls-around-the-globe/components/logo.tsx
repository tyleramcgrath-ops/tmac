import { useId } from "react";

// Globe whose meridians meet in a heart, with a travel orbit around it.
export function Logo({ size = 32 }: { size?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff2e88" />
          <stop offset="0.55" stopColor="#ff5f5f" />
          <stop offset="1" stopColor="#ffb547" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="17" fill={`url(#g${id})`} />
      <path d="M7 24h34M10 15h28M10 33h28" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.5" fill="none" />
      <ellipse cx="24" cy="24" rx="7.5" ry="17" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.5" fill="none" />
      <path
        d="M24 32.5s-8-4.9-8-10.2a4.4 4.4 0 0 1 8-2.5 4.4 4.4 0 0 1 8 2.5c0 5.3-8 10.2-8 10.2z"
        fill="#fff"
      />
      <ellipse cx="24" cy="24" rx="23" ry="8" fill="none" stroke="var(--ink)" strokeOpacity="0.85" strokeWidth="1.6" transform="rotate(-24 24 24)" strokeDasharray="0 0 52 6 200" />
      <circle cx="44" cy="15.5" r="2.4" fill="var(--gold)" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="font-display text-lg font-semibold leading-none tracking-tight sm:text-xl">
      Girls <span className="text-sunset italic">Around</span> the Globe
    </span>
  );
}

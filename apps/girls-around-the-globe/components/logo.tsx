import { useId } from "react";

// "Night Globe": a crescent moon whose lit side is a globe, with a spark of a
// star. It's always night somewhere.
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
        <mask id={`m${id}`}>
          <rect width="48" height="48" fill="#fff" />
          <circle cx="33" cy="17" r="15" fill="#000" />
        </mask>
        <clipPath id={`c${id}`}>
          <circle cx="22" cy="26" r="19" />
        </clipPath>
      </defs>
      <g mask={`url(#m${id})`}>
        <circle cx="22" cy="26" r="19" fill={`url(#g${id})`} />
        <g clipPath={`url(#c${id})`} stroke="#0d0914" strokeOpacity="0.45" strokeWidth="1.6" fill="none">
          <path d="M2 26h40M5 16h34M5 36h34" />
          <ellipse cx="22" cy="26" rx="8" ry="19" />
        </g>
      </g>
      <path d="M38 4l1.6 4.4L44 10l-4.4 1.6L38 16l-1.6-4.4L32 10l4.4-1.6z" fill="#ffb547" />
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

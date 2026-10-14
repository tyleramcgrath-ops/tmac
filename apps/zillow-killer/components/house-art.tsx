import type { Listing } from "@/lib/listings";

// Stand-in for listing photography in the prototype. Production listings use
// the seller's guided-capture photos (PLAN.md §5).
export function HouseArt({
  listing,
  variant = "exterior",
  className = "",
}: {
  listing: Pick<Listing, "palette" | "type">;
  variant?: "exterior" | "dusk";
  className?: string;
}) {
  const { body, roof, door, sky } = listing.palette;
  const dusk = variant === "dusk";
  const tall = listing.type !== "Single family";
  return (
    <svg viewBox="0 0 400 260" className={className} preserveAspectRatio="xMidYMid slice" role="img" aria-label="Home illustration">
      <defs>
        <linearGradient id={`sky-${variant}-${body}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={dusk ? "#2b3a5c" : sky} />
          <stop offset="1" stopColor={dusk ? "#e9a07a" : "#ffffff"} />
        </linearGradient>
      </defs>
      <rect width="400" height="260" fill={`url(#sky-${variant}-${body})`} />
      <circle cx="320" cy="60" r="22" fill={dusk ? "#ffd7a1" : "#fff6d8"} opacity="0.9" />
      <rect y="200" width="400" height="60" fill="#8fb27a" />
      <ellipse cx="60" cy="196" rx="40" ry="34" fill="#5f8f5a" />
      <rect x="56" y="196" width="6" height="16" fill="#5b4636" />
      <path d="M352 120c8-30 8-30 14-4 18-14 18-10 8 8 18 0 16 4-2 10l-4 70h-8l-2-70c-20-4-20-8-6-14z" fill="#4f7d4b" />
      {tall ? (
        <g>
          <rect x="130" y="70" width="150" height="132" fill={body} />
          <rect x="124" y="62" width="162" height="10" fill={roof} />
          {[0, 1, 2].map((r) =>
            [0, 1, 2].map((c) => (
              <rect key={`${r}${c}`} x={146 + c * 44} y={84 + r * 34} width="28" height="20" fill={dusk ? "#ffd27a" : "#bcd6e8"} />
            )),
          )}
          <rect x="192" y="168" width="26" height="34" fill={door} />
        </g>
      ) : (
        <g>
          <path d="M100 120 200 58l100 62z" fill={roof} />
          <rect x="112" y="118" width="176" height="84" fill={body} />
          <rect x="130" y="138" width="36" height="28" fill={dusk ? "#ffd27a" : "#bcd6e8"} />
          <rect x="234" y="138" width="36" height="28" fill={dusk ? "#ffd27a" : "#bcd6e8"} />
          <rect x="186" y="150" width="28" height="52" fill={door} />
          <circle cx="208" cy="178" r="2" fill="#f2d48a" />
        </g>
      )}
      <rect x="180" y="202" width="40" height="58" fill="#d8d2c4" />
    </svg>
  );
}

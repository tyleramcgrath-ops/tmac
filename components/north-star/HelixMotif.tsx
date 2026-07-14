/**
 * Abstract, decorative-only motif suggesting two strands of understanding
 * growing together over time. Deliberately smooth and asymmetric — no
 * rungs, no lab/medical framing. aria-hidden: purely visual texture.
 */
export function HelixMotif({ className }: { className?: string }) {
  return (
    <div className={`ns-helix-wrap ${className ?? ''}`} aria-hidden="true">
      <svg
        className="ns-helix-svg"
        viewBox="0 0 220 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 0 C 100 40, 20 90, 100 130 C 180 170, 100 220, 20 260 C -60 300, 20 350, 100 390 C 140 405, 160 415, 180 420"
          stroke="url(#nsHelixA)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M180 0 C 100 40, 180 90, 100 130 C 20 170, 100 220, 180 260 C 260 300, 180 350, 100 390 C 60 405, 40 415, 20 420"
          stroke="url(#nsHelixB)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="nsHelixA" x1="0" y1="0" x2="0" y2="420" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4f8bff" stopOpacity="0" />
            <stop offset="35%" stopColor="#4f8bff" stopOpacity="0.55" />
            <stop offset="70%" stopColor="#22d3ee" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="nsHelixB" x1="0" y1="0" x2="0" y2="420" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7c5cff" stopOpacity="0" />
            <stop offset="35%" stopColor="#7c5cff" stopOpacity="0.4" />
            <stop offset="70%" stopColor="#4f8bff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#4f8bff" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

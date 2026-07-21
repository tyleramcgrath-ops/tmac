/* TruePoint Systems logo — interlocking TP monogram (two greens) plus a
   white→green wordmark and gold "SYSTEMS", tuned for the dark UI. */

export function TpMark({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="TruePoint Systems"
    >
      <defs>
        <linearGradient id="tp-t" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#2f5f2a" />
          <stop offset="1" stopColor="#15300f" />
        </linearGradient>
        <linearGradient id="tp-p" x1="0.1" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#63bb52" />
          <stop offset="1" stopColor="#357c2c" />
        </linearGradient>
      </defs>

      {/* subtle drop shadow under the stems */}
      <g opacity="0.45" filter="none">
        <path d="M27 18 H43 V92 H27 Z" fill="#000" transform="translate(2 3)" />
      </g>

      {/* T (dark green) */}
      <path d="M5 11 H58 V27 H41 V91 H25 V27 H5 Z" fill="url(#tp-t)" />
      {/* highlight bevel on the T's top edge */}
      <path d="M5 11 H58 V15 H5 Z" fill="#ffffff" opacity="0.12" />

      {/* P (bright green) with a real counter (evenodd hole) */}
      <path
        fillRule="evenodd"
        d="M52 11 H70 C82.5 11 91 20 91 32.5 C91 45 82.5 54 70 54 H68 V91 H52 Z
           M68 26 H70 C74.5 26 77 28.8 77 32.5 C77 36.2 74.5 39 70 39 H68 Z"
        fill="url(#tp-p)"
      />
      <path d="M52 11 H70 C74 11 77.6 11.9 80.6 13.5 L79 17 C76.4 15.7 73.3 15 70 15 H52 Z" fill="#ffffff" opacity="0.14" />
    </svg>
  )
}

export function TpLogo({
  className = '',
  markClass = 'h-9 w-9',
}: {
  className?: string
  markClass?: string
}) {
  return (
    <span className={`tp-brand ${className}`}>
      <TpMark className={markClass} />
      <span className="tp-word">TRUEPOINT</span>
      <span className="tp-brand-sub">Systems</span>
    </span>
  )
}

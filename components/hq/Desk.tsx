'use client'

/**
 * The executive desk (Bible §03). A clean command surface: dark walnut top,
 * black stone body, one narrow brass alignment line, and the flush
 * projection base from which the Core's light rises. Nothing else is
 * permitted at rest — no widgets, no ornaments, no chrome.
 */

// Projection base center on the desk surface (stage coordinates).
export const BASE_X = 960
export const BASE_Y = 850

export function Desk() {
  return (
    <svg className="hq-desk" viewBox="0 0 1920 1080" aria-hidden>
      <defs>
        <linearGradient id="hq-walnut" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#221610" />
          <stop offset="0.55" stopColor="#31200f" />
          <stop offset="1" stopColor="#3b2a18" />
        </linearGradient>
        <linearGradient id="hq-desk-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#17161a" />
          <stop offset="0.12" stopColor="#111014" />
          <stop offset="1" stopColor="#0a0a0d" />
        </linearGradient>
        <linearGradient id="hq-desk-brass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#C9A877" stopOpacity="0.15" />
          <stop offset="0.5" stopColor="#E0C496" stopOpacity="0.9" />
          <stop offset="1" stopColor="#C9A877" stopOpacity="0.15" />
        </linearGradient>
        <radialGradient id="hq-base-disc" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#141317" />
          <stop offset="0.72" stopColor="#0a0a0c" />
          <stop offset="1" stopColor="#1c1a17" />
        </radialGradient>
        <pattern id="hq-grain" width="6" height="5" patternUnits="userSpaceOnUse">
          <rect width="6" height="5" fill="none" />
          <path d="M0 1.2 H6 M0 3.6 H6" stroke="#000" strokeWidth="0.6" opacity="0.16" />
        </pattern>
      </defs>

      {/* Contact shadow anchoring the desk to the stone floor. */}
      <ellipse cx="960" cy="1002" rx="360" ry="22" fill="#000" opacity="0.5" />

      {/* Plinth — the desk floats a breath above its shadow line. */}
      <rect x="668" y="982" width="584" height="24" fill="#08080a" />

      {/* Stone front face. */}
      <polygon points="640,884 1280,884 1272,986 648,986" fill="url(#hq-desk-face)" />
      {/* Faint marble veining, almost subliminal. */}
      <g fill="none" stroke="#b9c0c9" opacity="0.045">
        <path d="M700 910 C 800 902 850 930 960 918 C1050 908 1090 934 1180 922" strokeWidth="1" />
        <path d="M760 958 C 860 948 940 966 1060 952" strokeWidth="0.8" />
      </g>
      {/* Brass hairline under the top slab's lip. */}
      <rect x="642" y="884" width="636" height="1.5" fill="url(#hq-desk-brass)" opacity="0.5" />

      {/* Walnut top — a shallow trapezoid under the slight downward camera. */}
      <polygon points="700,826 1220,826 1280,884 640,884" fill="url(#hq-walnut)" />
      <polygon points="700,826 1220,826 1280,884 640,884" fill="url(#hq-grain)" />
      {/* Specular sheen across the lacquer. */}
      <polygon points="742,838 1178,838 1210,862 710,862" fill="#f3efe6" opacity="0.028" />
      {/* Back edge shadow where the top meets the room. */}
      <polygon points="700,826 1220,826 1216,830 704,830" fill="#000" opacity="0.4" />
      {/* The one narrow brass alignment line (Bible §03). */}
      <rect x="654" y="869" width="612" height="1.8" fill="url(#hq-desk-brass)" />

      {/* ——— Projection base, integrated flush into the walnut ——— */}
      <g>
        <ellipse cx={BASE_X} cy={BASE_Y} rx="68" ry="11.5" fill="#0b0a0c" />
        <ellipse cx={BASE_X} cy={BASE_Y} rx="68" ry="11.5" fill="none" stroke="url(#hq-desk-brass)" strokeWidth="1.6" />
        <ellipse cx={BASE_X} cy={BASE_Y} rx="54" ry="9" fill="none" stroke="#6d5c40" strokeWidth="0.8" opacity="0.8" />
        {/* Engraved radial ticks. */}
        <g className="hq-base-ticks" stroke="#8a744f" strokeWidth="1" opacity="0.6">
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2
            const c = Math.cos(a)
            const s = Math.sin(a)
            return (
              <line
                key={i}
                x1={BASE_X + c * 58}
                y1={BASE_Y + s * 9.8}
                x2={BASE_X + c * 65}
                y2={BASE_Y + s * 11}
              />
            )
          })}
        </g>
        {/* Obsidian emitter disc — warms when the Core is active. */}
        <ellipse cx={BASE_X} cy={BASE_Y} rx="36" ry="6" fill="url(#hq-base-disc)" />
        <ellipse cx={BASE_X} cy={BASE_Y} rx="20" ry="3.4" className="hq-base-ember" />
      </g>
    </svg>
  )
}

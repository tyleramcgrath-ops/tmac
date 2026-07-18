// SVG filter primitives that give the room its materials and atmosphere.
// Rendered once, referenced by CSS/SVG elsewhere. Static (no animated
// turbulence) so they cost nothing after first paint.
// Ported verbatim from the confirmed North Star Executive Office baseline
// (north-star-station @ 546fb87).
export default function RoomFilters() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none absolute size-0"
    >
      <defs>
        {/* soft volumetric haze / fog */}
        <filter id="ns-fog" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.011"
            numOctaves="2"
            seed="7"
            stitchTiles="stitch"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.60  0 0 0 0 0.66  0 0 0 0 0.76  0 0 0 0.55 0"
          />
        </filter>

        {/* veined dark stone for the table */}
        <filter id="ns-marble" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.006 0.017"
            numOctaves="4"
            seed="3"
            stitchTiles="stitch"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.74  0 0 0 0 0.72  0 0 0 0 0.67  0 0 0 0.75 0"
          />
          <feGaussianBlur stdDeviation="0.35" />
        </filter>

        {/* fine cinematic film grain */}
        <filter id="ns-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            seed="11"
            stitchTiles="stitch"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0"
          />
        </filter>

        {/* dense warm city-window lights */}
        <filter id="ns-city" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="turbulence"
            baseFrequency="0.16 0.09"
            numOctaves="2"
            seed="5"
            stitchTiles="stitch"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.99  0 0 0 0 0.85  0 0 0 0 0.55  0 0 0 1.1 -0.35"
          />
        </filter>
      </defs>
    </svg>
  );
}

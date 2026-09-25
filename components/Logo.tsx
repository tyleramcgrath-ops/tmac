// An opening and a closing quote mark, the "say" in SaySites, that together
// make an S. Drawn in currentColor so it works on light and dark.
export function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <g fill="currentColor">
        <circle cx="19" cy="19" r="7.5" />
        <path d="M11.5 19C11.5 10.7 17.9 4.7 26.5 4.1v5.2c-5.2.5-9 4.1-9.6 9.7z" />
        <circle cx="29" cy="29" r="7.5" />
        <path d="M36.5 29C36.5 37.3 30.1 43.3 21.5 43.9v-5.2c5.2-.5 9-4.1 9.6-9.7z" />
      </g>
    </svg>
  )
}

// The wordmark: bold "say", a slightly softer "sites" (72% of the text
// colour, readable on light and dark), and one comma from the mark as the
// dot on the i. The comma keeps the full text colour. Screen readers hear
// "SaySites" rather than the letters with the dotless ı.
export function Wordmark() {
  return (
    <span className="wordmark">
      <span className="visually-hidden">SaySites</span>
      <b aria-hidden="true">say</b>
      <span className="wm-lt" aria-hidden="true">s</span>
      <span className="wm-i" aria-hidden="true">
        <span className="wm-lt">ı</span>
        <svg viewBox="16 16 26 30" aria-hidden="true">
          <g fill="currentColor">
            <circle cx="29" cy="29" r="7.5" />
            <path d="M36.5 29C36.5 37.3 30.1 43.3 21.5 43.9v-5.2c5.2-.5 9-4.1 9.6-9.7z" />
          </g>
        </svg>
      </span>
      <span className="wm-lt" aria-hidden="true">tes</span>
    </span>
  )
}

export function Logo() {
  return (
    <a className="logo" href="/">
      <LogoMark size={35} />
      <Wordmark />
    </a>
  )
}

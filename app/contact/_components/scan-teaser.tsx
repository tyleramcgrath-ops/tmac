'use client'

import { Check, X } from 'lucide-react'

// A scaled-down, static illustration of what the scanner produces, marked as
// an example. The live version — with real model answers — is at /contact/app.

const ROWS = [
  { prompt: 'best cbd gummies for sleep', mentioned: false, detail: 'Charlotte’s Web, FOCL, cbdMD' },
  { prompt: 'strongest legal thc gummies', mentioned: true, detail: '2nd of 5 named' },
  { prompt: 'is botany farms legit', mentioned: true, detail: 'recommended, 1st' },
  { prompt: 'delta 8 vs delta 9 which to buy', mentioned: false, detail: 'Delta Munchies, 3Chi' },
]

export function ScanTeaser() {
  return (
    <div
      className="ctc-teaser"
      role="img"
      aria-label="Example visibility scan showing a score of 42 and four buyer questions, two of which name the brand"
    >
      <div className="ctc-teaser-head">
        <div className="ctc-stack" style={{ gap: 2 }}>
          <span className="ctc-eyebrow">Visibility scan</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--t-lg)' }}>
            Botany Farms
          </span>
        </div>
        <span className="ctc-chip ctc-chip-mono ctc-chip-ember">Example</span>
      </div>

      <div className="ctc-teaser-score">
        <div className="ctc-stack ctc-g1">
          <span className="ctc-stat" style={{ color: 'var(--warn)' }}>
            42
          </span>
          <span className="ctc-eyebrow">Visibility score · patchy</span>
        </div>
        <div className="ctc-teaser-bars" aria-hidden="true">
          {[
            { name: 'FOCL', width: 100 },
            { name: 'Delta Munchies', width: 76 },
            { name: 'Botany Farms', width: 48, brand: true },
            { name: 'cbdMD', width: 32 },
          ].map((bar) => (
            <div key={bar.name} className="ctc-teaser-bar">
              <span className={`ctc-teaser-bar-name ${bar.brand ? 'ctc-teaser-bar-brand' : ''}`}>
                {bar.name}
              </span>
              <span className="ctc-teaser-bar-track">
                <span
                  className="ctc-teaser-bar-fill"
                  style={{
                    width: `${bar.width}%`,
                    background: bar.brand ? 'var(--ember)' : 'var(--line-strong)',
                  }}
                />
              </span>
            </div>
          ))}
        </div>
      </div>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {ROWS.map((row, index) => (
          <li
            key={row.prompt}
            className="ctc-teaser-row"
            style={{
              animation: 'ctc-pop var(--d-4) var(--e-spring) both',
              animationDelay: `${420 + index * 110}ms`,
            }}
          >
            <span
              className="ctc-teaser-mark"
              style={{ color: row.mentioned ? 'var(--win)' : 'var(--miss)' }}
            >
              {row.mentioned ? <Check size={13} aria-hidden="true" /> : <X size={13} aria-hidden="true" />}
            </span>
            <div className="ctc-stack ctc-grow" style={{ gap: 1, minWidth: 0 }}>
              <span className="ctc-truncate" style={{ fontSize: 'var(--t-sm)' }}>
                {row.prompt}
              </span>
              <span className="ctc-faint ctc-truncate" style={{ fontSize: 'var(--t-2xs)' }}>
                {row.detail}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <div className="ctc-teaser-foot">
        <span className="ctc-faint" style={{ fontSize: 'var(--t-2xs)' }}>
          2 of 6 answers named the brand
        </span>
      </div>
    </div>
  )
}

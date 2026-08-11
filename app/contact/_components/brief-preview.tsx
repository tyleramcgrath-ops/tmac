'use client'

import { ArrowUpRight, Mail, MessageSquare, Phone } from 'lucide-react'
import { Avatar, Warmth } from './primitives'

// The landing page's hero object: a scaled-down, static illustration of what
// the workspace produces. Marked as an example — the live brief is generated
// by the model inside /contact/app.

const EXAMPLE = [
  {
    name: 'Kwame Mensah',
    role: 'Staff Engineer, Beacon Row',
    headline: 'Said to ask again in a year',
    warmth: 24,
    urgency: 'Reach out today',
    channel: 'text' as const,
    opener:
      'It has been a year almost to the week since you said to ask again. Consider this the asking.',
  },
  {
    name: 'Mira Kalinski',
    role: 'CFO, Halcyon Systems',
    headline: 'Offered to review the model, never asked',
    warmth: 18,
    urgency: 'This week',
    channel: 'email' as const,
    opener:
      'You offered to look over our model at the Fieldnote dinner. I am finally organised enough to take you up on it.',
  },
  {
    name: 'Elena Vásquez',
    role: 'GM Platform, Cadence Retail',
    headline: 'Budget freeze lifted in July',
    warmth: 31,
    urgency: 'This week',
    channel: 'email' as const,
    opener:
      'You mentioned the freeze lifts with the new fiscal year. That was July — is the platform work back on the table?',
  },
]

const CHANNEL_ICON = {
  email: Mail,
  text: MessageSquare,
  call: Phone,
}

export function BriefPreview() {
  return (
    <div className="ctc-preview ctc-card" role="img" aria-label="Example weekly brief showing three prioritised people to reconnect with">
      <div
        className="ctc-between"
        style={{
          padding: 'var(--s-4) var(--s-5)',
          borderBottom: '1px solid var(--line)',
          gap: 'var(--s-3)',
        }}
      >
        <div className="ctc-stack" style={{ gap: 2 }}>
          <span className="ctc-eyebrow">Monday brief</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--t-lg)' }}>
            Hiring a founding designer
          </span>
        </div>
        <span className="ctc-chip ctc-chip-mono ctc-chip-ember">Example</span>
      </div>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {EXAMPLE.map((item, i) => {
          const Icon = CHANNEL_ICON[item.channel]
          return (
            <li
              key={item.name}
              className="ctc-preview-row"
              style={{
                animation: `ctc-pop var(--d-4) var(--e-spring) both`,
                animationDelay: `${420 + i * 130}ms`,
              }}
            >
              <div className="ctc-row ctc-g3" style={{ alignItems: 'flex-start' }}>
                <span className="ctc-num ctc-faint" style={{ fontSize: 'var(--t-xs)', width: 16, paddingTop: 10 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <Avatar name={item.name} />
                <div className="ctc-grow ctc-stack ctc-g2">
                  <div className="ctc-between ctc-g3" style={{ alignItems: 'flex-start' }}>
                    <div className="ctc-stack" style={{ gap: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 600, fontSize: 'var(--t-base)' }}>{item.name}</span>
                      <span className="ctc-faint ctc-truncate" style={{ fontSize: 'var(--t-xs)' }}>
                        {item.role}
                      </span>
                    </div>
                    <Warmth value={item.warmth} label={false} />
                  </div>

                  <p
                    className="ctc-serif-italic"
                    style={{ fontSize: 'var(--t-base)', lineHeight: 1.4, color: 'var(--ink-soft)' }}
                  >
                    “{item.headline}”
                  </p>

                  <div className="ctc-preview-quote">
                    <p style={{ fontSize: 'var(--t-sm)', color: 'var(--ink-muted)', lineHeight: 1.5 }}>
                      {item.opener}
                    </p>
                  </div>

                  <div className="ctc-row ctc-g2 ctc-wrapflex">
                    <span className={`ctc-chip ${i === 0 ? 'ctc-chip-ember' : 'ctc-chip-gold'}`}>
                      <span className="ctc-dot" />
                      {item.urgency}
                    </span>
                    <span className="ctc-chip">
                      <Icon size={11} aria-hidden="true" />
                      {item.channel === 'text' ? 'Text' : 'Email'}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      <div
        className="ctc-between"
        style={{ padding: 'var(--s-3) var(--s-5)', borderTop: '1px solid var(--line)' }}
      >
        <span className="ctc-faint" style={{ fontSize: 'var(--t-xs)' }}>
          21 more in your network, quietly cooling
        </span>
        <span className="ctc-row ctc-g1" style={{ fontSize: 'var(--t-xs)', color: 'var(--ember)' }}>
          Open <ArrowUpRight size={13} aria-hidden="true" />
        </span>
      </div>
    </div>
  )
}

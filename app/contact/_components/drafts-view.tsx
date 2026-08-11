'use client'

import { Check, Copy, Send, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { timeAgoFromMs } from '../_lib/format'
import { useStore } from '../_lib/store'
import { CHANNEL_LABEL, TONE_LABEL } from '../_lib/types'
import { Avatar } from './primitives'

export function DraftsView() {
  const { drafts, markDraftSent, removeDraft } = useStore()
  const [copiedId, setCopiedId] = useState<string | null>(null)

  async function copy(id: string, body: string) {
    try {
      await navigator.clipboard.writeText(body)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1600)
    } catch {
      setCopiedId(null)
    }
  }

  return (
    <div className="ctc-stack ctc-g5">
      <div className="ctc-stack ctc-g1">
        <h1 className="ctc-h2" style={{ fontSize: 'var(--t-2xl)' }}>
          Drafts
        </h1>
        <p className="ctc-muted" style={{ fontSize: 'var(--t-sm)' }}>
          Everything written for you, and everything you marked as sent.
        </p>
      </div>

      {drafts.length === 0 ? (
        <div className="ctc-card ctc-empty">
          <div className="ctc-empty-mark" aria-hidden="true">
            <svg width="96" height="66" viewBox="0 0 96 66" fill="none">
              <rect x="8" y="10" width="80" height="48" rx="6" fill="var(--paper-sunk)" stroke="var(--line-strong)" />
              <path d="M8 16l40 24 40-24" stroke="var(--line-strong)" strokeWidth="1.2" fill="none" />
              <circle cx="78" cy="16" r="6" fill="var(--ember)" />
            </svg>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--t-lg)' }}>
            No drafts yet.
          </h2>
          <p className="ctc-muted" style={{ fontSize: 'var(--t-sm)', maxWidth: '40ch', margin: '0 auto' }}>
            Run a brief, pick a name, and the message written for them lands here.
          </p>
        </div>
      ) : (
        <ul className="ctc-stack ctc-g4" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {drafts.map((draft) => (
            <li key={draft.id} className="ctc-card ctc-draft">
              <div className="ctc-between ctc-wrapflex ctc-g3">
                <div className="ctc-row ctc-g3">
                  <Avatar name={draft.personName} />
                  <div className="ctc-stack" style={{ gap: 1 }}>
                    <span style={{ fontWeight: 600, fontSize: 'var(--t-sm)' }}>{draft.personName}</span>
                    <span className="ctc-faint ctc-num" style={{ fontSize: 'var(--t-2xs)' }}>
                      {CHANNEL_LABEL[draft.channel]} · {TONE_LABEL[draft.tone]} ·{' '}
                      {timeAgoFromMs(draft.createdAt)}
                    </span>
                  </div>
                </div>
                {draft.sent ? (
                  <span className="ctc-chip ctc-chip-moss">
                    <Check size={11} aria-hidden="true" /> Sent
                  </span>
                ) : (
                  <span className="ctc-chip ctc-chip-gold">
                    <span className="ctc-dot" /> Draft
                  </span>
                )}
              </div>

              <p className="ctc-sheet-text" style={{ marginTop: 'var(--s-3)' }}>
                {draft.body}
              </p>

              <div className="ctc-row ctc-g2 ctc-wrapflex" style={{ marginTop: 'var(--s-4)' }}>
                <button
                  type="button"
                  className="ctc-btn ctc-btn-quiet ctc-btn-sm"
                  onClick={() => copy(draft.id, draft.body)}
                >
                  {copiedId === draft.id ? (
                    <Check size={12} aria-hidden="true" />
                  ) : (
                    <Copy size={12} aria-hidden="true" />
                  )}
                  {copiedId === draft.id ? 'Copied' : 'Copy'}
                </button>
                {!draft.sent ? (
                  <button
                    type="button"
                    className="ctc-btn ctc-btn-primary ctc-btn-sm"
                    onClick={() => markDraftSent(draft.id)}
                  >
                    <Send size={12} aria-hidden="true" /> Mark sent
                  </button>
                ) : null}
                <button
                  type="button"
                  className="ctc-btn ctc-btn-ghost ctc-btn-sm"
                  onClick={() => removeDraft(draft.id)}
                >
                  <Trash2 size={12} aria-hidden="true" /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

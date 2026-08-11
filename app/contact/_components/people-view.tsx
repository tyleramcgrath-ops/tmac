'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { PenLine, Plus, Search, Trash2, X } from 'lucide-react'
import { baseWarmth, sinceLabel, warmthWord } from '../_lib/format'
import { newId, useStore } from '../_lib/store'
import { CHANNEL_LABEL, type Channel, type Circle, type Person } from '../_lib/types'
import { Avatar, Warmth } from './primitives'
import type { DraftTarget } from './draft-drawer'

const CIRCLES: { value: Circle | 'all'; label: string }[] = [
  { value: 'all', label: 'Everyone' },
  { value: 'inner', label: 'Inner circle' },
  { value: 'active', label: 'Active' },
  { value: 'dormant', label: 'Dormant' },
]

export function PeopleView({ onDraft }: { onDraft: (target: DraftTarget) => void }) {
  const { people, removePerson } = useStore()
  const [query, setQuery] = useState('')
  const [circle, setCircle] = useState<Circle | 'all'>('all')
  const [adding, setAdding] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return people
      .filter((person) => (circle === 'all' ? true : person.circle === circle))
      .filter((person) =>
        q
          ? [person.name, person.company, person.role, person.notes, person.context, ...person.tags]
              .join(' ')
              .toLowerCase()
              .includes(q)
          : true
      )
      .sort((a, b) => baseWarmth(a) - baseWarmth(b))
  }, [people, query, circle])

  return (
    <div className="ctc-stack ctc-g5">
      <div className="ctc-between ctc-wrapflex ctc-g3">
        <div className="ctc-stack ctc-g1">
          <h1 className="ctc-h2" style={{ fontSize: 'var(--t-2xl)' }}>
            Your people
          </h1>
          <p className="ctc-muted" style={{ fontSize: 'var(--t-sm)' }}>
            Coldest first — the ones nearest to being lost.
          </p>
        </div>
        <button type="button" className="ctc-btn ctc-btn-ember" onClick={() => setAdding(true)}>
          <Plus size={15} aria-hidden="true" /> Add someone
        </button>
      </div>

      <div className="ctc-between ctc-wrapflex ctc-g3">
        <div className="ctc-search">
          <Search size={14} aria-hidden="true" className="ctc-search-icon" />
          <label className="ctc-sr" htmlFor="ctc-search">
            Search your network
          </label>
          <input
            id="ctc-search"
            className="ctc-input"
            style={{ paddingLeft: 36 }}
            placeholder="Search names, companies, notes…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query ? (
            <button
              type="button"
              className="ctc-search-clear"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              <X size={13} aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div className="ctc-segment" role="group" aria-label="Filter by circle">
          {CIRCLES.map((option) => (
            <button
              key={option.value}
              type="button"
              className="ctc-segment-btn"
              aria-pressed={circle === option.value}
              onClick={() => setCircle(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="ctc-card ctc-empty">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--t-lg)' }}>
            Nobody matches that.
          </h2>
          <p className="ctc-muted" style={{ fontSize: 'var(--t-sm)' }}>
            Try a looser search, or add the person you were looking for.
          </p>
          <div className="ctc-row ctc-g2" style={{ justifyContent: 'center', marginTop: 'var(--s-4)' }}>
            <button
              type="button"
              className="ctc-btn ctc-btn-quiet ctc-btn-sm"
              onClick={() => {
                setQuery('')
                setCircle('all')
              }}
            >
              Clear filters
            </button>
            <button type="button" className="ctc-btn ctc-btn-ember ctc-btn-sm" onClick={() => setAdding(true)}>
              <Plus size={13} aria-hidden="true" /> Add someone
            </button>
          </div>
        </div>
      ) : (
        <div className="ctc-card" style={{ overflow: 'hidden' }}>
          <table className="ctc-table">
            <caption className="ctc-sr">
              {filtered.length} people in your network, coldest first
            </caption>
            <thead>
              <tr>
                <th scope="col">Person</th>
                <th scope="col" className="ctc-col-context">
                  How you know them
                </th>
                <th scope="col" className="ctc-col-num">
                  Last spoke
                </th>
                <th scope="col" className="ctc-col-num">
                  Warmth
                </th>
                <th scope="col">
                  <span className="ctc-sr">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((person) => {
                const warmth = baseWarmth(person)
                return (
                  <tr key={person.id}>
                    <td>
                      <div className="ctc-row ctc-g3">
                        <Avatar name={person.name} />
                        <div className="ctc-stack" style={{ gap: 1, minWidth: 0 }}>
                          <span style={{ fontWeight: 600, fontSize: 'var(--t-sm)' }}>{person.name}</span>
                          <span className="ctc-faint ctc-truncate" style={{ fontSize: 'var(--t-xs)' }}>
                            {person.role}
                            {person.company ? ` · ${person.company}` : ''}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="ctc-col-context">
                      <span className="ctc-muted ctc-clamp2" style={{ fontSize: 'var(--t-xs)' }}>
                        {person.context}
                      </span>
                      <div className="ctc-row ctc-g1 ctc-wrapflex" style={{ marginTop: 5 }}>
                        {person.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="ctc-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="ctc-col-num">
                      <span className="ctc-num" style={{ fontSize: 'var(--t-xs)' }}>
                        {sinceLabel(person.lastContact)}
                      </span>
                      <div className="ctc-faint" style={{ fontSize: 'var(--t-2xs)' }}>
                        {CHANNEL_LABEL[person.channel]}
                      </div>
                    </td>
                    <td className="ctc-col-num">
                      <div className="ctc-stack ctc-g1">
                        <Warmth value={warmth} height={14} />
                        <span className="ctc-faint" style={{ fontSize: 'var(--t-2xs)' }}>
                          {warmthWord(warmth)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="ctc-row ctc-g1 ctc-row-actions">
                        <button
                          type="button"
                          className="ctc-btn ctc-btn-quiet ctc-btn-sm"
                          onClick={() => onDraft({ person, intent: '' })}
                        >
                          <PenLine size={12} aria-hidden="true" /> Write
                        </button>
                        {person.custom ? (
                          <button
                            type="button"
                            className="ctc-icon-btn"
                            onClick={() => removePerson(person.id)}
                            aria-label={`Remove ${person.name}`}
                          >
                            <Trash2 size={14} aria-hidden="true" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {adding ? <AddPersonDialog onClose={() => setAdding(false)} /> : null}
    </div>
  )
}

function AddPersonDialog({ onClose }: { onClose: () => void }) {
  const { addPerson } = useStore()
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [company, setCompany] = useState('')
  const [context, setContext] = useState('')
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState('')
  const [lastContact, setLastContact] = useState(new Date().toISOString().slice(0, 10))
  const [channel, setChannel] = useState<Channel>('email')
  const [circle, setCircle] = useState<Circle>('active')
  const [error, setError] = useState<string | null>(null)

  function submit(event: FormEvent) {
    event.preventDefault()
    if (name.trim().length < 2) {
      setError('A name is the one thing Contact cannot guess.')
      return
    }
    const person: Person = {
      id: newId('p'),
      name: name.trim(),
      role: role.trim(),
      company: company.trim(),
      context: context.trim(),
      notes: notes.trim(),
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 6),
      lastContact,
      channel,
      circle,
      custom: true,
    }
    addPerson(person)
    onClose()
  }

  return (
    <div className="ctc-drawer-root" role="dialog" aria-modal="true" aria-labelledby="ctc-add-title">
      <button type="button" className="ctc-drawer-scrim" onClick={onClose} aria-label="Close" />
      <div className="ctc-modal ctc-pop">
        <header className="ctc-between" style={{ marginBottom: 'var(--s-4)' }}>
          <div className="ctc-stack" style={{ gap: 2 }}>
            <span className="ctc-eyebrow">New person</span>
            <h2 id="ctc-add-title" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--t-lg)' }}>
              Who did you meet?
            </h2>
          </div>
          <button type="button" className="ctc-icon-btn" onClick={onClose} aria-label="Close">
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        <form onSubmit={submit} className="ctc-stack ctc-g4">
          <div className="ctc-form-row">
            <div className="ctc-field">
              <label className="ctc-label" htmlFor="p-name">
                Name
              </label>
              <input
                id="p-name"
                className="ctc-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-invalid={error ? 'true' : undefined}
                autoFocus
              />
            </div>
            <div className="ctc-field">
              <label className="ctc-label" htmlFor="p-role">
                Role
              </label>
              <input id="p-role" className="ctc-input" value={role} onChange={(e) => setRole(e.target.value)} />
            </div>
          </div>

          <div className="ctc-form-row">
            <div className="ctc-field">
              <label className="ctc-label" htmlFor="p-company">
                Company
              </label>
              <input id="p-company" className="ctc-input" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div className="ctc-field">
              <label className="ctc-label" htmlFor="p-last">
                Last spoke
              </label>
              <input
                id="p-last"
                type="date"
                className="ctc-input"
                value={lastContact}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setLastContact(e.target.value)}
              />
            </div>
          </div>

          <div className="ctc-field">
            <label className="ctc-label" htmlFor="p-context">
              How you know them
            </label>
            <input
              id="p-context"
              className="ctc-input"
              placeholder="Met at the Fieldnote dinner, introduced by Marcus"
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </div>

          <div className="ctc-field">
            <label className="ctc-label" htmlFor="p-notes">
              What you would otherwise forget
            </label>
            <textarea
              id="p-notes"
              className="ctc-textarea"
              placeholder="Offered to review our model. Vests in November. Hates decks."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <span className="ctc-hint">This is what the brief reasons over. Specifics beat adjectives.</span>
          </div>

          <div className="ctc-form-row">
            <div className="ctc-field">
              <label className="ctc-label" htmlFor="p-channel">
                Usual channel
              </label>
              <select
                id="p-channel"
                className="ctc-select"
                value={channel}
                onChange={(e) => setChannel(e.target.value as Channel)}
              >
                {(Object.keys(CHANNEL_LABEL) as Channel[]).map((option) => (
                  <option key={option} value={option}>
                    {CHANNEL_LABEL[option]}
                  </option>
                ))}
              </select>
            </div>
            <div className="ctc-field">
              <label className="ctc-label" htmlFor="p-circle">
                Closeness
              </label>
              <select
                id="p-circle"
                className="ctc-select"
                value={circle}
                onChange={(e) => setCircle(e.target.value as Circle)}
              >
                <option value="inner">Inner circle</option>
                <option value="active">Active</option>
                <option value="dormant">Dormant</option>
              </select>
            </div>
          </div>

          <div className="ctc-field">
            <label className="ctc-label" htmlFor="p-tags">
              Tags
            </label>
            <input
              id="p-tags"
              className="ctc-input"
              placeholder="investor, hiring-target"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          {error ? (
            <span className="ctc-error-text" role="alert">
              {error}
            </span>
          ) : null}

          <div className="ctc-row ctc-g2" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="ctc-btn ctc-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="ctc-btn ctc-btn-ember">
              Add to network
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

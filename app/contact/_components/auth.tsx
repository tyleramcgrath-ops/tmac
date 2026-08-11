'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { ArrowRight, Check, TriangleAlert } from 'lucide-react'
import { useStore } from '../_lib/store'
import { Spinner, Wordmark } from './primitives'

type Mode = 'signin' | 'signup'

interface Errors {
  name?: string
  email?: string
  password?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function AuthScreen({ mode }: { mode: Mode }) {
  const router = useRouter()
  const { signIn } = useStore()
  const isSignup = mode === 'signup'

  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<'idle' | 'working' | 'done'>('idle')

  function validate(): Errors {
    const next: Errors = {}
    if (isSignup && name.trim().length < 2) next.name = 'Tell us what to call you.'
    if (!EMAIL_RE.test(email.trim())) next.email = 'That email does not look right.'
    if (password.length < 8) next.password = 'Eight characters or more.'
    return next
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setStatus('working')
    // No password ever leaves the device in this build — the account is local.
    await new Promise((resolve) => setTimeout(resolve, 650))
    signIn({
      name: name.trim() || email.split('@')[0].replace(/[._-]+/g, ' '),
      email: email.trim(),
      role: role.trim() || 'Founder',
      createdAt: Date.now(),
    })
    setStatus('done')
    setTimeout(() => router.push('/contact/app'), 520)
  }

  return (
    <div className="ctc-auth">
      {/* Left: the ink panel */}
      <aside className="ctc-auth-aside ctc-ink-band ctc-on-ink ctc-grain">
        <div className="ctc-auth-aside-inner">
          <Link href="/contact" style={{ textDecoration: 'none', color: 'var(--paper)' }}>
            <Wordmark onInk />
          </Link>

          <div className="ctc-stack ctc-g5" style={{ marginTop: 'auto' }}>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--t-2xl)',
                lineHeight: 1.15,
                letterSpacing: '-0.028em',
                maxWidth: '18ch',
              }}
            >
              The people you already know are the whole advantage.
            </p>
            <ul className="ctc-stack ctc-g3" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {[
                '24 people waiting in your workspace',
                'A brief reasoned by Claude, not a template',
                'Nothing sends without you reading it first',
              ].map((line) => (
                <li key={line} className="ctc-row ctc-g2" style={{ alignItems: 'flex-start' }}>
                  <Check
                    size={15}
                    aria-hidden="true"
                    style={{ color: 'var(--ember-bright)', flex: 'none', marginTop: 3 }}
                  />
                  <span className="ctc-muted" style={{ fontSize: 'var(--t-sm)' }}>
                    {line}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      {/* Right: the form */}
      <main className="ctc-auth-main">
        <div className="ctc-auth-form">
          <Link
            href="/contact"
            className="ctc-auth-mark"
            style={{ textDecoration: 'none' }}
            aria-label="Contact — home"
          >
            <Wordmark />
          </Link>

          <div className="ctc-stack ctc-g2" style={{ marginBottom: 'var(--s-6)' }}>
            <span className="ctc-eyebrow">{isSignup ? 'Create account' : 'Welcome back'}</span>
            <h1 className="ctc-h2" style={{ fontSize: 'var(--t-2xl)' }}>
              {isSignup ? 'Start with the people you have.' : 'Sign in to your network.'}
            </h1>
            <p className="ctc-muted" style={{ fontSize: 'var(--t-sm)' }}>
              {isSignup
                ? 'No card, no email confirmation. Your network stays on this device.'
                : 'Any email and an eight-character password will do — accounts here are local to your browser.'}
            </p>
          </div>

          <form onSubmit={onSubmit} noValidate className="ctc-stack ctc-g4">
            {isSignup ? (
              <>
                <Field
                  id="name"
                  label="Your name"
                  value={name}
                  onChange={setName}
                  error={errors.name}
                  autoComplete="name"
                  placeholder="Rosa Almeida"
                />
                <Field
                  id="role"
                  label="What you do (optional)"
                  value={role}
                  onChange={setRole}
                  autoComplete="organization-title"
                  placeholder="Founder, Tessellate"
                  hint="Used to set the voice of your drafts."
                />
              </>
            ) : null}

            <Field
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              error={errors.email}
              autoComplete="email"
              placeholder="you@studio.com"
            />
            <Field
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              error={errors.password}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              placeholder="At least 8 characters"
            />

            <button
              type="submit"
              className="ctc-btn ctc-btn-ember ctc-btn-lg"
              style={{ width: '100%', marginTop: 'var(--s-2)' }}
              disabled={status !== 'idle'}
            >
              {status === 'working' ? (
                <>
                  <Spinner /> Setting up your workspace
                </>
              ) : status === 'done' ? (
                <>
                  <Check size={16} aria-hidden="true" /> Ready
                </>
              ) : (
                <>
                  {isSignup ? 'Create account' : 'Sign in'}
                  <ArrowRight size={16} aria-hidden="true" />
                </>
              )}
            </button>

            <p aria-live="polite" className="ctc-sr">
              {status === 'working'
                ? 'Setting up your workspace'
                : status === 'done'
                  ? 'Signed in, redirecting to your workspace'
                  : ''}
            </p>
          </form>

          <div
            className="ctc-row ctc-g2"
            style={{ marginTop: 'var(--s-5)', justifyContent: 'center', fontSize: 'var(--t-sm)' }}
          >
            <span className="ctc-faint">{isSignup ? 'Already have an account?' : 'New here?'}</span>
            <Link
              href={isSignup ? '/contact/signin' : '/contact/signup'}
              style={{ color: 'var(--ember)', textDecoration: 'none', fontWeight: 500 }}
            >
              {isSignup ? 'Sign in' : 'Create one'}
            </Link>
          </div>

          <div className="ctc-well" style={{ padding: 'var(--s-3) var(--s-4)', marginTop: 'var(--s-5)' }}>
            <p className="ctc-faint" style={{ fontSize: 'var(--t-xs)', lineHeight: 1.5 }}>
              Prefer to look around first?{' '}
              <Link href="/contact/app" style={{ color: 'var(--ink-muted)' }}>
                Open the workspace as a guest
              </Link>{' '}
              — it is already seeded with a full network.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = 'text',
  autoComplete,
  placeholder,
  hint,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  type?: string
  autoComplete?: string
  placeholder?: string
  hint?: string
}) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div className="ctc-field">
      <label className="ctc-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        className="ctc-input"
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? (
        <span className="ctc-error-text" id={`${id}-error`}>
          <TriangleAlert size={12} aria-hidden="true" />
          {error}
        </span>
      ) : hint ? (
        <span className="ctc-hint" id={`${id}-hint`}>
          {hint}
        </span>
      ) : null}
    </div>
  )
}

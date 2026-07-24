'use client'

// First-launch onboarding — the only account-creation path in this app (see
// api.activateOnboarding). Runs as an overlay on top of the still-sleeping
// room: darkness, then the sleeping Compass, then this wizard fades in.
// Completing it silently provisions the account + seeded project and hands
// control back to the caller, which runs the existing wake cinematic.

import { useEffect, useRef, useState } from 'react'
import { Search, BarChart3, Globe, LineChart, Radar } from 'lucide-react'
import { api, ApiError } from './lib/client'

type Step = 'dark' | 'welcome' | 'name' | 'website' | 'business' | 'integrations' | 'ready'

const BUSINESS_TYPES = ['Law Firm', 'Agency', 'Local Business', 'SaaS', 'Healthcare', 'Ecommerce', 'Enterprise', 'Other']

const INTEGRATIONS = [
  { id: 'gsc', label: 'Google Search Console', desc: 'Real ranking and click data for your pages.', icon: Search },
  { id: 'ga4', label: 'Google Analytics', desc: 'Traffic, conversions, and channel performance.', icon: BarChart3 },
  { id: 'wp', label: 'WordPress', desc: 'Lets Operator deploy approved fixes directly.', icon: Globe },
  { id: 'seranking', label: 'SE Ranking', desc: 'Keyword position tracking over time.', icon: LineChart },
  { id: 'semrush', label: 'Semrush', desc: 'Competitor and backlink intelligence.', icon: Radar },
]

export default function OnboardingWizard({ onActivated }: { onActivated: () => void }) {
  const [step, setStep] = useState<Step>('dark')
  const [hqName, setHqName] = useState('')
  const [website, setWebsite] = useState('')
  const [business, setBusiness] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)
  const siteRef = useRef<HTMLInputElement>(null)

  // Scene 1: a brief pure-darkness beat before the sleeping room becomes
  // "present," then Scene 3's welcome fades in on its own — no click needed.
  useEffect(() => {
    const t1 = window.setTimeout(() => setStep('welcome'), 1400)
    return () => window.clearTimeout(t1)
  }, [])
  useEffect(() => {
    if (step !== 'welcome') return
    const t = window.setTimeout(() => setStep('name'), 3200)
    return () => window.clearTimeout(t)
  }, [step])

  useEffect(() => {
    if (step === 'name') window.setTimeout(() => nameRef.current?.focus(), 350)
    if (step === 'website') window.setTimeout(() => siteRef.current?.focus(), 350)
  }, [step])

  async function enter() {
    setSubmitting(true)
    setError('')
    try {
      await api.activateOnboarding({ hqName: hqName.trim(), website: website.trim(), industry: business ?? '' })
      onActivated()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
      setSubmitting(false)
    }
  }

  if (step === 'dark') return null

  return (
    <div className="ns-onboard" data-step={step}>
      {step === 'welcome' && (
        <div className="ns-onboard-welcome">
          <h2>Welcome to North Star</h2>
          <p className="ns-onboard-tagline">The AI Operating System for Modern Marketing</p>
          <p className="ns-onboard-sub">We&rsquo;ll configure your Headquarters in less than a minute.</p>
        </div>
      )}

      {step !== 'welcome' && (
        <div className="ns-onboard-card ns-glass">
          {step === 'name' && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (hqName.trim()) setStep('website')
              }}
            >
              <h3>What would you like to call your Headquarters?</h3>
              <input
                ref={nameRef}
                className="ns-onboard-input"
                value={hqName}
                onChange={(e) => setHqName(e.target.value)}
                placeholder="Acme Marketing"
                autoComplete="off"
                maxLength={80}
              />
              <div className="ns-onboard-actions">
                <button type="submit" className="ns-onboard-primary" disabled={!hqName.trim()}>
                  Continue
                </button>
              </div>
            </form>
          )}

          {step === 'website' && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setStep('business')
              }}
            >
              <h3>What website should North Star manage?</h3>
              <input
                ref={siteRef}
                className="ns-onboard-input"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                autoComplete="off"
                maxLength={200}
              />
              <p className="ns-onboard-hint">This allows Scout to understand your website and begin building your first mission.</p>
              <div className="ns-onboard-actions">
                <button type="submit" className="ns-onboard-primary">Continue</button>
              </div>
            </form>
          )}

          {step === 'business' && (
            <div>
              <h3>What best describes your business?</h3>
              <div className="ns-onboard-grid">
                {BUSINESS_TYPES.map((b) => (
                  <button
                    key={b}
                    type="button"
                    className="ns-onboard-choice"
                    aria-pressed={business === b}
                    onClick={() => setBusiness(b)}
                  >
                    {b}
                  </button>
                ))}
              </div>
              <div className="ns-onboard-actions">
                <button type="button" className="ns-onboard-primary" disabled={!business} onClick={() => setStep('integrations')}>
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 'integrations' && (
            <div>
              <h3>Connect your data</h3>
              <ul className="ns-row-list ns-onboard-integrations">
                {INTEGRATIONS.map(({ id, label, desc, icon: Icon }) => (
                  <li key={id} className="ns-row">
                    <Icon className="ns-row-icon" aria-hidden />
                    <span className="ns-row-text">
                      <span className="ns-row-title">{label}</span>
                      <span className="ns-row-desc">{desc}</span>
                    </span>
                    <span className="ns-onboard-status">Available</span>
                  </li>
                ))}
              </ul>
              <div className="ns-onboard-actions">
                <button type="button" className="ns-onboard-primary" onClick={() => setStep('ready')}>
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {step === 'ready' && (
            <div className="ns-onboard-ready">
              <h3>Your Headquarters is Ready</h3>
              {error && <p className="ns-onboard-error">{error}</p>}
              <div className="ns-onboard-actions">
                <button type="button" className="ns-onboard-primary ns-onboard-enter" disabled={submitting} onClick={enter}>
                  {submitting ? 'Activating…' : 'Enter Headquarters'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

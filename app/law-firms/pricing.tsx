'use client'

import { useState } from 'react'

const tiers = [
  {
    name: 'Pilot',
    tagline: 'Prove value on one workflow',
    monthly: 2500,
    setup: 'Fixed-scope engagement',
    features: [
      'One high-impact workflow',
      'Secure, isolated deployment',
      'Up to 10 users',
      'Email support',
      '4–6 week delivery',
    ],
    cta: 'Start a pilot',
    featured: false,
  },
  {
    name: 'Practice',
    tagline: 'Roll AI out across the firm',
    monthly: 7500,
    setup: 'Most popular',
    features: [
      'Up to 4 workflows',
      'DMS, email & practice-tool integrations',
      'Unlimited users',
      'Custom firm copilot',
      'Priority support & training',
      'Quarterly model tuning',
    ],
    cta: 'Talk to us',
    featured: true,
  },
  {
    name: 'Enterprise',
    tagline: 'For Am Law & multi-office firms',
    monthly: null,
    setup: 'Custom',
    features: [
      'Unlimited workflows',
      'Private / on-prem options',
      'SSO, audit logs & DLP',
      'Dedicated solutions engineer',
      'SLA & security review support',
    ],
    cta: 'Contact sales',
    featured: false,
  },
]

export function Pricing() {
  const [annual, setAnnual] = useState(true)

  return (
    <div>
      <div className="mb-10 flex items-center justify-center gap-3">
        <span className={annual ? 'text-slate-400' : 'text-white'}>Monthly</span>
        <button
          type="button"
          role="switch"
          aria-checked={annual}
          onClick={() => setAnnual((v) => !v)}
          className={`relative h-7 w-12 rounded-full transition ${
            annual ? 'bg-amber-400' : 'bg-white/15'
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-slate-950 transition-all ${
              annual ? 'left-6' : 'left-1'
            }`}
          />
        </button>
        <span className={annual ? 'text-white' : 'text-slate-400'}>
          Annual{' '}
          <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-semibold text-amber-300">
            −15%
          </span>
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {tiers.map((t) => {
          const price =
            t.monthly === null
              ? null
              : annual
                ? Math.round(t.monthly * 0.85)
                : t.monthly
          return (
            <div
              key={t.name}
              className={`relative flex flex-col rounded-3xl border p-8 ${
                t.featured
                  ? 'border-amber-400/40 bg-gradient-to-b from-amber-400/[0.08] to-transparent'
                  : 'border-white/5 bg-slate-900/40'
              }`}
            >
              {t.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-slate-950">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold text-white">{t.name}</h3>
              <p className="mt-1 text-sm text-slate-400">{t.tagline}</p>
              <div className="mt-6 flex items-baseline gap-1">
                {price === null ? (
                  <span className="font-[Georgia,'Times_New_Roman',serif] text-4xl font-semibold text-white">
                    Custom
                  </span>
                ) : (
                  <>
                    <span className="font-[Georgia,'Times_New_Roman',serif] text-4xl font-semibold text-white">
                      ${price.toLocaleString('en-US')}
                    </span>
                    <span className="text-sm text-slate-400">/mo</span>
                  </>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500">{t.setup}</p>

              <ul className="mt-7 flex-1 space-y-3">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-slate-300">
                    <span className="mt-0.5 text-amber-400">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href="#contact"
                className={`mt-8 rounded-xl px-6 py-3 text-center text-sm font-semibold transition ${
                  t.featured
                    ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                    : 'border border-white/10 text-white hover:bg-white/5'
                }`}
              >
                {t.cta}
              </a>
            </div>
          )
        })}
      </div>
      <p className="mt-6 text-center text-xs text-slate-500">
        Indicative pricing for illustration. Final scope and pricing are set after
        your discovery call.
      </p>
    </div>
  )
}

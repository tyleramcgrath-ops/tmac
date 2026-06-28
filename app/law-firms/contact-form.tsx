'use client'

import { useState } from 'react'

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-400/15 text-amber-300">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white">
          Thanks — we&apos;ll be in touch.
        </h3>
        <p className="mt-2 text-sm text-slate-400">
          A member of our team will reach out within one business day to schedule
          your confidential discovery call.
        </p>
      </div>
    )
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault()
        // Placeholder submit — wire this to your CRM, email service,
        // or a Next.js route handler / server action when ready.
        setSubmitted(true)
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" htmlFor="name">
          <input
            id="name"
            name="name"
            required
            autoComplete="name"
            placeholder="Jane Counsel"
            className={inputClass}
          />
        </Field>
        <Field label="Work email" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="jane@firm.com"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Firm name" htmlFor="firm">
          <input
            id="firm"
            name="firm"
            required
            placeholder="Firm &amp; Partners LLP"
            className={inputClass}
          />
        </Field>
        <Field label="Firm size" htmlFor="size">
          <select
            id="size"
            name="size"
            defaultValue=""
            className={inputClass}
            required
          >
            <option value="" disabled>
              Select…
            </option>
            <option>Solo / boutique (1–10)</option>
            <option>Mid-size (11–100)</option>
            <option>Large (100–500)</option>
            <option>Am Law / 500+</option>
          </select>
        </Field>
      </div>

      <Field label="What would you like AI to help with?" htmlFor="message">
        <textarea
          id="message"
          name="message"
          rows={4}
          placeholder="e.g. accelerate contract review, automate client intake, build a private research assistant…"
          className={`${inputClass} resize-none`}
        />
      </Field>

      <button
        type="submit"
        className="w-full rounded-xl bg-amber-400 px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
      >
        Request a confidential consultation
      </button>
      <p className="text-center text-xs text-slate-500">
        Protected by attorney–client privilege expectations. We never train public
        models on your data.
      </p>
    </form>
  )
}

const inputClass =
  'w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-slate-500 transition focus:border-amber-400/50 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-amber-400/20'

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-2 block text-xs font-medium tracking-wide text-slate-400">
        {label}
      </span>
      {children}
    </label>
  )
}

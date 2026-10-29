'use client'

// Illustrative "before/after deploy" mockup for the WordPress page — shows
// what a real approved-fix deployment looks like end to end: the diff, the
// read-back verification, and the one-click rollback. Sample content, clearly
// labeled — never presented as a real customer's site.

import { ArrowRight, Check, RotateCcw, ShieldCheck } from 'lucide-react'
import { Reveal } from './reveal'

export function DeployDiffMockup() {
  return (
    <Reveal>
      <div className="relative mx-auto max-w-5xl">
        <div className="rf-glow pointer-events-none absolute -inset-x-10 -bottom-10 top-10 -z-10 opacity-50" />
        <div className="rf-card rf-topline overflow-hidden shadow-[0_60px_120px_-40px_rgba(0,0,0,0.9)]">
          <div className="flex items-center justify-between border-b border-[var(--rf-card-line)] px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              <span className="rf-mono ml-3 hidden text-xs text-[var(--rf-faint)] sm:inline">
                yoursite.com/wp-admin — Deploy: /blog/best-crm-software
              </span>
            </div>
            <span className="rf-mono inline-flex items-center gap-2 rounded-full border border-[var(--rf-card-line)] px-2.5 py-1 text-[10px] uppercase tracking-wider text-[var(--rf-amber)]">
              Illustrative — sample deployment
            </span>
          </div>

          <div className="grid gap-0 sm:grid-cols-2">
            {/* before */}
            <div className="border-b border-[var(--rf-card-line)] p-5 sm:border-b-0 sm:border-r sm:p-6">
              <p className="rf-mono text-[10px] uppercase tracking-wider text-[var(--rf-faint)]">Before</p>
              <p className="mt-2 text-sm font-medium text-[var(--rf-muted)] line-through decoration-[var(--rf-red)]/50">
                Best CRM Software - My Blog
              </p>
              <p className="mt-3 text-xs leading-relaxed text-[var(--rf-faint)]">
                No meta description found. Google is generating a snippet from page
                content — inconsistent, and never the message you'd choose.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-[11px] text-[var(--rf-red)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--rf-red)]" /> Missing meta description
              </div>
            </div>

            {/* after */}
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <p className="rf-mono text-[10px] uppercase tracking-wider text-[var(--rf-blue-bright)]">After — Forge-written</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--rf-green)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--rf-green)]">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-white">
                12 Best CRM Software Picks for 2026 (Compared)
              </p>
              <p className="mt-3 text-xs leading-relaxed text-[var(--rf-text)]">
                We tested 12 leading CRMs on pricing, automation, and support —
                see which one fits your team size and budget.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-[11px] text-[var(--rf-green)]">
                <Check className="h-3.5 w-3.5" /> Read back from the live site — matches exactly
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--rf-card-line)] px-5 py-4 sm:px-6">
            <div className="flex items-center gap-4 text-xs text-[var(--rf-muted)]">
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[var(--rf-green)]" /> Deployed &amp; verified 2m ago</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">Yoast SEO field</span>
            </div>
            <button type="button" disabled className="rf-btn-ghost inline-flex cursor-default items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium opacity-80">
              <RotateCcw className="h-3.5 w-3.5" /> Roll back
            </button>
          </div>
        </div>

        {/* verification pipeline strip */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-center text-[11px] text-[var(--rf-faint)] sm:gap-3">
          {['Approved by you', 'Written to WordPress', 'Read back from the live site', 'Verified — not just "applied"'].map((step, i, arr) => (
            <span key={step} className="flex items-center gap-2">
              <span className="rf-mono rounded-full border border-[var(--rf-card-line)] bg-white/[0.03] px-3 py-1">{step}</span>
              {i < arr.length - 1 && <ArrowRight className="h-3 w-3 shrink-0" />}
            </span>
          ))}
        </div>
      </div>
    </Reveal>
  )
}

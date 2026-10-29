// Shared hero band for the standalone marketing pages, so each route opens with
// a clear H1 + description (good for readers and for SEO).
export function PageIntro({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <section className="relative overflow-hidden pt-32 pb-10 sm:pt-40">
      <div className="rf-grid pointer-events-none absolute inset-0 -z-10 opacity-40" />
      <div className="rf-glow rf-pulse pointer-events-none absolute left-1/2 top-[-120px] -z-10 h-[420px] w-[720px] -translate-x-1/2" />
      <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
        <span className="rf-mono inline-block rounded-full border border-[var(--rf-card-line)] bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[var(--rf-blue-bright)]">
          {eyebrow}
        </span>
        <h1 className="mt-4 text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">{title}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-[var(--rf-muted)] sm:text-lg">{sub}</p>
      </div>
    </section>
  )
}

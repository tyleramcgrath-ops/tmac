"use client"

import { motion } from "framer-motion"
import { ArrowRight, Github } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <main className="relative min-h-svh bg-background text-foreground">
      <Hero />
      <InActionSection />
      <FeaturesSection />
      <ModelsRibbon />
      <Footer />
    </main>
  )
}

/* Hero — first viewport. Brand-first. Full-bleed live code-stream. */

function Hero() {
  return (
    <section className="relative isolate flex min-h-svh w-full flex-col overflow-hidden">
      <CodeStreamBackdrop />

      <Nav />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-end px-6 pt-24 pb-16 sm:pt-32 sm:pb-20 lg:pb-24">
        <motion.h1
          className="font-display font-medium tracking-[-0.045em] leading-[0.85] text-balance"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="block text-[clamp(3.5rem,11vw,11rem)]">
            Vibe Coding
          </span>
          <span className="block text-[clamp(3.5rem,11vw,11rem)] text-muted-foreground">
            Platform.
          </span>
        </motion.h1>

        <motion.p
          className="mt-8 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: "easeOut" }}
        >
          An AI agent that writes full-stack apps from a prompt. Sandboxed,
          previewed live, shipped to production in one move.
        </motion.p>

        <motion.div
          className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55, ease: "easeOut" }}
        >
          <Button size="lg" className="group">
            Start building
            <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
          </Button>
          <Button asChild size="lg" variant="outline" className="text-foreground">
            <a
              href="https://github.com/vercel/examples/tree/main/apps/vibe-coding-platform"
              target="_blank"
              rel="noreferrer noopener"
            >
              <Github />
              View on GitHub
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}

function Nav() {
  return (
    <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 pt-6">
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        Vercel · AI Cloud
      </span>
      <nav className="hidden items-center gap-7 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground sm:flex">
        <a className="transition hover:text-foreground" href="#in-action">
          In action
        </a>
        <a className="transition hover:text-foreground" href="#features">
          Features
        </a>
        <a className="transition hover:text-foreground" href="#models">
          Models
        </a>
      </nav>
      <Button size="default" variant="outline" className="text-foreground">
        Sign in
      </Button>
    </header>
  )
}

/* Full-bleed background: live, ambient code stream — the product itself. */

const CODE_LINES = [
  "agent.plan → 'Stripe billing dashboard, dark, MRR + invoices'",
  "fs.write('app/billing/page.tsx', 4.2kb)",
  "fs.write('app/billing/loading.tsx', 312b)",
  "fs.write('components/mrr-chart.tsx', 2.8kb)",
  "sandbox.exec → pnpm add recharts @stripe/stripe-js",
  "sandbox.exec → pnpm dev --port 3000",
  "✓ compiled successfully in 1.4s",
  "preview.url → https://sb-7n2.vercel.run",
  "agent.diff(app/billing/page.tsx) → +186 −0",
  "fs.write('app/api/refund/route.ts', 1.1kb)",
  "agent.tool → ConfirmRefund(amount=$1,240.00)",
  "sandbox.exec → curl localhost:3000/api/refund",
  "deploy.target → production",
  "deploy.url → vibe-coding-7n2.vercel.app",
  "agent.handoff → 'ready when you are'",
]

function CodeStreamBackdrop() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 -z-10 overflow-hidden bg-[oklch(0.07_0_0)]"
    >
      <BackdropGradient />
      <ScrollingCodeColumn delay={0} translate="-20%" />
      <ScrollingCodeColumn delay={-7} translate="35%" reverse />
      <ScrollingCodeColumn delay={-13} translate="78%" />
      <Vignette />
    </div>
  )
}

function BackdropGradient() {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 25% 30%, oklch(0.16 0.06 250 / 0.6) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 85% 110%, oklch(0.22 0.10 22 / 0.45) 0%, transparent 65%)",
        }}
      />
      <motion.div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(to right, oklch(1 0 0 / 5%) 1px, transparent 1px)",
          backgroundSize: "120px 100%",
        }}
        initial={{ x: 0 }}
        animate={{ x: -120 }}
        transition={{ duration: 24, ease: "linear", repeat: Infinity }}
      />
    </>
  )
}

function ScrollingCodeColumn({
  delay,
  translate,
  reverse = false,
}: {
  delay: number
  translate: string
  reverse?: boolean
}) {
  const doubled = [...CODE_LINES, ...CODE_LINES, ...CODE_LINES]
  return (
    <div
      className="absolute top-0 h-full w-[28rem] [mask-image:linear-gradient(to_bottom,transparent_0%,black_15%,black_85%,transparent_100%)]"
      style={{ left: translate }}
    >
      <motion.div
        className="flex flex-col font-mono text-[12px] leading-[2.2] text-foreground/50"
        initial={{ y: reverse ? "-50%" : "0%" }}
        animate={{ y: reverse ? "0%" : "-50%" }}
        transition={{
          duration: 60,
          ease: "linear",
          repeat: Infinity,
          delay,
        }}
      >
        {doubled.map((line, i) => (
          <span key={i} className="block whitespace-nowrap px-4">
            <span className="text-muted-foreground">
              {String(i).padStart(2, "0")}
            </span>
            <span className="ml-3 text-foreground/70">{line}</span>
          </span>
        ))}
      </motion.div>
    </div>
  )
}

function Vignette() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, oklch(0.07 0 0 / 0.55) 0%, oklch(0.07 0 0 / 0.30) 35%, oklch(0.07 0 0 / 0.78) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
        style={{
          background:
            "linear-gradient(to bottom, transparent, oklch(0.07 0 0))",
        }}
      />
    </>
  )
}

/* In action — no card chrome. The agent loop, rendered inline. */

function InActionSection() {
  return (
    <section
      id="in-action"
      className="relative border-t border-border/40"
    >
      <div className="mx-auto grid max-w-7xl gap-16 px-6 py-28 md:grid-cols-[1fr_1.2fr] md:gap-24">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            01 — In action
          </span>
          <h2 className="mt-5 font-display text-3xl font-medium tracking-tight sm:text-4xl">
            From one sentence to a deployable app.
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground">
            Type the vibe. The agent plans, writes the files, runs the
            sandbox, and hands you a working URL. Every step is visible —
            files, diffs, logs.
          </p>
        </div>

        <SessionStream />
      </div>
    </section>
  )
}

const SESSION_LINES: { kind: "you" | "agent" | "tool" | "ok"; text: string }[] = [
  {
    kind: "you",
    text: "Build a Stripe billing dashboard. Dark theme, sidebar, MRR chart, recent invoices, refund action.",
  },
  {
    kind: "agent",
    text: "Planning → 6 files. App router, server actions, no client state.",
  },
  { kind: "tool", text: "fs.write app/billing/page.tsx · 4.2kb" },
  { kind: "tool", text: "fs.write components/mrr-chart.tsx · 2.8kb" },
  { kind: "tool", text: "sandbox pnpm add recharts @stripe/stripe-js" },
  { kind: "ok", text: "compiled in 1.4s · preview live" },
  { kind: "agent", text: "Ready when you are." },
]

function SessionStream() {
  return (
    <ol className="relative space-y-5 font-mono text-[13px] leading-relaxed">
      <span
        aria-hidden
        className="absolute left-[5px] top-2 bottom-2 w-px bg-border/60"
      />
      {SESSION_LINES.map((line, i) => (
        <motion.li
          key={i}
          className="relative flex gap-4 pl-6"
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{
            delay: i * 0.08,
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <KindMarker kind={line.kind} />
          <span
            className={
              line.kind === "you"
                ? "text-foreground"
                : line.kind === "agent"
                  ? "text-foreground/90"
                  : line.kind === "ok"
                    ? "text-emerald-300/90"
                    : "text-muted-foreground"
            }
          >
            <KindLabel kind={line.kind} />
            {line.text}
          </span>
        </motion.li>
      ))}
    </ol>
  )
}

function KindMarker({ kind }: { kind: "you" | "agent" | "tool" | "ok" }) {
  const color =
    kind === "ok"
      ? "bg-emerald-400"
      : kind === "you"
        ? "bg-foreground"
        : kind === "agent"
          ? "bg-foreground/70"
          : "bg-muted-foreground/60"
  return (
    <span
      aria-hidden
      className={`absolute left-[2px] top-[6px] size-2 rounded-full ${color}`}
    />
  )
}

function KindLabel({ kind }: { kind: "you" | "agent" | "tool" | "ok" }) {
  const label =
    kind === "you"
      ? "you · "
      : kind === "agent"
        ? "agent · "
        : kind === "tool"
          ? "tool · "
          : ""
  if (!label) return null
  return <span className="mr-2 text-muted-foreground">{label}</span>
}

/* Features — typographic list. No cards. One job per row. */

const FEATURES = [
  {
    label: "Multi-model",
    title: "Switch brains mid-build.",
    body: "Claude Opus, Sonnet, GPT-5.3 Codex, Grok 4.1. Same context, different reasoning.",
  },
  {
    label: "Sandboxed",
    title: "Every run is isolated.",
    body: "Real npm installs, real ports, zero blast radius. Failures stay in the sandbox.",
  },
  {
    label: "Live preview",
    title: "See it work before you keep going.",
    body: "The generated app runs in an iframe with hot reload. Watch the build come to life.",
  },
  {
    label: "Readable trail",
    title: "Nothing is a black box.",
    body: "Full file explorer, full diffs, full command logs. You can always retrace the agent.",
  },
  {
    label: "One-click ship",
    title: "Vercel-native deploy.",
    body: "When the vibe is right, ship it. Production URL in under a minute.",
  },
  {
    label: "Your keys",
    title: "BYO AI Gateway.",
    body: "Routes through your provider keys, with cost and latency tracked per call.",
  },
]

function FeaturesSection() {
  return (
    <section id="features" className="border-t border-border/40">
      <div className="mx-auto max-w-7xl px-6 py-28">
        <div className="grid gap-10 md:grid-cols-[1fr_2fr] md:gap-24">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              02 — Features
            </span>
            <h2 className="mt-5 font-display text-3xl font-medium tracking-tight sm:text-4xl">
              Built for the loop you're already in.
            </h2>
          </div>
          <ul className="divide-y divide-border/40">
            {FEATURES.map((f, i) => (
              <motion.li
                key={f.label}
                className="grid gap-1 py-6 first:pt-0 sm:grid-cols-[10rem_1fr] sm:gap-8"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.55,
                  delay: i * 0.04,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {f.label}
                </span>
                <div>
                  <h3 className="font-display text-lg font-medium tracking-tight">
                    {f.title}
                  </h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
                    {f.body}
                  </p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

/* Models — single horizontal ribbon, typographic. */

const MODELS = [
  "Claude Opus 4.6",
  "Claude Sonnet 4.6",
  "GPT-5.3 Codex",
  "Grok 4.1 Reasoning",
]

function ModelsRibbon() {
  return (
    <section
      id="models"
      className="relative overflow-hidden border-t border-border/40"
    >
      <div className="mx-auto max-w-7xl px-6 py-24">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          03 — Models
        </span>
        <div className="mt-6 flex flex-wrap items-baseline gap-x-10 gap-y-3 font-display text-2xl font-medium tracking-tight sm:text-3xl">
          {MODELS.map((m, i) => (
            <motion.span
              key={m}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.07, duration: 0.5, ease: "easeOut" }}
            >
              {m}
              {i < MODELS.length - 1 && (
                <span className="ml-10 text-muted-foreground/60">·</span>
              )}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border/40">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-6 py-10 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground sm:flex-row sm:items-center">
        <span>vibe-coding-platform · powered by Vercel AI Cloud</span>
        <div className="flex items-center gap-6">
          <a className="hover:text-foreground" href="#">
            Docs
          </a>
          <a className="hover:text-foreground" href="#">
            Changelog
          </a>
          <a className="hover:text-foreground" href="#">
            Status
          </a>
        </div>
      </div>
    </footer>
  )
}

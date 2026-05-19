"use client"

import { motion } from "framer-motion"
import { ArrowRight, Github, Sparkles, Terminal } from "lucide-react"

import { Button } from "@/components/ui/button"

const headlineLines = [
  { text: "Describe", muted: false },
  { text: "the vibe.", muted: true },
]
const headlineLines2 = [
  { text: "Ship the app.", muted: false },
]

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
}

export default function Page() {
  return (
    <main className="relative min-h-svh overflow-hidden bg-background">
      <BackgroundGrid />
      <BackgroundGlow />

      <Nav />

      <section className="relative mx-auto flex max-w-6xl flex-col items-center px-6 pt-20 pb-32 sm:pt-28 lg:pt-36">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Pill />
        </motion.div>

        <h1 className="mt-8 text-center font-display text-5xl leading-[0.95] font-semibold tracking-tight sm:text-6xl md:text-7xl lg:text-[5.5rem]">
          <span className="block">
            {headlineLines.map((w, i) => (
              <motion.span
                key={w.text}
                className={
                  w.muted
                    ? "inline-block text-muted-foreground"
                    : "inline-block"
                }
                initial="hidden"
                animate="show"
                variants={fadeUp}
                transition={{
                  duration: 0.55,
                  delay: 0.15 + i * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {w.text}
                {i < headlineLines.length - 1 ? " " : ""}
              </motion.span>
            ))}
          </span>
          <span className="mt-1 block">
            {headlineLines2.map((w, i) => (
              <motion.span
                key={w.text}
                className="inline-block"
                initial="hidden"
                animate="show"
                variants={fadeUp}
                transition={{
                  duration: 0.55,
                  delay: 0.35 + i * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {w.text}
              </motion.span>
            ))}
          </span>
        </h1>

        <motion.p
          className="mt-7 max-w-2xl text-center text-base text-muted-foreground sm:text-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55, ease: "easeOut" }}
        >
          An AI agent that writes full-stack apps from a prompt. Sandboxed
          execution, live preview, one-click deploy — across Claude, GPT,
          and Grok.
        </motion.p>

        <motion.div
          className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7, ease: "easeOut" }}
        >
          <Button size="lg" className="group">
            Start building
            <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="group text-foreground"
          >
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

        <motion.div
          className="mt-20 w-full"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          <ComposerPreview />
        </motion.div>
      </section>

      <FeatureBento />

      <Footer />
    </main>
  )
}

function Nav() {
  return (
    <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 pt-6">
      <div className="flex items-center gap-2">
        <div className="grid size-7 place-items-center rounded-md bg-foreground/95 text-background">
          <Sparkles className="size-3.5" />
        </div>
        <span className="font-mono text-sm font-medium tracking-tight">
          vibe-coding
        </span>
      </div>
      <nav className="hidden items-center gap-7 text-sm text-muted-foreground sm:flex">
        <a className="transition hover:text-foreground" href="#features">
          Features
        </a>
        <a className="transition hover:text-foreground" href="#models">
          Models
        </a>
        <a className="transition hover:text-foreground" href="#deploy">
          Deploy
        </a>
      </nav>
      <Button size="default" variant="outline" className="text-foreground">
        Sign in
      </Button>
    </header>
  )
}

function Pill() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70 opacity-75" />
        <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
      </span>
      Claude · GPT · Grok — switch live mid-build
    </div>
  )
}

function ComposerPreview() {
  const tabs = ["Prompt", "Files", "Preview", "Logs"]
  return (
    <div className="relative mx-auto max-w-4xl">
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-foreground/12 to-transparent" />
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/70 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-2 border-b border-border/70 px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-red-400/80" />
            <span className="size-2.5 rounded-full bg-amber-400/80" />
            <span className="size-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <div className="ml-3 flex items-center gap-1">
            {tabs.map((tab, i) => (
              <span
                key={tab}
                className={
                  "rounded-md px-2.5 py-1 font-mono text-[11px] " +
                  (i === 0
                    ? "bg-foreground/8 text-foreground"
                    : "text-muted-foreground hover:bg-foreground/5")
                }
              >
                {tab}
              </span>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
            <span className="hidden sm:inline">sandbox</span>
            <span className="size-1.5 rounded-full bg-emerald-400" />
          </div>
        </div>

        <div className="grid gap-0 md:grid-cols-[1.05fr_1fr]">
          <div className="border-b border-border/70 p-5 md:border-r md:border-b-0">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Terminal className="size-3" />
              <span className="font-mono">user</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-foreground/90">
              Build a Stripe billing dashboard. Dark theme, sidebar nav, MRR
              chart, recent invoices table. Add a “refund” action with
              confirm modal.
            </p>
            <motion.div
              className="mt-5 flex items-center gap-2 text-[11px] text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6, duration: 0.4 }}
            >
              <span className="font-mono">agent</span>
              <span className="inline-flex gap-1">
                <span className="size-1.5 animate-pulse rounded-full bg-foreground/60 [animation-delay:-0.4s]" />
                <span className="size-1.5 animate-pulse rounded-full bg-foreground/60 [animation-delay:-0.2s]" />
                <span className="size-1.5 animate-pulse rounded-full bg-foreground/60" />
              </span>
              writing app/billing/page.tsx
            </motion.div>
          </div>

          <div className="bg-[radial-gradient(circle_at_30%_20%,_oklch(0.22_0_0)_0%,_transparent_60%)] p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-muted-foreground">
                preview · localhost:3000
              </span>
              <span className="font-mono text-[10px] text-emerald-400/90">
                ✓ build
              </span>
            </div>
            <div className="mt-3 space-y-2.5">
              <PreviewBar w="w-[78%]" />
              <PreviewBar w="w-[62%]" muted />
              <PreviewBar w="w-[88%]" />
              <div className="grid grid-cols-3 gap-2 pt-1.5">
                <PreviewBlock />
                <PreviewBlock />
                <PreviewBlock />
              </div>
              <PreviewBar w="w-[70%]" muted />
              <PreviewBar w="w-[45%]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PreviewBar({ w, muted }: { w: string; muted?: boolean }) {
  return (
    <div
      className={
        "h-2 rounded-sm " +
        (muted ? "bg-foreground/8" : "bg-foreground/18") +
        " " +
        w
      }
    />
  )
}

function PreviewBlock() {
  return <div className="h-12 rounded-md border border-border/70 bg-foreground/4" />
}

const features = [
  {
    title: "Multi-model, live",
    body: "Switch between Claude Opus 4.6, Sonnet 4.6, GPT-5.3 Codex, and Grok 4.1 mid-build. Same context, different brain.",
  },
  {
    title: "Sandboxed by default",
    body: "Every run executes in an isolated Vercel Sandbox. Real npm installs, real ports, zero blast radius.",
  },
  {
    title: "Preview as you go",
    body: "The generated app runs live in an iframe. See it work — or break — before you keep going.",
  },
  {
    title: "Files you can read",
    body: "Full file explorer, full diffs, full command logs. Nothing’s a black box.",
  },
  {
    title: "One-click to Vercel",
    body: "When the vibe is right, ship it. Production URL in under a minute.",
  },
  {
    title: "Bring your own keys",
    body: "AI Gateway routes through your provider keys, with cost and latency tracked per call.",
  },
]

function FeatureBento() {
  return (
    <section
      id="features"
      className="relative mx-auto max-w-6xl px-6 pb-28"
    >
      <div className="mb-10 flex items-end justify-between gap-4">
        <h2 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">
          Built for the loop you’re already in.
        </h2>
        <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
          v0.1 · public preview
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{
              duration: 0.5,
              delay: i * 0.05,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="group relative overflow-hidden rounded-xl border border-border/70 bg-card/40 p-5 backdrop-blur-sm transition-colors hover:bg-card/60"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <h3 className="text-[15px] font-medium">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="relative mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-border/60 px-6 py-8 text-xs text-muted-foreground sm:flex-row">
      <span className="font-mono">vibe-coding-platform · powered by Vercel AI Cloud</span>
      <div className="flex items-center gap-4">
        <a className="hover:text-foreground" href="#">Docs</a>
        <a className="hover:text-foreground" href="#">Changelog</a>
        <a className="hover:text-foreground" href="#">Status</a>
      </div>
    </footer>
  )
}

function BackgroundGrid() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black_55%,transparent_100%)]"
    >
      <div
        className="h-full w-full opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(to right, oklch(1 0 0 / 8%) 1px, transparent 1px), linear-gradient(to bottom, oklch(1 0 0 / 8%) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  )
}

function BackgroundGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[600px]"
      style={{
        background:
          "radial-gradient(60% 50% at 50% 0%, oklch(0.55 0.18 250 / 0.18) 0%, transparent 60%)",
      }}
    />
  )
}

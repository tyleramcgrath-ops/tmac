"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";

export default function Page() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#02041A] text-[#F5F6FF]">
      <Hero />
      <InAction />
      <Solutions />
      <Industries />
      <WhyCentris />
      <ClosingCTA />
      <Footer />
    </main>
  );
}

/* HERO — first viewport. Brand-first. Full-bleed transcript stream. */

function Hero() {
  return (
    <section className="relative isolate flex min-h-screen w-full flex-col overflow-hidden">
      <TranscriptBackdrop />
      <Nav />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-end px-6 pt-24 pb-20 sm:pt-32 lg:pb-28">
        <motion.h1
          className="font-display leading-[0.85] tracking-[-0.02em] text-balance"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
        >
          <span
            className="block italic text-[clamp(4rem,15vw,15rem)]"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Centris
          </span>
        </motion.h1>

        <motion.p
          className="mt-6 max-w-2xl font-sans text-[clamp(1.25rem,2.2vw,1.85rem)] font-light leading-[1.2] tracking-[-0.01em] text-white/90"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease: "easeOut" }}
        >
          Every conversation,
          <span
            className="italic text-white"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            {" "}on key.
          </span>
        </motion.p>

        <motion.p
          className="mt-7 max-w-xl font-sans text-[15px] leading-relaxed text-white/55 sm:text-base"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55, ease: "easeOut" }}
        >
          Centris listens to live customer conversations and tells your
          agents the best thing to say — in any language, in the moment.
        </motion.p>

        <motion.div
          className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.75, ease: "easeOut" }}
        >
          <CtaPrimary>Book a demo</CtaPrimary>
          <CtaQuiet href="#in-action">See it work</CtaQuiet>
        </motion.div>
      </div>
    </section>
  );
}

function Nav() {
  return (
    <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 pt-7">
      <span
        className="font-display text-[22px] italic tracking-tight text-white"
        style={{ fontFamily: "'Instrument Serif', serif" }}
      >
        Centris
      </span>
      <nav className="hidden items-center gap-9 font-mono text-[11px] uppercase tracking-[0.18em] text-white/55 md:flex">
        <a className="transition hover:text-white" href="#in-action">
          Product
        </a>
        <a className="transition hover:text-white" href="#solutions">
          Solutions
        </a>
        <a className="transition hover:text-white" href="#industries">
          Industries
        </a>
        <a className="transition hover:text-white" href="#why">
          Why Centris
        </a>
      </nav>
      <CtaPrimary size="sm">Book a demo</CtaPrimary>
    </header>
  );
}

function CtaPrimary({ children, size = "md", href = "#book" }) {
  const sizing =
    size === "sm" ? "h-9 px-4 text-[13px]" : "h-12 px-7 text-[15px]";
  return (
    <a
      href={href}
      className={`group inline-flex items-center gap-2 rounded-full bg-[#FF4550] font-sans font-medium text-white transition-all hover:bg-[#ff5d68] hover:shadow-[0_0_60px_-10px_rgba(255,69,80,0.6)] ${sizing}`}
    >
      {children}
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
    </a>
  );
}

function CtaQuiet({ children, href = "#" }) {
  return (
    <a
      href={href}
      className="group inline-flex items-center gap-2 font-sans text-[15px] text-white/80 transition hover:text-white"
    >
      <span className="underline decoration-white/30 underline-offset-4 transition group-hover:decoration-white">
        {children}
      </span>
      <ArrowUpRight className="size-4 -translate-y-px transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </a>
  );
}

/* Full-bleed background: ambient transcript stream — the product. */

const TRANSCRIPT_LINES = [
  "caller — hola, mi póliza no cubrió la consulta",
  "agent · spanish — vamos a revisarla ahora mismo",
  "centris — claim 80214 · denied (out-of-network)",
  "centris.suggest — 'puedo pedir una revisión de cobertura'",
  "caller — okay, but I waited two weeks for someone",
  "centris.tone — escalating · soften, acknowledge",
  "centris.suggest — 'I hear you, two weeks is too long'",
  "centris.next — offer expedited review · 48-hour SLA",
  "agent — 'I'll mark this expedited, 48 hours'",
  "centris.crm — note logged · category: coverage-dispute",
  "caller — alright, that works for me",
  "centris.summary — resolved · sentiment +0.3 · 6m12s",
  "caller — and could someone call me in Spanish next time",
  "centris.crm — preference flag · language: es-MX",
  "centris.handoff — back to queue · 47 calls waiting",
];

function TranscriptBackdrop() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 -z-10 overflow-hidden bg-[#02041A]"
    >
      <BackdropGradient />
      <TranscriptColumn delay={0} left="-22%" />
      <TranscriptColumn delay={-9} left="36%" reverse />
      <TranscriptColumn delay={-15} left="78%" />
      <BackdropSweep />
      <Vignette />
    </div>
  );
}

function BackdropGradient() {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 22% 28%, rgba(0, 23, 255, 0.32) 0%, transparent 65%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 88% 110%, rgba(255, 69, 80, 0.22) 0%, transparent 60%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(2, 4, 26, 0) 0%, rgba(2, 4, 26, 0.4) 60%, rgba(2, 4, 26, 1) 100%)",
        }}
      />
    </>
  );
}

function BackdropSweep() {
  return (
    <motion.div
      className="absolute inset-0 opacity-30"
      style={{
        backgroundImage:
          "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "120px 100%",
      }}
      initial={{ x: 0 }}
      animate={{ x: -120 }}
      transition={{ duration: 22, ease: "linear", repeat: Infinity }}
    />
  );
}

function TranscriptColumn({ delay, left, reverse = false }) {
  const lines = [...TRANSCRIPT_LINES, ...TRANSCRIPT_LINES, ...TRANSCRIPT_LINES];
  return (
    <div
      className="absolute top-0 h-full w-[30rem]"
      style={{
        left,
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 15%, black 75%, transparent 100%)",
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 15%, black 75%, transparent 100%)",
      }}
    >
      <motion.div
        className="flex flex-col font-mono text-[12px] leading-[2.3] text-white/40"
        initial={{ y: reverse ? "-50%" : "0%" }}
        animate={{ y: reverse ? "0%" : "-50%" }}
        transition={{
          duration: 65,
          ease: "linear",
          repeat: Infinity,
          delay,
        }}
      >
        {lines.map((line, i) => (
          <span key={i} className="block whitespace-nowrap px-4">
            <span className="text-white/30">
              {String((i % 99) + 1).padStart(2, "0")}
            </span>
            <span className="ml-3 text-white/60">{line}</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function Vignette() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          "linear-gradient(to bottom, rgba(2,4,26,0.55) 0%, rgba(2,4,26,0.30) 35%, rgba(2,4,26,0.85) 100%)",
      }}
    />
  );
}

/* IN ACTION — the product working. No card chrome. */

const SESSION = [
  {
    kind: "caller",
    text: "I called twice last week. Nobody got back to me.",
  },
  { kind: "centris-note", text: "tone · frustrated · prior contacts · 2" },
  {
    kind: "suggest",
    text: "Acknowledge the wait. Offer expedited review with a hard timeline.",
  },
  {
    kind: "agent",
    text: "I hear you — two weeks is too long. Let me mark this expedited, 48 hours.",
  },
  {
    kind: "caller-translate",
    text: "cliente — gracias, eso me ayuda mucho.",
  },
  { kind: "centris-note", text: "sentiment shift · −0.4 → +0.3" },
  { kind: "agent", text: "I'll send the confirmation in Spanish too." },
  {
    kind: "crm",
    text: "CRM note logged · coverage-dispute · expedited · es-MX preference.",
  },
];

function InAction() {
  return (
    <section id="in-action" className="relative border-t border-white/10">
      <div className="mx-auto grid max-w-7xl gap-16 px-6 py-28 md:grid-cols-[1fr_1.15fr] md:gap-24 lg:py-36">
        <div>
          <SectionMeta>01 — In action</SectionMeta>
          <h2
            className="mt-5 text-[clamp(2rem,4vw,3rem)] leading-[1.05] tracking-[-0.02em]"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            One conversation, end to end.
          </h2>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-white/60">
            Centris hears the call as it happens — reads the tone, pulls the
            relevant policy, suggests the next line. When the customer
            switches languages, so does the agent. The CRM note writes
            itself.
          </p>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-white/45">
            No copy-paste. No second screen. No after-call wrap-up.
          </p>
        </div>

        <SessionStream />
      </div>
    </section>
  );
}

function SectionMeta({ children }) {
  return (
    <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/45">
      {children}
    </span>
  );
}

function SessionStream() {
  return (
    <ol className="relative space-y-6">
      <span
        aria-hidden
        className="absolute left-[5px] top-2 bottom-2 w-px bg-white/15"
      />
      {SESSION.map((line, i) => (
        <motion.li
          key={i}
          className="relative flex gap-4 pl-7"
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{
            delay: i * 0.09,
            duration: 0.55,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <SessionMarker kind={line.kind} />
          <SessionLine line={line} />
        </motion.li>
      ))}
    </ol>
  );
}

function SessionMarker({ kind }) {
  const color =
    kind === "caller" || kind === "caller-translate"
      ? "bg-white/85"
      : kind === "agent"
        ? "bg-[#3a4cff]"
        : kind === "suggest"
          ? "bg-[#FF4550]"
          : kind === "crm"
            ? "bg-emerald-400"
            : "bg-white/30";
  return (
    <span
      aria-hidden
      className={`absolute left-[1px] top-[8px] size-2.5 rounded-full ${color}`}
    />
  );
}

function SessionLine({ line }) {
  if (line.kind === "centris-note") {
    return (
      <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-white/40">
        {line.text}
      </span>
    );
  }
  if (line.kind === "crm") {
    return (
      <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-emerald-300/85">
        {line.text}
      </span>
    );
  }
  if (line.kind === "suggest") {
    return (
      <span className="font-sans text-[15px] leading-relaxed text-[#ff8a91]">
        <span className="mr-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#ff8a91]/70">
          centris suggests
        </span>
        {line.text}
      </span>
    );
  }
  if (line.kind === "agent") {
    return (
      <span className="font-sans text-[15px] leading-relaxed text-white">
        <span className="mr-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#7a86ff]">
          agent
        </span>
        {line.text}
      </span>
    );
  }
  if (line.kind === "caller-translate") {
    return (
      <span className="font-sans text-[15px] italic leading-relaxed text-white/75">
        <span className="mr-3 font-mono text-[10px] not-italic uppercase tracking-[0.18em] text-white/35">
          customer · es
        </span>
        {line.text}
      </span>
    );
  }
  return (
    <span className="font-sans text-[15px] leading-relaxed text-white/85">
      <span className="mr-3 font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
        customer
      </span>
      {line.text}
    </span>
  );
}

/* SOLUTIONS — typographic list. No cards. */

const SOLUTIONS = [
  {
    label: "Sales",
    title: "Stop losing the close to silence.",
    body: "Centris reads buying signals live and surfaces the offer that fits — discount, bundle, or escalation — before the moment passes.",
  },
  {
    label: "Customer support",
    title: "First-call resolution as the default.",
    body: "Policy, account, and history in one panel. The agent answers in their voice; Centris keeps the facts honest.",
  },
  {
    label: "QA & compliance",
    title: "Every call, scored. No sampling.",
    body: "Rubrics run on every conversation in real time — not 3% picked after the fact. Coaching becomes specific, not vibes.",
  },
  {
    label: "Training",
    title: "Day-one agents sound like day-300 ones.",
    body: "Centris carries playbooks, tone, and brand voice. New hires learn by watching the system do the right thing.",
  },
  {
    label: "Knowledge base",
    title: "Documentation that updates itself.",
    body: "Every resolved call becomes a draft article. Reviewed, versioned, searchable — fed back into the next conversation.",
  },
  {
    label: "Reporting",
    title: "Why your numbers moved, not just where.",
    body: "Drivers per cohort, per agent, per topic. Trends pulled from the conversations themselves, not survey afterthoughts.",
  },
];

function Solutions() {
  return (
    <section id="solutions" className="relative border-t border-white/10">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-28 md:grid-cols-[1fr_2.1fr] md:gap-24 lg:py-36">
        <div>
          <SectionMeta>02 — Solutions</SectionMeta>
          <h2
            className="mt-5 text-[clamp(2rem,4vw,3rem)] leading-[1.05] tracking-[-0.02em]"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Wherever the conversation is, Centris is there.
          </h2>
        </div>
        <ul className="divide-y divide-white/12">
          {SOLUTIONS.map((s, i) => (
            <motion.li
              key={s.label}
              className="grid gap-2 py-7 first:pt-0 sm:grid-cols-[12rem_1fr] sm:gap-10"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                delay: i * 0.05,
                duration: 0.55,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40 sm:pt-1">
                {s.label}
              </span>
              <div>
                <h3
                  className="text-[clamp(1.4rem,2.3vw,1.75rem)] leading-[1.15] tracking-[-0.015em] text-white"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  {s.title}
                </h3>
                <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/55">
                  {s.body}
                </p>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* INDUSTRIES — single typographic ribbon. No boxes. */

const INDUSTRIES = [
  "Health insurance",
  "Energy & utilities",
  "Property & casualty",
  "Financial services",
  "Telecom",
  "Logistics",
  "Public sector",
];

function Industries() {
  return (
    <section id="industries" className="relative border-t border-white/10">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:py-28">
        <SectionMeta>03 — Industries</SectionMeta>
        <div
          className="mt-7 flex flex-wrap items-baseline gap-x-10 gap-y-3 text-[clamp(1.5rem,3vw,2.25rem)] leading-[1.1] tracking-[-0.015em]"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          {INDUSTRIES.map((m, i) => (
            <motion.span
              key={m}
              className="text-white/85"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.06, duration: 0.5, ease: "easeOut" }}
            >
              <span>{m}</span>
              {i < INDUSTRIES.length - 1 && (
                <span className="ml-10 text-white/30">·</span>
              )}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* WHY CENTRIS — manifesto. Three sentences, pull-quote scale. */

const WHY = [
  {
    head: "Bilingual by default.",
    body: "English ↔ Spanish at native quality. Translation is not a feature toggle — it's the floor.",
  },
  {
    head: "Live, not lagged.",
    body: "Suggestions land while the customer is still talking. Sub-second from utterance to assist.",
  },
  {
    head: "Auditable to the line.",
    body: "Every suggestion, every translation, every CRM note — traceable to the call, the policy, the moment.",
  },
];

function WhyCentris() {
  return (
    <section id="why" className="relative border-t border-white/10">
      <div className="mx-auto max-w-7xl px-6 py-28 lg:py-36">
        <SectionMeta>04 — Why Centris</SectionMeta>
        <div className="mt-10 grid gap-12 md:grid-cols-3 md:gap-14">
          {WHY.map((w, i) => (
            <motion.div
              key={w.head}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                delay: i * 0.08,
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <h3
                className="text-[clamp(1.75rem,3vw,2.25rem)] leading-[1.05] tracking-[-0.02em] text-white"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                {w.head}
              </h3>
              <p className="mt-4 text-[15px] leading-relaxed text-white/55">
                {w.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* CLOSING CTA — one sentence, one action. */

function ClosingCTA() {
  return (
    <section className="relative overflow-hidden border-t border-white/10">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 50% 110%, rgba(255, 69, 80, 0.20) 0%, transparent 60%), radial-gradient(ellipse 70% 60% at 50% -10%, rgba(0, 23, 255, 0.18) 0%, transparent 65%)",
        }}
      />
      <div className="relative mx-auto max-w-5xl px-6 py-36 text-center">
        <motion.h2
          className="text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.95] tracking-[-0.02em] text-balance text-white"
          style={{ fontFamily: "'Instrument Serif', serif" }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          Hear what your agents
          <br />
          could be saying.
        </motion.h2>
        <motion.div
          className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          <CtaPrimary>Book a 15-minute demo</CtaPrimary>
          <CtaQuiet href="#in-action">Or watch a live call</CtaQuiet>
        </motion.div>
      </div>
    </section>
  );
}

/* FOOTER — minimal. */

function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 px-6 py-12 font-mono text-[11px] uppercase tracking-[0.18em] text-white/40 sm:flex-row sm:items-center">
        <span>
          <span
            className="italic text-white/70"
            style={{
              fontFamily: "'Instrument Serif', serif",
              textTransform: "none",
              letterSpacing: 0,
            }}
          >
            Centris
          </span>
          {" "}— customer service, conducted
        </span>
        <div className="flex flex-wrap items-center gap-6">
          <a className="hover:text-white" href="#">
            Product
          </a>
          <a className="hover:text-white" href="#">
            Security
          </a>
          <a className="hover:text-white" href="#">
            Pricing
          </a>
          <a className="hover:text-white" href="#">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}

"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  Send,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  Languages,
  Headphones,
  TrendingUp,
  ClipboardCheck,
  BarChart3,
  Users,
  Database,
  MessageSquareText,
  Phone,
  Mail,
  MapPin,
  Play,
  Globe,
  Zap,
  Heart,
  Stethoscope,
  Plug,
  CreditCard,
  ShoppingBag,
  Building2,
  Star,
  Quote,
  PhoneCall,
  PhoneIncoming,
  Clock,
  CircleUserRound,
  Activity,
  PlugZap,
  Lock,
  Workflow,
} from "lucide-react";

const NAV = [
  { label: "Platform", href: "#assist" },
  { label: "Solutions", href: "#solutions" },
  { label: "Industries", href: "#industries" },
  { label: "Why Centris", href: "#why" },
  { label: "Resources", href: "#resources" },
];

const MODES = [
  {
    id: "agent",
    label: "Agent Assist",
    short: "What to say next",
    icon: Headphones,
    sample:
      "Customer says: I have called three times and no one fixed my bill.",
  },
  {
    id: "sales",
    label: "Sales",
    short: "Qualify & follow up",
    icon: TrendingUp,
    sample:
      "Qualify this lead: healthcare company, 8 agents, bilingual appointment setting, after-hours support, wants lower cost.",
  },
  {
    id: "qa",
    label: "QA Review",
    short: "Score interactions",
    icon: ClipboardCheck,
    sample:
      "Score this call: the agent solved the issue but sounded rushed and didn't confirm the customer understood the next step.",
  },
  {
    id: "reporting",
    label: "Client Reports",
    short: "Executive summaries",
    icon: BarChart3,
    sample:
      "Create a monthly client report summary with top issues, customer sentiment, and recommendations.",
  },
  {
    id: "training",
    label: "Training",
    short: "Coach & role-play",
    icon: Users,
    sample:
      "Create a role-play scenario for a new bilingual agent handling an angry billing customer.",
  },
  {
    id: "knowledge",
    label: "Knowledge",
    short: "Policy-safe answers",
    icon: Database,
    sample:
      "Create a policy-safe response for a customer asking for a refund exception.",
  },
];

const QUICK_PROMPTS = {
  agent: [
    "Angry billing customer",
    "Wants a refund",
    "Reschedule appointment",
    "Transfer to supervisor",
  ],
  sales: [
    "Qualify healthcare lead",
    "Follow-up email",
    "Handle price objection",
    "Build proposal outline",
  ],
  qa: [
    "Top 3 coaching points",
    "Find empathy gaps",
    "Compliance risks",
    "Supervisor coaching note",
  ],
  reporting: [
    "Monthly executive summary",
    "Customer sentiment recap",
    "Top complaint drivers",
    "Next-month priorities",
  ],
  training: [
    "10-min empathy module",
    "Bilingual role-play",
    "New-agent checklist",
    "Weekly coaching plan",
  ],
  knowledge: [
    "Build a customer FAQ",
    "Turn SOP into a script",
    "Refund policy explainer",
    "Escalation guidance",
  ],
};

const QUICK_PROMPT_TO_TEXT = {
  "Angry billing customer":
    "Customer is angry about a billing issue and threatening to cancel. Give me the best calm response.",
  "Wants a refund":
    "Customer is asking for a refund on a charge from last month. Give me a fair, policy-safe response.",
  "Reschedule appointment":
    "Customer needs to reschedule their appointment for next Tuesday. Confirm and give next steps.",
  "Transfer to supervisor":
    "Give me a calm script for transferring an upset caller to a supervisor.",
  "Qualify healthcare lead":
    "Qualify this lead: healthcare company, 8 agents, bilingual appointment setting, after-hours support, wants lower cost.",
  "Follow-up email":
    "Write a follow-up email for a logistics prospect comparing Centris to offshore support.",
  "Handle price objection":
    "Give me objection responses for price concerns vs. offshore providers.",
  "Build proposal outline":
    "Build a proposal outline for sales support, customer service, and AI QA reporting.",
  "Top 3 coaching points":
    "Score this interaction and identify the top 3 coaching opportunities.",
  "Find empathy gaps":
    "Find missed empathy, dead air, script gaps, compliance risks, and escalation issues.",
  "Compliance risks":
    "Review this call for compliance risks and recommend supervisor action.",
  "Supervisor coaching note":
    "Create a supervisor coaching note that is firm but supportive.",
  "Monthly executive summary":
    "Create an executive summary for a monthly client report.",
  "Customer sentiment recap":
    "Summarize sentiment, top complaints, agent wins, and next-month priorities.",
  "Top complaint drivers":
    "Turn call drivers into client recommendations and process improvements.",
  "Next-month priorities":
    "Create a client-ready list of next-month priorities and operational improvements.",
  "10-min empathy module":
    "Create a 10-minute training module on empathy statements and de-escalation.",
  "Bilingual role-play":
    "Build a role-play scenario for a billing complaint in English and Spanish.",
  "New-agent checklist":
    "Create a new-agent onboarding checklist for bilingual customer support.",
  "Weekly coaching plan":
    "Generate a weekly coaching plan for an agent struggling with call control.",
  "Build a customer FAQ":
    "Create a client FAQ from repeated customer questions.",
  "Turn SOP into a script":
    "Turn this SOP into a short agent script and a supervisor checklist.",
  "Refund policy explainer":
    "Explain a refund-exception policy in simple English and Spanish for agents.",
  "Escalation guidance":
    "Find the best answer for a refund request and flag when supervisor approval is needed.",
};

const SEED = {
  bestResponse:
    "I understand why you're frustrated, and I'm sorry you've had to call multiple times. I'm going to review your billing issue now and make sure you leave this call with a clear next step.",
  spanishVersion:
    "Entiendo por qué está frustrado, y lamento que haya tenido que llamar varias veces. Voy a revisar su problema de facturación ahora y asegurarme de que termine esta llamada con un próximo paso claro.",
  crmNotes:
    "Customer escalated billing issue; verified account, opened ticket #—, committed to follow-up by EOD. Empathy acknowledged, ownership stated, next step confirmed.",
  whyThisWorks: [
    "Acknowledges the customer's frustration",
    "Takes clear ownership of the resolution",
    "Commits to a concrete next step",
  ],
  nextSteps: [
    "Verify the account details on file",
    "Pull the last 3 months of billing history",
    "Confirm a follow-up time within 24 hours",
  ],
  riskLevel: "Low — standard billing escalation",
  recommendedAction:
    "Resolve in-call; supervisor only if customer requests cancellation",
};

const INDUSTRIES = [
  {
    icon: Stethoscope,
    name: "Healthcare",
    body: "Patient support, scheduling, claims, HIPAA-aware workflows.",
  },
  {
    icon: Plug,
    name: "Utilities",
    body: "Outages, billing, service requests at storm-day volume.",
  },
  {
    icon: CreditCard,
    name: "Financial",
    body: "Payments, disputes, account help — PCI-aware.",
  },
  {
    icon: ShoppingBag,
    name: "Retail",
    body: "Orders, returns, loyalty programs, holiday surges.",
  },
  {
    icon: Building2,
    name: "Enterprise",
    body: "BPO, back-office processing, escalations.",
  },
  {
    icon: Globe,
    name: "Public Sector",
    body: "Bilingual citizen services and intake.",
  },
];

const STATS = [
  { value: "30+", label: "Years in business" },
  { value: "100%", label: "Bilingual agents" },
  { value: "24/7/365", label: "Coverage" },
  { value: "Up to 45%", label: "Cost savings vs. U.S." },
];

const FEATURES = [
  {
    icon: Heart,
    title: "Human-first, always",
    body: "AI drafts the response. Your bilingual agent reviews, edits, and sends — every time.",
  },
  {
    icon: Languages,
    title: "Bilingual in one pass",
    body: "Every output generated in English and Spanish together — same tone, same intent.",
  },
  {
    icon: ShieldCheck,
    title: "Built for compliance",
    body: "Guardrails, redaction, audit logs, and supervisor approval gates for regulated work.",
  },
  {
    icon: Zap,
    title: "Live, not lagging",
    body: "Suggested replies, CRM notes, and next steps appear in seconds — not after the call.",
  },
  {
    icon: ClipboardCheck,
    title: "QA at scale",
    body: "Auto-score interactions for empathy, accuracy, compliance, and risk — supervisors finalize.",
  },
  {
    icon: BarChart3,
    title: "Reports that ship themselves",
    body: "Executive summaries, sentiment, and recommendations ready for your weekly client review.",
  },
];

const HOW_STEPS = [
  {
    n: "01",
    title: "Paste what the customer said",
    body: "Type a message, log a call, or pull in a transcript. Works for voice, chat, and email.",
    icon: PhoneIncoming,
  },
  {
    n: "02",
    title: "Centris AI Assist responds",
    body: "Best response, Spanish version, CRM notes, why it works, next steps, and risk flags.",
    icon: Sparkles,
  },
  {
    n: "03",
    title: "Your agent stays in control",
    body: "Copy, edit, send, or escalate. Every customer-facing reply is human-approved.",
    icon: ShieldCheck,
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Our bilingual agents close faster, and the Spanish output sounds native — not translated. Centris feels like a force multiplier, not a tool.",
    name: "Andrea Vargas",
    role: "Customer Success Director",
    company: "PivotalPay",
  },
  {
    quote:
      "QA scoring used to take a week. The assistant drafts coaching notes in seconds and our supervisors finalize them in minutes.",
    name: "Marcus Lee",
    role: "Head of Operations",
    company: "Brightlane",
  },
  {
    quote:
      "The reports practically write themselves. We surface trends our customers actually care about — and keep the human relationship in front.",
    name: "Priya Shah",
    role: "VP Client Success",
    company: "Northbridge Financial",
  },
];

const LOGOS = [
  "Northbridge",
  "PivotalPay",
  "Brightlane",
  "Solvix",
  "Onestep",
  "Bluepeak",
  "Helio",
  "Lattice",
  "Cobalt",
  "Greypath",
];

const SOLUTIONS = [
  {
    icon: Headphones,
    title: "Customer Service",
    body: "Inbound voice, chat, email — bilingual nearshore agents with live AI co-pilot.",
    bullets: ["Real-time suggestions", "Auto CRM notes", "Escalation flags"],
  },
  {
    icon: TrendingUp,
    title: "Sales & Lead Gen",
    body: "Qualification, follow-ups, objection handling, and proposal-ready language.",
    bullets: ["Lead scoring", "Follow-up drafts", "Pipeline reports"],
  },
  {
    icon: ClipboardCheck,
    title: "Quality & Coaching",
    body: "Score every interaction. Supervisors finalize coaching in minutes, not days.",
    bullets: ["Empathy & tone scoring", "Risk flags", "Coaching plans"],
  },
];

function CentrisMark({ size = 32 }) {
  const ring = Math.max(2, Math.round(size / 12));
  return (
    <span
      className="relative inline-block shrink-0"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{
          border: `${ring}px solid #0017FF`,
        }}
      />
      <span
        className="absolute rounded-full bg-centris-coral"
        style={{
          width: size * 0.34,
          height: size * 0.34,
          left: size * 0.33,
          top: size * 0.33,
        }}
      />
    </span>
  );
}

function CentrisLogo({ light = false }) {
  return (
    <a href="#" className="flex items-center gap-2.5">
      <CentrisMark size={32} />
      <span
        className={`font-extrabold tracking-tight text-xl font-display ${
          light ? "text-white" : "text-centris-deep"
        }`}
      >
        Centris
      </span>
    </a>
  );
}

function LivePill({ text = "Live" }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-2.5 py-1">
      <span className="relative inline-flex h-2 w-2 text-emerald-500">
        <span className="ping-soft" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      {text}
    </span>
  );
}

function TopNav({ onAssist }) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-centris-line/70">
      <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
        <CentrisLogo />
        <nav className="hidden lg:flex items-center gap-8">
          {NAV.map((n) => (
            <a
              key={n.label}
              href={n.href}
              className="text-sm font-medium text-centris-ink/80 hover:text-centris-blue transition"
            >
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <a
            href="#assist"
            className="hidden md:inline text-sm font-medium text-centris-ink/80 hover:text-centris-blue transition"
          >
            Sign in
          </a>
          <button
            onClick={onAssist}
            className="shine-wrap inline-flex items-center gap-1.5 rounded-full bg-centris-blue hover:bg-[#0014e0] text-white text-sm font-semibold px-4 py-2 shadow-soft transition"
          >
            Book a Demo
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}

function FloatingBlob({ className }) {
  return <div className={`absolute rounded-full blur-3xl ${className}`} />;
}

function Hero({ onAssist }) {
  return (
    <section className="relative overflow-hidden bg-aurora bg-noise">
      <div className="absolute inset-0 bg-grid bg-grid-fade opacity-60 pointer-events-none" />
      <FloatingBlob className="-top-32 -right-32 h-[520px] w-[520px] bg-centris-blue/15" />
      <FloatingBlob className="top-40 -left-40 h-[420px] w-[420px] bg-centris-coral/15" />

      <div className="relative max-w-7xl mx-auto px-5 md:px-8 pt-20 md:pt-28 pb-24 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-14 items-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-centris-blue/15 bg-white/80 backdrop-blur px-3 py-1.5 text-xs font-semibold text-centris-blue shadow-sm">
            <span className="relative inline-flex h-1.5 w-1.5 text-centris-blue">
              <span className="ping-soft" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-centris-blue" />
            </span>
            Now live — Centris AI Assist v1.0
          </div>

          <h1 className="mt-6 font-display font-extrabold tracking-tightest text-centris-deep text-[48px] md:text-[72px] xl:text-[84px] leading-[0.98]">
            Humans
            <br />
            powered by{" "}
            <span className="text-gradient-blue">AI.</span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-centris-ink/75 leading-relaxed max-w-xl">
            Centris blends bilingual nearshore agents with real-time AI
            assistance — so every interaction is faster, smarter, and more
            empathetic.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={onAssist}
              className="shine-wrap inline-flex items-center gap-2 rounded-full bg-centris-blue hover:bg-[#0014e0] text-white text-sm font-bold px-6 py-3.5 shadow-glow transition"
            >
              Try the assistant
              <ArrowRight className="h-4 w-4" />
            </button>
            <button className="inline-flex items-center gap-2 rounded-full bg-white border border-centris-line hover:border-centris-blue text-centris-deep text-sm font-bold px-6 py-3.5 transition">
              <Play className="h-4 w-4 text-centris-coral" />
              Watch the 90-sec demo
            </button>
          </div>

          <div className="mt-12 grid grid-cols-4 gap-6 max-w-xl">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="text-2xl md:text-3xl font-extrabold text-centris-deep tracking-tight font-display">
                  {s.value}
                </div>
                <div className="text-[11px] text-centris-muted mt-1 leading-tight">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="relative"
        >
          <HeroStack />
        </motion.div>
      </div>
    </section>
  );
}

function HeroStack() {
  return (
    <div className="relative h-[560px] md:h-[620px]">
      {/* Decorative glow */}
      <div className="absolute -inset-12 bg-gradient-to-br from-centris-blue/30 via-centris-coral/15 to-transparent rounded-[60px] blur-3xl" />

      {/* Active call info card (floating, top-left) */}
      <div className="absolute left-0 top-2 z-30 w-[260px] rounded-2xl bg-white shadow-card ring-1 ring-centris-line p-4 animate-floatA">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-centris-blue to-centris-coral flex items-center justify-center text-white font-bold text-sm">
              JR
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-centris-muted">Active call</div>
            <div className="text-sm font-bold text-centris-deep">
              Jordan R. • Billing
            </div>
          </div>
          <PhoneCall className="h-4 w-4 text-emerald-500" />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-centris-mist py-1.5">
            <div className="text-[9px] text-centris-muted uppercase tracking-wider">
              Duration
            </div>
            <div className="text-xs font-bold text-centris-deep">02:14</div>
          </div>
          <div className="rounded-lg bg-centris-mist py-1.5">
            <div className="text-[9px] text-centris-muted uppercase tracking-wider">
              Sentiment
            </div>
            <div className="text-xs font-bold text-centris-coral">Tense</div>
          </div>
          <div className="rounded-lg bg-centris-mist py-1.5">
            <div className="text-[9px] text-centris-muted uppercase tracking-wider">
              Tier
            </div>
            <div className="text-xs font-bold text-centris-deep">Premier</div>
          </div>
        </div>
      </div>

      {/* Main product card */}
      <div className="absolute right-0 top-12 z-20 w-[88%] md:w-[480px] rounded-[24px] bg-white ring-1 ring-centris-line shadow-card overflow-hidden">
        <div className="bg-centris-deep px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CentrisMark size={22} />
            <span className="text-white font-bold text-sm tracking-tight font-display">
              Centris AI Assist
            </span>
          </div>
          <LivePill />
        </div>
        <div className="p-5 space-y-3.5">
          <div className="rounded-xl bg-centris-mist border border-centris-line p-3.5">
            <div className="text-[10px] font-bold text-centris-blue uppercase tracking-widest mb-1">
              Customer said
            </div>
            <p className="text-sm text-centris-ink leading-relaxed">
              "I have called three times and no one fixed my bill."
            </p>
          </div>
          <div className="relative rounded-xl bg-gradient-to-br from-centris-blue to-[#3a4cff] text-white p-4 overflow-hidden">
            <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-90">
                  Best thing to say
                </span>
                <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-white/15 border border-white/20 rounded-full px-2 py-0.5">
                  <Star className="h-2.5 w-2.5 fill-white" /> Recommended
                </span>
              </div>
              <p className="text-sm leading-relaxed">
                I understand why you're frustrated, and I'm sorry you've had to
                call multiple times. I'm going to review your billing issue now
                and make sure you leave this call with a clear next step.
              </p>
            </div>
          </div>
          <div className="rounded-xl bg-white border border-centris-line p-3.5">
            <div className="text-[10px] font-bold text-centris-coral uppercase tracking-widest mb-1 inline-flex items-center gap-1">
              <Languages className="h-3 w-3" /> Spanish
            </div>
            <p className="text-sm text-centris-ink leading-relaxed">
              Entiendo por qué está frustrado, y lamento que haya tenido que
              llamar varias veces. Voy a revisar su problema de facturación
              ahora.
            </p>
          </div>
        </div>
      </div>

      {/* QA card (floating, bottom-left) */}
      <div className="absolute left-2 bottom-6 z-30 w-[260px] rounded-2xl bg-white shadow-card ring-1 ring-centris-line p-4 animate-floatB">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-centris-deep">
            <ClipboardCheck className="h-4 w-4 text-centris-blue" /> QA Score
          </div>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
            +12 vs avg
          </span>
        </div>
        <div className="space-y-2">
          <ScoreBar label="Empathy" value={94} />
          <ScoreBar label="Resolution" value={88} />
          <ScoreBar label="Compliance" value={96} />
        </div>
      </div>

      {/* Floating coral CTA bubble */}
      <div className="absolute right-6 bottom-0 z-30 inline-flex items-center gap-2 rounded-full bg-centris-coral text-white text-xs font-bold px-3 py-2 shadow-coral animate-floatA">
        <Sparkles className="h-3.5 w-3.5" /> +38% faster first response
      </div>
    </div>
  );
}

function ScoreBar({ label, value }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] text-centris-muted mb-1 font-semibold">
        <span>{label}</span>
        <span className="text-centris-deep">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-centris-mist overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-centris-blue to-centris-coral"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function LogoMarquee() {
  const row = [...LOGOS, ...LOGOS];
  return (
    <section className="bg-white border-y border-centris-line/70 py-10">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <div className="text-center text-[11px] tracking-[0.25em] font-bold text-centris-muted mb-6">
          TRUSTED BY LEADING SUPPORT TEAMS
        </div>
        <div className="mask-fade-x overflow-hidden">
          <div className="flex w-[200%] animate-marquee">
            {row.map((b, i) => (
              <div
                key={i}
                className="shrink-0 w-1/10 px-8 text-center text-centris-deep/55 font-extrabold text-lg tracking-tight font-display"
                style={{ width: `${100 / row.length}%` }}
              >
                {b}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeader({ eyebrow, title, body, align = "left" }) {
  return (
    <div
      className={`max-w-2xl ${
        align === "center" ? "text-center mx-auto" : ""
      } mb-12`}
    >
      {eyebrow && (
        <div className="text-xs font-bold tracking-[0.2em] text-centris-blue uppercase mb-3">
          {eyebrow}
        </div>
      )}
      <h2 className="font-display text-[34px] md:text-[52px] leading-[1.04] font-extrabold tracking-tightest text-centris-deep">
        {title}
      </h2>
      {body && (
        <p className="mt-4 text-lg text-centris-ink/70 leading-relaxed">
          {body}
        </p>
      )}
    </div>
  );
}

function CopyChip({ text, label = "Copy", className = "" }) {
  const [copied, setCopied] = useState(false);
  async function go() {
    try {
      await navigator.clipboard.writeText(text || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  }
  return (
    <button
      onClick={go}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold transition ${className}`}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" /> Copied
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" /> {label}
        </>
      )}
    </button>
  );
}

function AssistantModule({ assistRef }) {
  const [mode, setMode] = useState("agent");
  const [input, setInput] = useState(
    "I have called three times and no one fixed my bill."
  );
  const [result, setResult] = useState(SEED);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [escalated, setEscalated] = useState(false);
  const [sentCRM, setSentCRM] = useState(false);
  const [callSeconds, setCallSeconds] = useState(134);
  const taRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const activeMode = MODES.find((m) => m.id === mode);
  const placeholder = useMemo(() => activeMode?.sample || "", [activeMode]);

  async function generate(custom) {
    const text = (custom ?? input).trim();
    if (!text || loading) return;
    setInput(text);
    setLoading(true);
    setError("");
    setEscalated(false);
    setSentCRM(false);
    try {
      const res = await fetch("/api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "AI request failed.");
      setResult({
        bestResponse: data.bestResponse || SEED.bestResponse,
        spanishVersion: data.spanishVersion || SEED.spanishVersion,
        crmNotes: data.crmNotes || SEED.crmNotes,
        whyThisWorks:
          Array.isArray(data.whyThisWorks) &&
          data.whyThisWorks.filter(Boolean).length
            ? data.whyThisWorks.filter(Boolean)
            : SEED.whyThisWorks,
        nextSteps:
          Array.isArray(data.nextSteps) && data.nextSteps.filter(Boolean).length
            ? data.nextSteps.filter(Boolean)
            : SEED.nextSteps,
        riskLevel: data.riskLevel || SEED.riskLevel,
        recommendedAction:
          data.recommendedAction || SEED.recommendedAction,
      });
    } catch (err) {
      setError(err.message || "Unable to reach the AI service.");
      setResult(SEED);
    } finally {
      setLoading(false);
    }
  }

  function pickQuick(label) {
    const text = QUICK_PROMPT_TO_TEXT[label] || label;
    setInput(text);
    generate(text);
  }

  const mm = String(Math.floor(callSeconds / 60)).padStart(2, "0");
  const ss = String(callSeconds % 60).padStart(2, "0");

  return (
    <section
      id="assist"
      ref={assistRef}
      className="relative bg-centris-paper py-20 md:py-28 scroll-mt-24 overflow-hidden"
    >
      <div className="absolute inset-0 bg-grid bg-grid-fade opacity-40 pointer-events-none" />
      <FloatingBlob className="top-10 right-0 h-[400px] w-[400px] bg-centris-blue/10" />
      <FloatingBlob className="bottom-10 left-10 h-[300px] w-[300px] bg-centris-coral/10" />

      <div className="relative max-w-7xl mx-auto px-5 md:px-8">
        <SectionHeader
          eyebrow="Try it live"
          align="center"
          title={
            <>
              The AI co-pilot for your{" "}
              <span className="text-gradient-blue">call center.</span>
            </>
          }
          body="Type what the customer said. Get the best response, Spanish version, CRM notes, why it works, next steps, and escalation guidance — in seconds."
        />

        <div className="rounded-[28px] bg-white ring-1 ring-centris-line shadow-card overflow-hidden">
          {/* Header bar */}
          <div className="bg-centris-deep text-white px-5 md:px-7 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CentrisMark size={26} />
              <div>
                <div className="font-bold text-sm tracking-tight font-display">
                  Centris AI Assist
                </div>
                <div className="text-[11px] text-white/60">
                  Get the best response instantly.
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 text-emerald-200 text-[11px] font-semibold px-2.5 py-1 border border-emerald-400/25">
                <span className="relative inline-flex h-1.5 w-1.5 text-emerald-400">
                  <span className="ping-soft" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                Live session · {mm}:{ss}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 text-white/90 text-[11px] font-semibold px-2.5 py-1">
                <Globe className="h-3 w-3" /> EN / ES
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="grid grid-cols-12">
            {/* Sidebar with caller context */}
            <aside className="col-span-12 md:col-span-3 border-r border-centris-line bg-white p-3 md:p-4">
              <div className="rounded-xl bg-centris-deep text-white p-3 mb-3 relative overflow-hidden">
                <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-centris-coral/30 blur-2xl" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-centris-blue to-centris-coral flex items-center justify-center font-bold text-xs">
                      JR
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-white/60 uppercase tracking-widest">
                        Caller
                      </div>
                      <div className="text-sm font-bold truncate">
                        Jordan R.
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-center">
                    <div className="rounded-md bg-white/5 py-1">
                      <div className="text-[9px] text-white/50">Tier</div>
                      <div className="text-[11px] font-bold">Premier</div>
                    </div>
                    <div className="rounded-md bg-white/5 py-1">
                      <div className="text-[9px] text-white/50">Lang</div>
                      <div className="text-[11px] font-bold">EN</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[10px] tracking-[0.2em] text-centris-muted font-bold uppercase mb-2 px-2">
                Workflow
              </div>
              <div className="space-y-1">
                {MODES.map((m) => {
                  const Icon = m.icon;
                  const active = mode === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id)}
                      className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                        active
                          ? "bg-centris-blue text-white shadow-soft"
                          : "text-centris-ink/80 hover:bg-centris-mist"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold leading-tight">
                          {m.label}
                        </div>
                        <div
                          className={`text-[11px] leading-tight ${
                            active ? "text-white/75" : "text-centris-muted"
                          }`}
                        >
                          {m.short}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 rounded-xl bg-centris-mist border border-centris-line p-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-centris-deep mb-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-centris-blue" />
                  Guardrails on
                </div>
                <p className="text-[11px] text-centris-muted leading-snug">
                  Human approval required for sensitive actions. Don't enter
                  private customer data into the demo.
                </p>
              </div>
            </aside>

            {/* Main */}
            <div className="col-span-12 md:col-span-9 p-5 md:p-7 bg-gradient-to-b from-centris-mist/50 to-white">
              {/* Input */}
              <div className="rounded-2xl bg-white border border-centris-line p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-centris-blue inline-flex items-center gap-1.5">
                    <MessageSquareText className="h-3.5 w-3.5" />
                    What did the customer say?
                  </label>
                  <span className="text-[11px] text-centris-muted">
                    {input.length}/500
                  </span>
                </div>
                <textarea
                  ref={taRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value.slice(0, 500))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      generate();
                    }
                  }}
                  rows={2}
                  placeholder={placeholder}
                  className="w-full bg-transparent border-0 outline-none text-centris-ink text-sm resize-none placeholder:text-centris-muted/70"
                />
                <div className="mt-2 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex flex-wrap gap-1.5">
                    {(QUICK_PROMPTS[mode] || []).map((q) => (
                      <button
                        key={q}
                        onClick={() => pickQuick(q)}
                        disabled={loading}
                        className="rounded-full bg-centris-mist hover:bg-centris-blue hover:text-white text-centris-ink text-[11px] font-medium px-3 py-1 transition disabled:opacity-50"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => generate()}
                    disabled={loading || !input.trim()}
                    className="shine-wrap inline-flex items-center gap-1.5 rounded-full bg-centris-blue hover:bg-[#0014e0] disabled:opacity-50 text-white text-xs font-bold px-4 py-2 shadow-soft transition"
                  >
                    {loading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    {loading ? "Generating" : "Generate"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs px-3 py-2 flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    {error} — showing a sample response so you can still
                    explore the UI.
                  </span>
                </div>
              )}

              {/* Output: Best + Spanish */}
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                <div className="rounded-2xl bg-gradient-to-br from-centris-blue to-[#3a4cff] text-white p-5 shadow-soft relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold uppercase tracking-widest opacity-90">
                        Best thing to say
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-white/15 border border-white/20 rounded-full px-2 py-0.5">
                        <Star className="h-2.5 w-2.5 fill-white" />
                        Recommended
                      </span>
                    </div>
                    <p className="text-base leading-relaxed min-h-[5.5rem]">
                      {loading ? <Shimmer dark /> : result.bestResponse}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <CopyChip
                        text={result.bestResponse}
                        label="Copy response"
                        className="text-white/90 hover:text-white"
                      />
                      <span className="text-[11px] text-white/70">
                        {result.riskLevel}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white border border-centris-line p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-centris-coral inline-flex items-center gap-1.5">
                      <Languages className="h-3.5 w-3.5" />
                      Spanish version
                    </span>
                    <span className="text-[10px] font-bold text-centris-muted">
                      Native parity
                    </span>
                  </div>
                  <p className="text-base text-centris-ink leading-relaxed min-h-[5.5rem]">
                    {loading ? <Shimmer /> : result.spanishVersion}
                  </p>
                  <div className="mt-4">
                    <CopyChip
                      text={result.spanishVersion}
                      label="Copy"
                      className="text-centris-blue hover:text-[#0014e0]"
                    />
                  </div>
                </div>
              </div>

              {/* Why + Next + CRM */}
              <div className="mt-3.5 grid grid-cols-1 lg:grid-cols-3 gap-3.5">
                <div className="rounded-2xl bg-white border border-centris-line p-5">
                  <div className="text-[11px] font-bold uppercase tracking-widest text-centris-deep inline-flex items-center gap-1.5 mb-3">
                    <Check className="h-3.5 w-3.5 text-centris-blue" />
                    Why this works
                  </div>
                  <ul className="space-y-2.5">
                    {(loading
                      ? [0, 1, 2]
                      : result.whyThisWorks.slice(0, 4)
                    ).map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-centris-ink"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-centris-blue shrink-0" />
                        {loading ? (
                          <span className="h-3 rounded bg-centris-mist animate-pulse w-40" />
                        ) : (
                          <span>{item}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl bg-white border border-centris-line p-5">
                  <div className="text-[11px] font-bold uppercase tracking-widest text-centris-deep inline-flex items-center gap-1.5 mb-3">
                    <ClipboardCheck className="h-3.5 w-3.5 text-centris-blue" />
                    Next steps
                  </div>
                  <ol className="space-y-3">
                    {(loading
                      ? [0, 1, 2]
                      : result.nextSteps.slice(0, 4)
                    ).map((s, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-sm text-centris-ink"
                      >
                        <span className="h-5 w-5 rounded-full bg-centris-blue text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        {loading ? (
                          <span className="mt-0.5 h-3 rounded bg-centris-mist animate-pulse w-44" />
                        ) : (
                          <span className="leading-snug">{s}</span>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="rounded-2xl bg-centris-deep text-white p-5 relative overflow-hidden">
                  <div className="absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-centris-coral/30 blur-2xl" />
                  <div className="relative">
                    <div className="text-[11px] font-bold uppercase tracking-widest text-white/60 inline-flex items-center gap-1.5 mb-3">
                      <Database className="h-3.5 w-3.5 text-centris-coral" />
                      CRM Notes
                    </div>
                    <p className="text-sm leading-relaxed min-h-[5rem] text-white/90">
                      {loading ? <Shimmer dark /> : result.crmNotes}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <CopyChip
                        text={result.crmNotes}
                        label="Copy notes"
                        className="text-white/90 hover:text-white"
                      />
                      <button
                        onClick={() => {
                          setSentCRM(true);
                          setTimeout(() => setSentCRM(false), 1800);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-centris-coral hover:text-white"
                      >
                        {sentCRM ? "Sent" : "Send to CRM"}{" "}
                        <ArrowUpRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommended action + Escalate */}
              <div className="mt-3.5 rounded-2xl bg-white border border-centris-line p-4 flex flex-col md:flex-row md:items-center gap-3 justify-between">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-centris-coral/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-4 w-4 text-centris-coral" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-widest text-centris-coral">
                      Risk &amp; recommended action
                    </div>
                    <div className="text-sm text-centris-ink mt-0.5">
                      {result.recommendedAction}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEscalated(true);
                    setTimeout(() => setEscalated(false), 2200);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full text-xs font-bold px-4 py-2 transition shine-wrap ${
                    escalated
                      ? "bg-emerald-500 text-white"
                      : "bg-centris-coral hover:bg-[#e83843] text-white"
                  }`}
                >
                  {escalated ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Sent to supervisor
                    </>
                  ) : (
                    <>
                      Escalate to supervisor
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Shimmer({ dark = false }) {
  const base = dark ? "bg-white/15" : "bg-centris-mist";
  return (
    <span className="block space-y-2">
      <span className={`block h-3 w-11/12 rounded ${base} animate-pulse`} />
      <span className={`block h-3 w-10/12 rounded ${base} animate-pulse`} />
      <span className={`block h-3 w-9/12 rounded ${base} animate-pulse`} />
    </span>
  );
}

function SolutionsSection() {
  return (
    <section id="solutions" className="bg-white py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <SectionHeader
          eyebrow="Solutions"
          title={
            <>
              One platform.{" "}
              <span className="text-gradient-blue">Three workflows.</span>
            </>
          }
          body="Plug Centris AI Assist into customer service, sales, and quality — all powered by your bilingual nearshore agents."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {SOLUTIONS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="group relative rounded-3xl bg-white ring-1 ring-centris-line p-7 hover:ring-centris-blue/30 hover:shadow-card transition"
              >
                <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-3xl bg-gradient-to-r from-centris-blue via-centris-blue2 to-centris-coral opacity-0 group-hover:opacity-100 transition" />
                <div className="h-12 w-12 rounded-2xl bg-centris-mist border border-centris-line flex items-center justify-center group-hover:bg-centris-blue group-hover:border-centris-blue transition">
                  <Icon className="h-5 w-5 text-centris-blue group-hover:text-white transition" />
                </div>
                <h3 className="mt-5 text-2xl font-bold text-centris-deep font-display tracking-tight">
                  {s.title}
                </h3>
                <p className="mt-2 text-centris-ink/70 leading-relaxed">
                  {s.body}
                </p>
                <ul className="mt-5 space-y-2">
                  {s.bullets.map((b) => (
                    <li
                      key={b}
                      className="flex items-center gap-2 text-sm text-centris-ink"
                    >
                      <Check className="h-4 w-4 text-centris-blue shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
                <a
                  href="#assist"
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-centris-blue hover:text-[#0014e0]"
                >
                  Learn more <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className="bg-centris-paper py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid bg-grid-fade opacity-40 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-5 md:px-8">
        <SectionHeader
          eyebrow="What you get"
          title={
            <>
              Everything your support team needs —{" "}
              <span className="text-centris-coral">nothing they don't.</span>
            </>
          }
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: i * 0.04 }}
                className="group rounded-2xl bg-white ring-1 ring-centris-line p-6 hover:ring-centris-blue/30 hover:shadow-card transition"
              >
                <div className="h-11 w-11 rounded-xl bg-centris-mist border border-centris-line flex items-center justify-center mb-4 group-hover:bg-centris-blue group-hover:border-centris-blue transition">
                  <Icon className="h-5 w-5 text-centris-blue group-hover:text-white transition" />
                </div>
                <h3 className="text-lg font-bold text-centris-deep font-display tracking-tight">
                  {f.title}
                </h3>
                <p className="text-sm text-centris-ink/70 leading-relaxed mt-2">
                  {f.body}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function BilingualSection() {
  return (
    <section className="bg-white py-20 md:py-28 relative overflow-hidden">
      <FloatingBlob className="-top-32 right-0 h-[420px] w-[420px] bg-centris-coral/10" />
      <div className="relative max-w-7xl mx-auto px-5 md:px-8 grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-centris-coral/20 bg-centris-coral/5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-centris-coral mb-4">
            <Languages className="h-3.5 w-3.5" /> Bilingual by design
          </div>
          <h2 className="font-display text-[34px] md:text-[52px] leading-[1.04] font-extrabold tracking-tightest text-centris-deep">
            English and Spanish.{" "}
            <span className="text-gradient-blue">One pass.</span>
          </h2>
          <p className="mt-5 text-lg text-centris-ink/70 leading-relaxed max-w-md">
            Every response, CRM note, and script is produced in both languages
            in a single generation — same tone, same intent, no drift.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 max-w-md">
            <StatPill label="Tone match" value="98%" />
            <StatPill label="Latency" value="< 2s" />
            <StatPill label="Glossary aware" value="Yes" />
            <StatPill label="Custom voice" value="Per-client" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3">
          <DialogueBubble
            from="customer"
            lang="EN"
            text="I have called three times and no one fixed my bill."
          />
          <DialogueBubble
            from="ai"
            lang="EN"
            text="I understand why you're frustrated, and I'm sorry you've had to call multiple times. I'm going to review your billing issue now and make sure you leave this call with a clear next step."
            badge="Best thing to say"
          />
          <DialogueBubble
            from="ai"
            lang="ES"
            text="Entiendo por qué está frustrado, y lamento que haya tenido que llamar varias veces. Voy a revisar su problema de facturación ahora y asegurarme de que termine esta llamada con un próximo paso claro."
            badge="Versión en español"
            coral
          />
        </div>
      </div>
    </section>
  );
}

function StatPill({ label, value }) {
  return (
    <div className="rounded-2xl border border-centris-line bg-white px-4 py-3">
      <div className="text-xl font-extrabold text-centris-deep font-display tracking-tight">
        {value}
      </div>
      <div className="text-[11px] text-centris-muted uppercase tracking-wider mt-0.5">
        {label}
      </div>
    </div>
  );
}

function DialogueBubble({ from, lang, text, badge, coral }) {
  if (from === "customer") {
    return (
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-centris-mist border border-centris-line flex items-center justify-center text-centris-deep font-bold text-xs">
          JR
        </div>
        <div className="flex-1 max-w-[520px]">
          <div className="text-[10px] text-centris-muted uppercase tracking-widest mb-1 font-bold">
            Customer · {lang}
          </div>
          <div className="rounded-2xl rounded-tl-md bg-white border border-centris-line px-4 py-3 text-centris-ink leading-relaxed">
            {text}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3 justify-end">
      <div className="flex-1 max-w-[520px]">
        <div
          className={`text-[10px] uppercase tracking-widest mb-1 font-bold text-right ${
            coral ? "text-centris-coral" : "text-centris-blue"
          }`}
        >
          {badge} · {lang}
        </div>
        <div
          className={`relative rounded-2xl rounded-tr-md px-4 py-3 leading-relaxed text-white overflow-hidden ${
            coral
              ? "bg-gradient-to-br from-centris-coral to-[#e83843]"
              : "bg-gradient-to-br from-centris-blue to-[#3a4cff]"
          }`}
        >
          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <span className="relative">{text}</span>
        </div>
      </div>
      <div className="h-9 w-9 rounded-full bg-centris-deep flex items-center justify-center shrink-0">
        <CentrisMark size={20} />
      </div>
    </div>
  );
}

function HowItWorks() {
  return (
    <section className="bg-centris-paper py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <SectionHeader
          eyebrow="How it works"
          align="center"
          title={
            <>
              From customer message to{" "}
              <span className="text-gradient-blue">confident reply.</span>
            </>
          }
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {HOW_STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="relative rounded-3xl bg-white ring-1 ring-centris-line p-7"
              >
                <div className="flex items-center justify-between">
                  <div className="text-centris-blue text-xs font-bold tracking-[0.25em] font-display">
                    STEP {s.n}
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-centris-mist border border-centris-line flex items-center justify-center">
                    <Icon className="h-5 w-5 text-centris-blue" />
                  </div>
                </div>
                <h3 className="mt-4 text-xl font-bold text-centris-deep font-display tracking-tight">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-centris-ink/70 leading-relaxed">
                  {s.body}
                </p>
                {i < HOW_STEPS.length - 1 && (
                  <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 h-7 w-7 items-center justify-center rounded-full bg-white ring-1 ring-centris-line text-centris-blue z-10">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function IndustriesSection() {
  return (
    <section id="industries" className="bg-white py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="max-w-xl">
            <div className="text-xs font-bold tracking-[0.2em] text-centris-blue uppercase mb-3">
              Industries
            </div>
            <h2 className="font-display text-[34px] md:text-[52px] leading-[1.04] font-extrabold tracking-tightest text-centris-deep">
              Built for the work your customers depend on.
            </h2>
          </div>
          <p className="text-centris-ink/70 max-w-md text-lg">
            Centris partners with regulated, high-volume, and seasonal teams —
            bilingual nearshore agents and AI assistance in every workflow.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {INDUSTRIES.map((i) => {
            const Icon = i.icon;
            return (
              <div
                key={i.name}
                className="group rounded-2xl ring-1 ring-centris-line bg-white hover:bg-centris-deep hover:ring-centris-deep p-5 transition cursor-default"
              >
                <div className="h-9 w-9 rounded-xl bg-centris-mist border border-centris-line flex items-center justify-center group-hover:bg-centris-coral/15 group-hover:border-centris-coral/30 transition">
                  <Icon className="h-4 w-4 text-centris-blue group-hover:text-centris-coral transition" />
                </div>
                <div className="mt-3 font-bold text-centris-deep group-hover:text-white transition font-display tracking-tight">
                  {i.name}
                </div>
                <div className="text-xs text-centris-ink/60 group-hover:text-white/70 mt-1 transition leading-snug">
                  {i.body}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StatsBand() {
  return (
    <section className="bg-centris-deep text-white py-20 relative overflow-hidden">
      <FloatingBlob className="-top-32 -left-32 h-[420px] w-[420px] bg-centris-blue/30" />
      <FloatingBlob className="-bottom-32 -right-32 h-[420px] w-[420px] bg-centris-coral/20" />
      <div className="relative max-w-7xl mx-auto px-5 md:px-8">
        <div className="max-w-2xl mb-10">
          <div className="text-xs font-bold tracking-[0.2em] text-white/60 uppercase mb-3">
            By the numbers
          </div>
          <h2 className="font-display text-[34px] md:text-[48px] leading-[1.05] font-extrabold tracking-tightest">
            Three decades. Real outcomes.
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-4xl md:text-5xl font-extrabold tracking-tight font-display">
                {s.value}
              </div>
              <div className="text-sm text-white/70 mt-2">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section id="why" className="bg-white py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <SectionHeader
          eyebrow="Why Centris"
          title="Loved by support leaders."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="relative rounded-3xl ring-1 ring-centris-line bg-centris-paper p-7 flex flex-col"
            >
              <Quote className="h-6 w-6 text-centris-coral mb-3" />
              <p className="text-centris-ink leading-relaxed flex-1">
                "{t.quote}"
              </p>
              <div className="mt-6 pt-5 border-t border-centris-line flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-centris-blue to-centris-coral flex items-center justify-center text-white font-bold text-xs">
                  {t.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <div className="font-bold text-centris-deep text-sm font-display tracking-tight">
                    {t.name}
                  </div>
                  <div className="text-xs text-centris-muted mt-0.5">
                    {t.role} · {t.company}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SecurityRow() {
  const badges = [
    "SOC 2 (in progress)",
    "HIPAA on request",
    "PCI-aware",
    "GDPR",
    "PII redaction",
    "Audit logs",
  ];
  return (
    <section id="resources" className="bg-centris-paper py-20 md:py-24">
      <div className="max-w-7xl mx-auto px-5 md:px-8 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-10 items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-centris-blue/15 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-centris-blue mb-4">
            <Lock className="h-3.5 w-3.5" /> Built for regulated work
          </div>
          <h2 className="font-display text-[34px] md:text-[44px] leading-[1.05] font-extrabold tracking-tightest text-centris-deep">
            Guardrails your compliance team will love.
          </h2>
          <p className="mt-4 text-centris-ink/70 leading-relaxed max-w-xl">
            Human-in-the-loop by default. Configurable redaction, role-based
            access, region pinning, and an audit log for every AI output.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {badges.map((b) => (
              <span
                key={b}
                className="inline-flex items-center gap-1.5 rounded-full bg-white border border-centris-line px-3 py-1.5 text-xs font-semibold text-centris-deep"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-centris-blue" /> {b}
              </span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              icon: Lock,
              title: "Private by design",
              body: "No customer data used to train models. BYO key supported.",
            },
            {
              icon: Activity,
              title: "Full audit visibility",
              body: "Every prompt and response logged with timestamps and reviewer.",
            },
            {
              icon: ShieldCheck,
              title: "Human approval",
              body: "Sensitive workflows require supervisor sign-off.",
            },
            {
              icon: PlugZap,
              title: "Plug into your stack",
              body: "Salesforce, HubSpot, Zendesk, Genesys, NICE, Talkdesk.",
            },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.title}
                className="rounded-2xl bg-white ring-1 ring-centris-line p-5"
              >
                <Icon className="h-5 w-5 text-centris-blue mb-3" />
                <div className="font-bold text-centris-deep font-display tracking-tight">
                  {c.title}
                </div>
                <div className="text-xs text-centris-ink/70 mt-1 leading-relaxed">
                  {c.body}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CTASection({ onAssist }) {
  return (
    <section className="bg-white pb-20 md:pb-28">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-centris-blue via-[#1a2eff] to-centris-deep text-white p-10 md:p-16">
          <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-centris-coral/35 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute inset-0 bg-grid bg-grid-fade opacity-15 pointer-events-none" />

          <div className="relative grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wider mb-5">
                <Sparkles className="h-3.5 w-3.5" /> Ready when you are
              </div>
              <h2 className="font-display text-[34px] md:text-[56px] leading-[1.05] font-extrabold tracking-tightest">
                Bring human-first, AI-powered support to every interaction.
              </h2>
              <p className="mt-4 text-white/85 max-w-xl text-lg">
                Book a 20-minute demo. We'll show the assistant running on
                your real workflows — bilingual agents included.
              </p>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <button
                onClick={onAssist}
                className="shine-wrap inline-flex items-center justify-center gap-2 rounded-full bg-white text-centris-deep font-bold text-sm px-6 py-3.5 hover:bg-centris-mist transition shadow-soft"
              >
                Try the assistant
                <ArrowRight className="h-4 w-4" />
              </button>
              <button className="shine-wrap inline-flex items-center justify-center gap-2 rounded-full bg-centris-coral hover:bg-[#e83843] text-white font-bold text-sm px-6 py-3.5 transition shadow-coral">
                Book a demo
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    {
      title: "Platform",
      links: [
        "Agent Assist",
        "Sales",
        "QA Review",
        "Client Reports",
        "Training",
      ],
    },
    {
      title: "Industries",
      links: [
        "Healthcare",
        "Utilities",
        "Financial",
        "Retail",
        "Public Sector",
      ],
    },
    {
      title: "Company",
      links: ["About", "Careers", "Locations", "Press", "Contact"],
    },
    {
      title: "Resources",
      links: ["Blog", "Case Studies", "Docs", "Security", "Privacy"],
    },
  ];
  return (
    <footer id="about" className="bg-centris-deep text-white pt-20 pb-10 relative overflow-hidden">
      <FloatingBlob className="-top-32 -right-32 h-[420px] w-[420px] bg-centris-blue/30" />
      <div className="relative max-w-7xl mx-auto px-5 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10">
          <div className="col-span-2">
            <CentrisLogo light />
            <p className="mt-4 text-white/70 text-sm max-w-xs leading-relaxed">
              Humans powered by AI. Bilingual, nearshore contact center
              solutions for U.S. brands — 30+ years of human-first support.
            </p>
            <div className="mt-5 space-y-2 text-sm text-white/75">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-centris-coral" /> Contact Sales
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-centris-coral" />{" "}
                hello@centrisinfo.com
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-centris-coral" /> U.S. HQ ·
                Nearshore Mexico
              </div>
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <div className="text-xs font-bold tracking-[0.2em] uppercase text-white/60 mb-4">
                {c.title}
              </div>
              <ul className="space-y-2.5">
                {c.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-white/80 hover:text-centris-coral transition"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <div>
            © {new Date().getFullYear()} Centris Information Services. All
            rights reserved.
          </div>
          <div>Built for bilingual nearshore support teams.</div>
        </div>
      </div>
    </footer>
  );
}

export default function CentrisAIAssistPage() {
  const assistRef = useRef(null);

  function scrollToAssist() {
    assistRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="bg-centris-paper">
      <TopNav onAssist={scrollToAssist} />
      <Hero onAssist={scrollToAssist} />
      <LogoMarquee />
      <AssistantModule assistRef={assistRef} />
      <SolutionsSection />
      <BilingualSection />
      <FeaturesSection />
      <HowItWorks />
      <IndustriesSection />
      <StatsBand />
      <Testimonials />
      <SecurityRow />
      <CTASection onAssist={scrollToAssist} />
      <Footer />
    </main>
  );
}

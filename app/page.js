"use client";

import React, { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  ChevronDown,
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
  Award,
  Clock,
  Building2,
  Stethoscope,
  Plug,
  CreditCard,
  ShoppingBag,
  Star,
} from "lucide-react";

const NAV = [
  { label: "Services", href: "#services" },
  { label: "Industries", href: "#industries" },
  { label: "AI Assist", href: "#assist" },
  { label: "Why Centris", href: "#why" },
  { label: "About", href: "#about" },
];

const MODES = [
  {
    id: "agent",
    label: "Agent Assist",
    short: "What to say next",
    icon: Headphones,
    sample: "Customer says: I have called three times and no one fixed my bill.",
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
  recommendedAction: "Resolve in-call; supervisor only if customer requests cancellation",
};

const INDUSTRIES = [
  { icon: Stethoscope, name: "Healthcare", body: "Patient support, scheduling, claims." },
  { icon: Plug, name: "Utilities", body: "Outages, billing, service requests." },
  { icon: CreditCard, name: "Financial", body: "Payments, disputes, account help." },
  { icon: ShoppingBag, name: "Retail", body: "Orders, returns, loyalty programs." },
  { icon: Building2, name: "Enterprise", body: "BPO, back-office, escalations." },
  { icon: Globe, name: "Public Sector", body: "Bilingual citizen services." },
];

const STATS = [
  { value: "30+", label: "Years in business" },
  { value: "100%", label: "Bilingual agents" },
  { value: "24/7", label: "Coverage, 365 days" },
  { value: "Up to 45%", label: "Cost savings vs. U.S." },
];

const FEATURES = [
  {
    icon: Heart,
    title: "Human-first",
    body: "AI drafts the response. Your bilingual agent reviews, edits, and sends — every time.",
  },
  {
    icon: Languages,
    title: "Bilingual by design",
    body: "Every output generated in English and Spanish in a single pass — same tone, same intent.",
  },
  {
    icon: ShieldCheck,
    title: "Built for compliance",
    body: "Guardrails, redaction, audit logs, and human approval gates for regulated industries.",
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
  },
  {
    n: "02",
    title: "Centris AI Assist responds",
    body: "Best response, Spanish version, CRM notes, why it works, next steps, and risk flags.",
  },
  {
    n: "03",
    title: "Your agent stays in control",
    body: "Copy, edit, send, or escalate. Every customer-facing reply is human-approved.",
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
      "The client reports practically write themselves. We surface trends our customers actually care about — and we keep the human relationship in front.",
    name: "Priya Shah",
    role: "VP Client Success",
    company: "Northbridge Financial",
  },
];

function CentrisMark({ size = 32 }) {
  return (
    <span
      className="relative inline-block shrink-0"
      style={{ width: size, height: size }}
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{ border: `${Math.max(2, size / 12)}px solid #0017FF` }}
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

function CentrisLogo() {
  return (
    <a href="#" className="flex items-center gap-2.5">
      <CentrisMark size={32} />
      <span className="text-centris-deep font-extrabold tracking-tight text-xl">
        Centris
      </span>
    </a>
  );
}

function TopNav({ onTry }) {
  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-centris-deep/[0.06]">
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
            onClick={onTry}
            className="inline-flex items-center gap-1.5 rounded-full bg-centris-blue hover:bg-[#0014e0] text-white text-sm font-semibold px-4 py-2 shadow-soft transition"
          >
            Book a Demo
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}

function Hero({ onTry, onAssist }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-centris-mist">
      <div className="absolute inset-0 centris-grid-bg opacity-60 pointer-events-none" />
      <div className="absolute -top-32 -right-40 h-[520px] w-[520px] rounded-full bg-centris-blue/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-40 -left-40 h-[420px] w-[420px] rounded-full bg-centris-coral/10 blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-5 md:px-8 pt-16 md:pt-24 pb-20 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-centris-blue/20 bg-white px-3 py-1.5 text-xs font-semibold text-centris-blue shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Now live — Centris AI Assist
          </div>

          <h1 className="mt-6 text-[44px] md:text-[64px] xl:text-[72px] leading-[1.02] font-extrabold tracking-tight text-centris-deep">
            Humans
            <br />
            <span className="text-centris-blue">Powered by AI.</span>
          </h1>

          <p className="mt-5 text-lg md:text-xl text-centris-ink/75 leading-relaxed max-w-xl">
            Centris blends bilingual nearshore agents with real-time AI
            assistance — so every customer interaction is faster, smarter, and
            more empathetic.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={onAssist}
              className="inline-flex items-center gap-2 rounded-full bg-centris-blue hover:bg-[#0014e0] text-white text-sm font-semibold px-5 py-3 shadow-glow transition"
            >
              Try the assistant
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={onTry}
              className="inline-flex items-center gap-2 rounded-full bg-white border border-centris-deep/15 hover:border-centris-blue text-centris-deep text-sm font-semibold px-5 py-3 transition"
            >
              <Play className="h-4 w-4 text-centris-coral" />
              Book a 20-min demo
            </button>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
            {STATS.slice(0, 3).map((s) => (
              <div key={s.label}>
                <div className="text-2xl md:text-3xl font-extrabold text-centris-deep tracking-tight">
                  {s.value}
                </div>
                <div className="text-xs text-centris-muted mt-1">{s.label}</div>
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
          <HeroAssistantPreview />
        </motion.div>
      </div>
    </section>
  );
}

function HeroAssistantPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 bg-gradient-to-br from-centris-blue/15 via-centris-coral/10 to-transparent rounded-[40px] blur-2xl" />
      <div className="relative rounded-[28px] bg-white border border-centris-deep/8 shadow-glow overflow-hidden">
        <div className="bg-centris-deep px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CentrisMark size={22} />
            <span className="text-white font-bold text-sm tracking-tight">
              Centris AI Assist
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-300 font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 centris-pulse-ring" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Live
          </span>
        </div>
        <div className="p-5 space-y-4 bg-white">
          <div className="rounded-2xl bg-centris-mist border border-centris-deep/[0.06] p-4">
            <div className="text-[11px] font-semibold text-centris-blue uppercase tracking-wider mb-1.5">
              Customer said
            </div>
            <p className="text-sm text-centris-ink leading-relaxed">
              "I have called three times and no one fixed my bill."
            </p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-centris-blue to-[#3a4cff] text-white p-4 shadow-soft">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider opacity-80">
                Best thing to say
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-white/15 rounded-full px-2 py-0.5">
                <Star className="h-2.5 w-2.5 fill-white" />
                Recommended
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              I understand why you're frustrated, and I'm sorry you've had to
              call multiple times. I'm going to review your billing issue now
              and make sure you leave this call with a clear next step.
            </p>
          </div>
          <div className="rounded-2xl bg-white border border-centris-deep/[0.08] p-4">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-centris-coral uppercase tracking-wider mb-1.5">
              <Languages className="h-3 w-3" />
              Spanish version
            </div>
            <p className="text-sm text-centris-ink leading-relaxed">
              Entiendo por qué está frustrado, y lamento que haya tenido que
              llamar varias veces. Voy a revisar su problema de facturación
              ahora y asegurarme de que termine esta llamada con un próximo
              paso claro.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {["Empathy", "Ownership", "Next step"].map((t) => (
              <div
                key={t}
                className="rounded-xl bg-centris-mist text-centris-deep text-[11px] font-semibold px-3 py-2 text-center border border-centris-deep/[0.05]"
              >
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TrustBar() {
  return (
    <section className="border-y border-centris-deep/[0.06] bg-white py-8">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <div className="text-center text-[11px] tracking-[0.25em] font-bold text-centris-muted mb-6">
          TRUSTED BY LEADING SUPPORT TEAMS
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-80">
          {["Northbridge", "PivotalPay", "Brightlane", "Solvix", "Onestep", "Bluepeak"].map(
            (b) => (
              <span
                key={b}
                className="text-centris-deep/60 font-bold text-base tracking-tight"
              >
                {b}
              </span>
            )
          )}
        </div>
      </div>
    </section>
  );
}

function CopyChip({ text }) {
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
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-centris-blue hover:text-[#0014e0] transition"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" /> Copied
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" /> Copy
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
  const taRef = useRef(null);

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
        recommendedAction: data.recommendedAction || SEED.recommendedAction,
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

  return (
    <section
      id="assist"
      ref={assistRef}
      className="relative bg-centris-mist py-20 md:py-28 scroll-mt-24"
    >
      <div className="absolute inset-0 centris-grid-bg opacity-50 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-5 md:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-centris-blue/20 bg-white px-3 py-1.5 text-xs font-semibold text-centris-blue mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Try it live
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-centris-deep">
            The AI co-pilot for your{" "}
            <span className="text-centris-blue">call center.</span>
          </h2>
          <p className="mt-4 text-lg text-centris-ink/70">
            Type what the customer said. Get the best response, Spanish version,
            CRM notes, why it works, next steps, and escalation guidance — in
            seconds.
          </p>
        </div>

        <div className="rounded-[28px] bg-white border border-centris-deep/[0.08] shadow-glow overflow-hidden">
          {/* Header bar */}
          <div className="bg-centris-deep text-white px-5 md:px-7 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CentrisMark size={26} />
              <div>
                <div className="font-bold text-sm tracking-tight">
                  Centris AI Assist
                </div>
                <div className="text-[11px] text-white/60">
                  Get the best response instantly.
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 text-emerald-200 text-[11px] font-semibold px-2.5 py-1 border border-emerald-400/25">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Available
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 text-white/90 text-[11px] font-semibold px-2.5 py-1">
                <Globe className="h-3 w-3" /> EN / ES
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="grid grid-cols-12">
            {/* Sidebar */}
            <aside className="col-span-12 md:col-span-3 border-r border-centris-deep/[0.06] bg-white p-3 md:p-4">
              <div className="text-[10px] tracking-[0.2em] text-centris-muted font-bold uppercase mb-3 px-2">
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

              <div className="mt-5 rounded-xl bg-centris-mist border border-centris-deep/[0.05] p-3">
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
            <div className="col-span-12 md:col-span-9 p-5 md:p-7 bg-centris-mist/40">
              {/* Input */}
              <div className="rounded-2xl bg-white border border-centris-deep/[0.08] p-4 shadow-sm">
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
                <div className="mt-2 flex items-center justify-between">
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
                    className="inline-flex items-center gap-1.5 rounded-full bg-centris-blue hover:bg-[#0014e0] disabled:opacity-50 text-white text-xs font-bold px-4 py-2 shadow-soft transition"
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
                      <span className="text-[11px] font-bold uppercase tracking-wider opacity-90">
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
                      <button
                        onClick={() =>
                          navigator.clipboard?.writeText(result.bestResponse)
                        }
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 hover:text-white"
                      >
                        <Copy className="h-3 w-3" /> Copy response
                      </button>
                      <span className="text-[11px] text-white/70">
                        {result.riskLevel}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white border border-centris-deep/[0.08] p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-centris-coral inline-flex items-center gap-1.5">
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
                    <CopyChip text={result.spanishVersion} />
                  </div>
                </div>
              </div>

              {/* Why + Next + CRM */}
              <div className="mt-3.5 grid grid-cols-1 lg:grid-cols-3 gap-3.5">
                <div className="rounded-2xl bg-white border border-centris-deep/[0.08] p-5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-centris-deep inline-flex items-center gap-1.5 mb-3">
                    <Check className="h-3.5 w-3.5 text-centris-blue" />
                    Why this works
                  </div>
                  <ul className="space-y-2.5">
                    {(loading ? [0, 1, 2] : result.whyThisWorks.slice(0, 4)).map(
                      (item, idx) => (
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
                      )
                    )}
                  </ul>
                </div>

                <div className="rounded-2xl bg-white border border-centris-deep/[0.08] p-5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-centris-deep inline-flex items-center gap-1.5 mb-3">
                    <ClipboardCheck className="h-3.5 w-3.5 text-centris-blue" />
                    Next steps
                  </div>
                  <ol className="space-y-3">
                    {(loading ? [0, 1, 2] : result.nextSteps.slice(0, 4)).map(
                      (s, idx) => (
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
                      )
                    )}
                  </ol>
                </div>

                <div className="rounded-2xl bg-centris-deep text-white p-5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-white/60 inline-flex items-center gap-1.5 mb-3">
                    <Database className="h-3.5 w-3.5 text-centris-coral" />
                    CRM Notes
                  </div>
                  <p className="text-sm leading-relaxed min-h-[5rem] text-white/90">
                    {loading ? <Shimmer dark /> : result.crmNotes}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <button
                      onClick={() =>
                        navigator.clipboard?.writeText(result.crmNotes)
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 hover:text-white"
                    >
                      <Copy className="h-3 w-3" /> Copy notes
                    </button>
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

              {/* Recommended action + Escalate */}
              <div className="mt-3.5 rounded-2xl bg-white border border-centris-deep/[0.08] p-4 flex flex-col md:flex-row md:items-center gap-3 justify-between">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-centris-coral/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-4 w-4 text-centris-coral" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-centris-coral">
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
                  className={`inline-flex items-center gap-1.5 rounded-full text-xs font-bold px-4 py-2 transition ${
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

function FeaturesSection() {
  return (
    <section id="services" className="bg-white py-20 md:py-24">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <div className="max-w-2xl mb-12">
          <div className="text-xs font-bold tracking-[0.2em] text-centris-blue uppercase mb-3">
            What you get
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-centris-deep">
            Everything your support team needs —{" "}
            <span className="text-centris-coral">nothing they don't.</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group rounded-2xl border border-centris-deep/[0.08] bg-white hover:border-centris-blue/40 hover:shadow-soft p-6 transition"
              >
                <div className="h-11 w-11 rounded-xl bg-centris-mist border border-centris-deep/[0.06] flex items-center justify-center mb-4 group-hover:bg-centris-blue group-hover:border-centris-blue transition">
                  <Icon className="h-5 w-5 text-centris-blue group-hover:text-white transition" />
                </div>
                <h3 className="text-lg font-bold text-centris-deep">
                  {f.title}
                </h3>
                <p className="text-sm text-centris-ink/70 leading-relaxed mt-2">
                  {f.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="bg-centris-mist py-20 md:py-24">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs font-bold tracking-[0.2em] text-centris-blue uppercase mb-3">
            How it works
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-centris-deep">
            From customer message to{" "}
            <span className="text-centris-blue">confident reply.</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {HOW_STEPS.map((s, i) => (
            <div
              key={s.n}
              className="relative rounded-2xl bg-white border border-centris-deep/[0.08] p-6"
            >
              <div className="text-centris-blue text-xs font-bold tracking-[0.25em]">
                STEP {s.n}
              </div>
              <h3 className="mt-3 text-xl font-bold text-centris-deep">
                {s.title}
              </h3>
              <p className="mt-2 text-sm text-centris-ink/70 leading-relaxed">
                {s.body}
              </p>
              {i < HOW_STEPS.length - 1 && (
                <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 h-7 w-7 items-center justify-center rounded-full bg-white border border-centris-deep/10 text-centris-blue">
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function IndustriesSection() {
  return (
    <section id="industries" className="bg-white py-20 md:py-24">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="max-w-xl">
            <div className="text-xs font-bold tracking-[0.2em] text-centris-blue uppercase mb-3">
              Industries
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-centris-deep">
              Built for the work your customers depend on.
            </h2>
          </div>
          <p className="text-centris-ink/70 max-w-md">
            Centris partners with regulated, high-volume, and seasonal teams —
            bringing bilingual nearshore agents and AI assistance to every
            workflow.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {INDUSTRIES.map((i) => {
            const Icon = i.icon;
            return (
              <div
                key={i.name}
                className="group rounded-2xl border border-centris-deep/[0.08] bg-white hover:bg-centris-deep hover:border-centris-deep p-5 transition cursor-default"
              >
                <Icon className="h-5 w-5 text-centris-blue group-hover:text-centris-coral transition" />
                <div className="mt-3 font-bold text-centris-deep group-hover:text-white transition">
                  {i.name}
                </div>
                <div className="text-xs text-centris-ink/60 group-hover:text-white/70 mt-1 transition">
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
    <section className="bg-centris-deep text-white py-16">
      <div className="max-w-7xl mx-auto px-5 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
        {STATS.map((s) => (
          <div key={s.label}>
            <div className="text-4xl md:text-5xl font-extrabold tracking-tight">
              {s.value}
            </div>
            <div className="text-sm text-white/70 mt-2">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section id="why" className="bg-white py-20 md:py-24">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <div className="max-w-2xl mb-12">
          <div className="text-xs font-bold tracking-[0.2em] text-centris-blue uppercase mb-3">
            Why Centris
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-centris-deep">
            Loved by support leaders.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border border-centris-deep/[0.08] bg-centris-mist p-6 flex flex-col"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-3.5 w-3.5 text-centris-coral fill-centris-coral"
                  />
                ))}
              </div>
              <p className="text-centris-ink leading-relaxed flex-1">
                "{t.quote}"
              </p>
              <div className="mt-5 pt-5 border-t border-centris-deep/[0.08]">
                <div className="font-bold text-centris-deep text-sm">
                  {t.name}
                </div>
                <div className="text-xs text-centris-muted mt-0.5">
                  {t.role} · {t.company}
                </div>
              </div>
            </div>
          ))}
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
          <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-centris-coral/30 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="relative grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wider mb-5">
                <Sparkles className="h-3.5 w-3.5" /> Ready when you are
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
                Bring human-first, AI-powered support to every interaction.
              </h2>
              <p className="mt-4 text-white/85 max-w-xl">
                Book a 20-minute demo with our team. We'll show you the
                assistant running on your real workflows — bilingual agents
                included.
              </p>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <button
                onClick={onAssist}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-centris-deep font-bold text-sm px-6 py-3 hover:bg-centris-mist transition shadow-soft"
              >
                Try the assistant
                <ArrowRight className="h-4 w-4" />
              </button>
              <button className="inline-flex items-center justify-center gap-2 rounded-full bg-centris-coral hover:bg-[#e83843] text-white font-bold text-sm px-6 py-3 transition">
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
      title: "Services",
      links: [
        "Customer Service",
        "Sales & Lead Gen",
        "QA & Reporting",
        "Training",
        "Knowledge Base",
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
      links: ["Blog", "Case Studies", "AI Assist Docs", "Security", "Privacy"],
    },
  ];
  return (
    <footer id="about" className="bg-centris-deep text-white pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5">
              <CentrisMark size={32} />
              <span className="font-extrabold tracking-tight text-xl">
                Centris
              </span>
            </div>
            <p className="mt-4 text-white/70 text-sm max-w-xs leading-relaxed">
              Humans powered by AI. Bilingual, nearshore contact center
              solutions for U.S. brands — 30+ years of human-first support.
            </p>
            <div className="mt-5 space-y-2 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-centris-coral" /> Contact
                Sales
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
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <div>© {new Date().getFullYear()} Centris Information Services. All rights reserved.</div>
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
    <main>
      <TopNav onTry={scrollToAssist} />
      <Hero onTry={scrollToAssist} onAssist={scrollToAssist} />
      <TrustBar />
      <AssistantModule assistRef={assistRef} />
      <FeaturesSection />
      <HowItWorks />
      <IndustriesSection />
      <StatsBand />
      <Testimonials />
      <CTASection onAssist={scrollToAssist} />
      <Footer />
    </main>
  );
}

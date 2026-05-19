"use client";

import React, { useMemo, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ChevronDown,
  Bell,
  Globe,
  Copy,
  Send,
  CheckCircle2,
  Star,
  Zap,
  ShieldCheck,
  Activity,
  Home as HomeIcon,
  MessageSquareText,
  TrendingUp,
  Headphones,
  Receipt,
  AlertTriangle,
  Languages,
  ClipboardCheck,
  BarChart3,
  Bot,
  Loader2,
  ArrowUpRight,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV = ["Product", "Solutions", "Resources", "Pricing", "Company"];

const SIDEBAR_ITEMS = [
  { id: "home", label: "Home", icon: HomeIcon, mode: "agent" },
  { id: "what-to-say", label: "What to Say", icon: MessageSquareText, mode: "agent" },
  { id: "sales", label: "Sales Help", icon: TrendingUp, mode: "sales" },
  { id: "customer-service", label: "Customer Service", icon: Headphones, mode: "agent" },
  { id: "billing", label: "Billing", icon: Receipt, mode: "agent" },
  { id: "escalation", label: "Escalation", icon: AlertTriangle, mode: "agent" },
  { id: "spanish", label: "Spanish Help", icon: Languages, mode: "agent" },
  { id: "qa", label: "QA", icon: ClipboardCheck, mode: "qa" },
  { id: "reports", label: "Reports", icon: BarChart3, mode: "reporting" },
];

const QUICK_PROMPTS = [
  "Angry customer",
  "Billing issue",
  "Wants refund",
  "Schedule change",
  "Appointment setting",
];

const QUICK_PROMPT_TEXT = {
  "Angry customer":
    "Customer is angry and yelling about a service that didn't work. Give me the best calm response.",
  "Billing issue":
    "Customer says: I have called three times and no one fixed my bill.",
  "Wants refund":
    "Customer is asking for a refund on a charge from last month. Give me a fair, policy-safe response.",
  "Schedule change":
    "Customer needs to reschedule their appointment for next Tuesday. Confirm and give next steps.",
  "Appointment setting":
    "Set an appointment for a bilingual healthcare prospect interested in after-hours support.",
};

const TRUSTED = [
  "Northbridge\nFINANCIAL",
  "PivotalPay",
  "Brightlane",
  "SOLVIX",
  "onestep",
  "bluepeak",
];

const SEED = {
  bestResponse:
    "I understand why you're frustrated, and I'm sorry you've had to call multiple times. I'm going to review your billing issue now and make sure you leave this call with a clear next step.",
  spanishVersion:
    "Entiendo por qué está frustrado, y lamento que haya tenido que llamar varias veces. Voy a revisar su problema de facturación ahora y asegurarme de que termine esta llamada con un próximo paso claro.",
  whyThisWorks: ["Shows empathy", "Takes ownership", "Gives a clear next step"],
  nextSteps: [
    "Verify account details",
    "Check billing history",
    "Confirm follow-up time",
  ],
  crmNotes: "",
  riskLevel: "Low",
  recommendedAction: "Confirm resolution before ending call",
};

function CentrisLogo({ className = "" }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative h-8 w-8">
        <div className="absolute inset-0 rounded-full border-[3px] border-cyan-400" />
        <div className="absolute inset-[5px] rounded-full bg-cyan-400" />
        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#06131d] border-r-[#06131d] rotate-45" />
      </div>
      <span className="text-white font-semibold tracking-[0.18em] text-sm">
        CENTRIS
      </span>
    </div>
  );
}

function TopNav({ onTry, onDemo }) {
  return (
    <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-5">
      <CentrisLogo />
      <div className="hidden lg:flex items-center gap-8 text-slate-300 text-sm">
        {NAV.map((item) => (
          <button
            key={item}
            className="flex items-center gap-1 hover:text-white transition"
          >
            {item}
            {item !== "Pricing" && <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onTry}
          className="hidden md:inline text-slate-300 hover:text-white text-sm"
        >
          Log in
        </button>
        <button
          onClick={onDemo}
          className="rounded-xl border border-cyan-400/70 text-cyan-300 hover:bg-cyan-400/10 px-4 py-2 text-sm font-semibold transition"
        >
          Book a Demo
        </button>
      </div>
    </nav>
  );
}

function HeroLeft({ onTry, onDemo }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-xl"
    >
      <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/5 px-3 py-1.5 text-[11px] font-bold tracking-[0.18em] text-cyan-300 uppercase">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
        AI Assist for Customer Support
      </div>

      <h1 className="mt-6 text-5xl md:text-6xl xl:text-7xl font-semibold tracking-tight leading-[1.05] text-white">
        Human-first
        <br />
        support.
        <br />
        <span className="text-cyan-300">AI-accelerated</span>
        <br />
        <span className="text-cyan-300">responses.</span>
      </h1>

      <p className="mt-6 text-lg text-slate-300 leading-relaxed max-w-md">
        Centris AI Assist helps your team deliver faster, smarter, and more
        empathetic support—in every interaction.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button
          onClick={onDemo}
          className="rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 h-12 px-5 font-semibold"
        >
          Book a Demo <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button
          onClick={onTry}
          className="rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-white h-12 px-5 font-semibold backdrop-blur"
        >
          Try the Assistant <Sparkles className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-lg">
        <FeatureBullet
          icon={Zap}
          title="Respond instantly"
          body="Suggested replies in real time"
        />
        <FeatureBullet
          icon={ShieldCheck}
          title="Stay compliant"
          body="Built-in guardrails and policies"
        />
        <FeatureBullet
          icon={Activity}
          title="Drive performance"
          body="Insights that improve CSAT and efficiency"
        />
      </div>
    </motion.div>
  );
}

function FeatureBullet({ icon: Icon, title, body }) {
  return (
    <div>
      <div className="h-9 w-9 rounded-xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center mb-3">
        <Icon className="h-4 w-4 text-cyan-300" />
      </div>
      <div className="text-white font-semibold text-sm">{title}</div>
      <div className="text-slate-400 text-xs mt-1 leading-snug">{body}</div>
    </div>
  );
}

function BrowserChrome({ children }) {
  return (
    <div className="rounded-[28px] border border-cyan-400/20 bg-[#0a1a26] shadow-[0_30px_120px_-20px_rgba(34,211,238,0.35)] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#0a1a26]">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-amber-300" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <span className="opacity-50">{"<"}</span>
          <span className="opacity-50">{">"}</span>
        </div>
        <div className="flex-1 mx-2">
          <div className="mx-auto max-w-md flex items-center gap-2 rounded-md bg-[#06131d] border border-white/5 px-3 py-1.5 text-xs text-slate-400">
            <span className="text-emerald-400">●</span>
            app.centris.com/assist
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

function SidebarItem({ item, active, onClick }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
        active
          ? "bg-cyan-400/10 text-cyan-300 border border-cyan-400/30"
          : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="font-medium">{item.label}</span>
    </button>
  );
}

function ResponseCard({ title, icon: Icon, badge, body, onCopy }) {
  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-[#06131d]/80 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-cyan-300 text-xs font-semibold">
          <Icon className="h-3.5 w-3.5" />
          {title}
        </div>
        {badge && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-300">
            <Star className="h-3 w-3 fill-cyan-300" /> {badge}
          </span>
        )}
      </div>
      <p className="text-slate-200 text-sm leading-relaxed">{body}</p>
      <button
        onClick={onCopy}
        className="mt-3 inline-flex items-center gap-1.5 text-slate-400 hover:text-cyan-300 text-xs"
      >
        <Copy className="h-3 w-3" /> Copy
      </button>
    </div>
  );
}

function AssistantApp({ assistantRef }) {
  const [activeSidebar, setActiveSidebar] = useState("home");
  const [input, setInput] = useState(
    "I have called three times and no one fixed my bill."
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(SEED);
  const [copied, setCopied] = useState("");

  const activeItem = SIDEBAR_ITEMS.find((i) => i.id === activeSidebar);
  const mode = activeItem?.mode || "agent";
  const charCount = input.length;

  async function generate(customInput) {
    const text = (customInput ?? input).trim();
    if (!text || loading) return;
    setInput(text);
    setLoading(true);
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
        whyThisWorks: Array.isArray(data.whyThisWorks) && data.whyThisWorks.length
          ? data.whyThisWorks
          : SEED.whyThisWorks,
        nextSteps: Array.isArray(data.nextSteps) && data.nextSteps.length
          ? data.nextSteps
          : SEED.nextSteps,
        crmNotes: data.crmNotes || "",
        riskLevel: data.riskLevel || "Low",
        recommendedAction: data.recommendedAction || SEED.recommendedAction,
      });
    } catch (err) {
      setResult({
        ...SEED,
        bestResponse:
          "AI request failed: " +
          (err.message || "check OPENAI_API_KEY") +
          ". Showing example response.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function copyText(label, text) {
    try {
      await navigator.clipboard.writeText(text || "");
      setCopied(label);
      setTimeout(() => setCopied(""), 1200);
    } catch {}
  }

  return (
    <div ref={assistantRef} className="grid grid-cols-12 min-h-[640px]">
      <aside className="col-span-3 border-r border-white/5 bg-[#08161f] p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-6 px-2">
          <div className="relative h-6 w-6">
            <div className="absolute inset-0 rounded-full border-[2px] border-cyan-400" />
            <div className="absolute inset-1 rounded-full bg-cyan-400" />
          </div>
          <span className="text-white font-semibold tracking-[0.18em] text-xs">
            CENTRIS
          </span>
        </div>

        <div className="space-y-1 flex-1">
          {SIDEBAR_ITEMS.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              active={activeSidebar === item.id}
              onClick={() => setActiveSidebar(item.id)}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/5 border border-white/5 p-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-slate-950 font-bold text-sm">
            MM
          </div>
          <div className="flex-1">
            <div className="text-white text-xs font-semibold">María Martínez</div>
            <div className="text-slate-400 text-[10px]">Agent</div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-400 text-[10px]">Online</span>
            </div>
          </div>
          <ChevronDown className="h-3 w-3 text-slate-500" />
        </div>
      </aside>

      <section className="col-span-9 lg:col-span-6 p-5 flex flex-col gap-4 bg-[#06131d]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-cyan-300" />
            </div>
            <div>
              <div className="text-white font-semibold text-sm">
                Centris AI Assist
              </div>
              <div className="text-slate-400 text-xs">
                Get the best response instantly.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-300 text-[11px] px-2.5 py-1 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Available
            </span>
            <button className="inline-flex items-center gap-1 rounded-full border border-white/10 text-slate-300 text-[11px] px-2.5 py-1">
              <Globe className="h-3 w-3" /> EN <ChevronDown className="h-3 w-3" />
            </button>
            <button className="relative rounded-full border border-white/10 p-1.5 text-slate-300">
              <Bell className="h-3.5 w-3.5" />
              <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-cyan-400 text-slate-950 text-[9px] font-bold flex items-center justify-center">
                3
              </span>
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-400/20 bg-[#0a1a26] p-4">
          <div className="flex items-center gap-2 text-cyan-300 text-xs font-semibold mb-2">
            <MessageSquareText className="h-3.5 w-3.5" />
            What did the customer say?
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 500))}
            placeholder="Customer says: I have called three times..."
            rows={2}
            className="w-full bg-transparent border-none outline-none text-slate-100 text-sm resize-none placeholder:text-slate-500"
          />
          <div className="flex items-center justify-between mt-2">
            <button
              onClick={() => generate()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 disabled:opacity-60 text-slate-950 text-xs font-bold px-3 py-1.5 transition"
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Send className="h-3 w-3" />
              )}
              {loading ? "Generating" : "Generate"}
            </button>
            <span className="text-slate-500 text-[10px]">{charCount}/500</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ResponseCard
            title="Best thing to say"
            icon={MessageSquareText}
            badge="Recommended"
            body={result.bestResponse}
            onCopy={() => copyText("best", result.bestResponse)}
          />
          <ResponseCard
            title="Spanish version"
            icon={Globe}
            body={result.spanishVersion}
            onCopy={() => copyText("es", result.spanishVersion)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/5 bg-[#0a1a26] p-4">
            <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold mb-3">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Why this works
            </div>
            <ul className="space-y-2">
              {result.whyThisWorks.slice(0, 3).map((line) => (
                <li
                  key={line}
                  className="flex items-center gap-2 text-slate-200 text-xs"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-white/5 bg-[#0a1a26] p-4">
            <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold mb-3">
              <Zap className="h-3.5 w-3.5 text-cyan-300" /> Quick Prompts
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    const text = QUICK_PROMPT_TEXT[p];
                    setInput(text);
                    generate(text);
                  }}
                  className="rounded-full border border-white/10 bg-white/5 hover:bg-cyan-400/10 hover:border-cyan-400/40 hover:text-cyan-200 text-slate-300 text-[11px] px-3 py-1.5 transition"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {copied && (
          <div className="text-emerald-300 text-xs">Copied to clipboard.</div>
        )}
      </section>

      <aside className="hidden lg:flex col-span-3 border-l border-white/5 bg-[#08161f] p-4 flex-col gap-4">
        <div className="rounded-2xl border border-white/5 bg-[#0a1a26] p-4">
          <div className="flex items-center gap-2 text-cyan-300 text-xs font-semibold mb-3">
            <Zap className="h-3.5 w-3.5" /> Quick Actions
          </div>
          <div className="space-y-2">
            <ActionBtn
              icon={Copy}
              label="Copy Response"
              onClick={() => copyText("best", result.bestResponse)}
            />
            <ActionBtn icon={ArrowUpRight} label="Send to CRM" />
            <ActionBtn icon={AlertTriangle} label="Escalate" highlight />
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#0a1a26] p-4 flex-1">
          <div className="flex items-center gap-2 text-cyan-300 text-xs font-semibold mb-3">
            <Workflow className="h-3.5 w-3.5" /> Next Steps
          </div>
          <ol className="space-y-2.5">
            {result.nextSteps.slice(0, 3).map((step, idx) => (
              <li key={step} className="flex items-start gap-2.5 text-slate-200 text-xs">
                <span className="h-5 w-5 rounded-full bg-cyan-400/15 border border-cyan-400/30 text-cyan-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span className="leading-snug">{step}</span>
              </li>
            ))}
          </ol>
          <button className="mt-4 w-full rounded-xl bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 text-cyan-300 text-xs font-semibold py-2 transition">
            View Full Workflow
          </button>
        </div>
      </aside>
    </div>
  );
}

function ActionBtn({ icon: Icon, label, onClick, highlight }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition border ${
        highlight
          ? "bg-cyan-400/15 border-cyan-400/40 text-cyan-200 hover:bg-cyan-400/25"
          : "bg-white/5 border-white/5 text-slate-200 hover:bg-white/10"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function PhonePreview() {
  return (
    <div className="hidden xl:block absolute -right-10 bottom-0 translate-y-12 w-[230px] rounded-[36px] border border-white/10 bg-[#06131d] shadow-2xl overflow-hidden">
      <div className="h-6 flex items-center justify-center bg-[#0a1a26]">
        <div className="h-1 w-16 rounded-full bg-white/10" />
      </div>
      <div className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded-full bg-cyan-400" />
            <span className="text-white text-[10px] font-bold tracking-widest">
              CENTRIS
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-emerald-300 text-[9px]">
            <span className="h-1 w-1 rounded-full bg-emerald-400" /> Available
          </span>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-cyan-300 text-[10px] mb-1">
            <Sparkles className="h-2.5 w-2.5" /> Centris AI Assist
          </div>
          <div className="text-slate-400 text-[8px]">
            Get the best response instantly.
          </div>
        </div>
        <div className="rounded-lg border border-cyan-400/20 bg-[#0a1a26] p-2">
          <div className="text-cyan-300 text-[8px] font-semibold mb-1">
            What did the customer say?
          </div>
          <p className="text-slate-200 text-[9px] leading-snug">
            I have called three times and no one fixed my bill.
          </p>
        </div>
        <div className="rounded-lg border border-cyan-400/20 bg-[#0a1a26] p-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-cyan-300 text-[8px] font-semibold">
              Best thing to say
            </span>
            <Star className="h-2 w-2 text-cyan-300 fill-cyan-300" />
          </div>
          <p className="text-slate-200 text-[8.5px] leading-snug">
            I understand why you're frustrated, and I'm sorry you've had to call
            multiple times. I'm going to review your billing issue now and make
            sure you leave this call with a clear next step.
          </p>
        </div>
        <div className="rounded-lg border border-white/5 bg-[#0a1a26] p-2">
          <div className="text-cyan-300 text-[8px] font-semibold mb-1">
            Spanish version
          </div>
          <p className="text-slate-200 text-[8.5px] leading-snug">
            Entiendo por qué está frustrado, y lamento que haya tenido que llamar
            varias veces.
          </p>
        </div>
        <div className="flex justify-around pt-1 border-t border-white/5 text-[8px] text-slate-400">
          <span>Home</span>
          <span>What to Say</span>
          <span>Reports</span>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

function TrustedBy() {
  return (
    <div className="mt-20 pb-12">
      <div className="text-center text-slate-500 text-[11px] tracking-[0.25em] font-semibold mb-6">
        TRUSTED BY LEADING SUPPORT TEAMS
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 text-slate-400">
        {TRUSTED.map((name) => (
          <div key={name} className="text-sm font-semibold whitespace-pre-line text-center opacity-70 hover:opacity-100 transition">
            {name}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CentrisLandingPage() {
  const assistantRef = useRef(null);

  function scrollToAssistant() {
    assistantRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <main className="min-h-screen bg-[#06131d] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-cyan-500/20 blur-[140px]" />
        <div className="absolute top-1/3 right-0 h-[600px] w-[600px] rounded-full bg-cyan-400/10 blur-[160px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,.04)_1px,transparent_1px)] bg-[size:60px_60px] opacity-50" />
      </div>

      <div className="relative z-10">
        <TopNav onTry={scrollToAssistant} onDemo={scrollToAssistant} />

        <div className="px-6 md:px-12 pt-8 md:pt-16 pb-10 max-w-[1500px] mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,460px)_minmax(0,1fr)] gap-10 xl:gap-16 items-start">
            <HeroLeft onTry={scrollToAssistant} onDemo={scrollToAssistant} />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="relative"
            >
              <BrowserChrome>
                <AssistantApp assistantRef={assistantRef} />
              </BrowserChrome>
              <PhonePreview />
            </motion.div>
          </div>

          <TrustedBy />
        </div>
      </div>
    </main>
  );
}

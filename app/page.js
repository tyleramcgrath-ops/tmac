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
  Users,
  Database,
  Brain,
  Clock,
  Target,
  LineChart,
  Lock,
  Eye,
  Award,
  Plus,
  Minus,
  Mail,
  Twitter,
  Linkedin,
  Github,
  Wand2,
  PlayCircle,
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

const FEATURES = [
  {
    icon: MessageSquareText,
    title: "What to Say",
    body: "Real-time agent suggestions with empathy, ownership, and a clear next step in English and Spanish.",
    tag: "Agent Assist",
  },
  {
    icon: TrendingUp,
    title: "Sales Help",
    body: "Qualify leads, generate follow-ups, handle objections, and outline proposals tailored to each prospect.",
    tag: "Revenue",
  },
  {
    icon: ClipboardCheck,
    title: "QA Scoring",
    body: "Score every interaction for empathy, tone, accuracy, compliance, and surface coaching opportunities.",
    tag: "Quality",
  },
  {
    icon: BarChart3,
    title: "Client Reports",
    body: "Turn call drivers and sentiment into executive summaries and retention recommendations.",
    tag: "Reporting",
  },
  {
    icon: Users,
    title: "Training Coach",
    body: "Generate role-plays, onboarding modules, and weekly coaching plans — bilingual by default.",
    tag: "Training",
  },
  {
    icon: Database,
    title: "Knowledge Base",
    body: "Policy-safe responses, FAQs, agent scripts, and escalation guidance straight from your SOPs.",
    tag: "Consistency",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Paste what the customer said",
    body: "Type the message, log a call, or pull in a transcript. Works for chat, voice, and email.",
    icon: MessageSquareText,
  },
  {
    n: "02",
    title: "Centris AI Assist responds",
    body: "Best response, Spanish version, CRM notes, why it works, next steps, and risk flags — instantly.",
    icon: Wand2,
  },
  {
    n: "03",
    title: "Your agent stays in control",
    body: "Copy, edit, escalate, or send. Every output is reviewed by a human before it reaches the customer.",
    icon: ShieldCheck,
  },
];

const STATS = [
  { value: "38%", label: "Faster first response", icon: Zap },
  { value: "2.4x", label: "More qualified leads", icon: Target },
  { value: "+21", label: "CSAT points", icon: Award },
  { value: "92%", label: "Bilingual coverage", icon: Languages },
];

const TESTIMONIALS = [
  {
    quote:
      "Our bilingual agents close 40% faster. The Spanish suggestions are natural — not translated.",
    name: "Andrea Vargas",
    role: "Customer Success Director",
    company: "PivotalPay",
  },
  {
    quote:
      "QA scoring used to take a week. Centris AI Assist drafts the coaching notes in seconds and our supervisors finalize them.",
    name: "Marcus Lee",
    role: "Head of Operations",
    company: "Brightlane",
  },
  {
    quote:
      "The client reports practically write themselves. We surface trends our customers actually care about.",
    name: "Priya Shah",
    role: "VP Client Success",
    company: "Northbridge Financial",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: "$0",
    cadence: "/ free pilot",
    description: "For small teams that want to try AI-assisted support.",
    features: [
      "Up to 10 agents",
      "Agent Assist + Spanish",
      "Basic CRM notes",
      "Community support",
    ],
    cta: "Start free pilot",
    highlight: false,
  },
  {
    name: "Growth",
    price: "$29",
    cadence: "/ agent / month",
    description: "For scaling contact centers that need full bilingual support.",
    features: [
      "Unlimited agents",
      "Sales, QA, Reports modules",
      "Knowledge base ingestion",
      "Priority support",
      "Bilingual outputs",
    ],
    cta: "Talk to sales",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "",
    description: "For BPOs and regulated industries with custom guardrails.",
    features: [
      "Dedicated environment",
      "SOC 2 + HIPAA on request",
      "Custom integrations",
      "Bring-your-own model",
      "24/7 support",
    ],
    cta: "Contact us",
    highlight: false,
  },
];

const FAQS = [
  {
    q: "Will AI replace my agents?",
    a: "No. Centris is human-first. The AI drafts suggestions but every customer-facing response is reviewed and approved by a human agent.",
  },
  {
    q: "How does bilingual support work?",
    a: "Every output includes an English and Spanish version generated together — not translated after the fact — so the tone and intent match.",
  },
  {
    q: "What data does the AI see?",
    a: "Only the message or transcript you submit. We do not store private customer data in the demo, and production deployments support BYO key, regional hosting, and data retention controls.",
  },
  {
    q: "Can it connect to my CRM and helpdesk?",
    a: "Yes. We provide a JSON API, webhooks, and prebuilt integrations for Salesforce, HubSpot, Zendesk, Intercom, and Freshdesk.",
  },
  {
    q: "How quickly can we go live?",
    a: "Most teams launch the agent-assist workflow in under a week. Full QA and reporting workflows typically take 2-3 weeks including SOP ingestion.",
  },
];

function SectionHeader({ eyebrow, title, body }) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-12">
      {eyebrow && (
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/5 px-3 py-1 text-[10px] font-bold tracking-[0.22em] text-cyan-300 uppercase mb-4">
          <span className="h-1 w-1 rounded-full bg-cyan-400" />
          {eyebrow}
        </div>
      )}
      <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-white">
        {title}
      </h2>
      {body && (
        <p className="mt-4 text-slate-400 text-base md:text-lg leading-relaxed">
          {body}
        </p>
      )}
    </div>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="relative px-6 md:px-12 py-24 max-w-[1500px] mx-auto">
      <SectionHeader
        eyebrow="Product"
        title="Everything your support team needs"
        body="Six workflows. One assistant. Built for nearshore bilingual contact centers."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className="group relative rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] p-6 transition"
            >
              <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent opacity-0 group-hover:opacity-100 transition" />
              <div className="flex items-center justify-between mb-4">
                <div className="h-11 w-11 rounded-xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-cyan-300" />
                </div>
                <span className="text-[10px] tracking-[0.18em] font-bold text-cyan-300/70 uppercase">
                  {f.tag}
                </span>
              </div>
              <h3 className="text-white font-semibold text-lg">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mt-2">{f.body}</p>
              <div className="mt-5 inline-flex items-center gap-1 text-cyan-300 text-xs font-semibold opacity-0 group-hover:opacity-100 transition">
                Learn more <ArrowRight className="h-3 w-3" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section id="how" className="relative px-6 md:px-12 py-24 max-w-[1500px] mx-auto">
      <SectionHeader
        eyebrow="How it works"
        title="From customer message to confident reply"
        body="Three steps. Always with a human in the loop."
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-cyan-400/[0.04] to-transparent p-6"
            >
              <div className="text-cyan-300/70 text-xs font-bold tracking-[0.22em]">
                STEP {step.n}
              </div>
              <div className="mt-4 h-12 w-12 rounded-xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center">
                <Icon className="h-5 w-5 text-cyan-300" />
              </div>
              <h3 className="mt-4 text-white text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-slate-400 text-sm leading-relaxed">{step.body}</p>
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-cyan-400/40">
                  <ArrowRight className="h-5 w-5" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function BilingualSection() {
  return (
    <section className="relative px-6 md:px-12 py-24 max-w-[1500px] mx-auto">
      <div className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/[0.06] via-transparent to-transparent p-8 md:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/5 px-3 py-1 text-[10px] font-bold tracking-[0.22em] text-cyan-300 uppercase mb-4">
              <Languages className="h-3 w-3" /> Bilingual by default
            </div>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-white leading-tight">
              English and Spanish,
              <br />
              <span className="text-cyan-300">generated together.</span>
            </h2>
            <p className="mt-5 text-slate-400 text-base leading-relaxed max-w-md">
              Every response, CRM note, and script is produced in both
              languages in a single pass. The tone, empathy, and intent stay
              identical — no after-the-fact translation drift.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 max-w-md">
              <PillStat label="Native parity" value="EN ⇄ ES" />
              <PillStat label="Tone match" value="98%" />
              <PillStat label="Glossary aware" value="Yes" />
              <PillStat label="Latency" value="< 2s" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <BilingualCard
              lang="EN"
              flag="🇺🇸"
              body="I understand why you're frustrated, and I'm sorry you've had to call multiple times. I'm going to review your billing issue now and make sure you leave this call with a clear next step."
            />
            <BilingualCard
              lang="ES"
              flag="🇲🇽"
              body="Entiendo por qué está frustrado, y lamento que haya tenido que llamar varias veces. Voy a revisar su problema de facturación ahora y asegurarme de que termine esta llamada con un próximo paso claro."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function PillStat({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
      <div className="text-cyan-300 text-sm font-bold">{value}</div>
      <div className="text-slate-500 text-[10px] uppercase tracking-wider mt-0.5">
        {label}
      </div>
    </div>
  );
}

function BilingualCard({ lang, flag, body }) {
  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-[#0a1a26] p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-2 text-cyan-300 text-xs font-bold tracking-widest">
          <span className="text-base">{flag}</span> {lang}
        </span>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">
          Best response
        </span>
      </div>
      <p className="text-slate-200 text-sm leading-relaxed">{body}</p>
    </div>
  );
}

function StatsSection() {
  return (
    <section className="relative px-6 md:px-12 py-20 max-w-[1500px] mx-auto">
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 md:p-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="text-center md:text-left">
                <Icon className="h-5 w-5 text-cyan-300 mx-auto md:mx-0 mb-3" />
                <div className="text-4xl md:text-5xl font-semibold text-white tracking-tight">
                  {s.value}
                </div>
                <div className="text-slate-400 text-xs md:text-sm mt-2">
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SecuritySection() {
  return (
    <section className="relative px-6 md:px-12 py-24 max-w-[1500px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/5 px-3 py-1 text-[10px] font-bold tracking-[0.22em] text-cyan-300 uppercase mb-4">
            <ShieldCheck className="h-3 w-3" /> Built for regulated work
          </div>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-white leading-tight">
            Guardrails your
            <br />
            <span className="text-cyan-300">compliance team will love.</span>
          </h2>
          <p className="mt-5 text-slate-400 text-base leading-relaxed max-w-md">
            Human-in-the-loop by default. Configurable redaction, role-based
            access, region pinning, and audit logs for every AI output.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["SOC 2", "HIPAA on request", "GDPR", "PII redaction", "Audit logs"].map(
              (b) => (
                <span
                  key={b}
                  className="rounded-full border border-white/10 bg-white/[0.03] text-slate-300 text-xs px-3 py-1.5"
                >
                  {b}
                </span>
              )
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <SecurityCard
            icon={Lock}
            title="Private by design"
            body="No customer data used to train models. BYO key supported."
          />
          <SecurityCard
            icon={Eye}
            title="Full visibility"
            body="Every prompt and response is logged with timestamps and reviewer."
          />
          <SecurityCard
            icon={ShieldCheck}
            title="Human approval"
            body="Sensitive workflows require supervisor sign-off before sending."
          />
          <SecurityCard
            icon={Award}
            title="Quality assured"
            body="Built-in QA scoring with risk flags for compliance reviewers."
          />
        </div>
      </div>
    </section>
  );
}

function SecurityCard({ icon: Icon, title, body }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <Icon className="h-5 w-5 text-cyan-300 mb-3" />
      <div className="text-white font-semibold text-sm">{title}</div>
      <div className="text-slate-400 text-xs mt-2 leading-relaxed">{body}</div>
    </div>
  );
}

function TestimonialsSection() {
  return (
    <section className="relative px-6 md:px-12 py-24 max-w-[1500px] mx-auto">
      <SectionHeader
        eyebrow="Loved by support teams"
        title="What our customers say"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {TESTIMONIALS.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 flex flex-col"
          >
            <div className="flex gap-1 mb-4">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star
                  key={idx}
                  className="h-3.5 w-3.5 text-cyan-300 fill-cyan-300"
                />
              ))}
            </div>
            <p className="text-slate-200 text-sm leading-relaxed flex-1">
              “{t.quote}”
            </p>
            <div className="mt-5 pt-5 border-t border-white/5">
              <div className="text-white font-semibold text-sm">{t.name}</div>
              <div className="text-slate-500 text-xs mt-0.5">
                {t.role} · {t.company}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function PricingSection({ onCTA }) {
  return (
    <section id="pricing" className="relative px-6 md:px-12 py-24 max-w-[1500px] mx-auto">
      <SectionHeader
        eyebrow="Pricing"
        title="Simple plans. Real outcomes."
        body="Start free. Upgrade when your team is ready to scale."
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map((p) => (
          <div
            key={p.name}
            className={`relative rounded-3xl p-6 flex flex-col ${
              p.highlight
                ? "border-2 border-cyan-400/50 bg-gradient-to-b from-cyan-400/[0.08] to-cyan-400/[0.02] shadow-[0_20px_80px_-20px_rgba(34,211,238,0.4)]"
                : "border border-white/10 bg-white/[0.02]"
            }`}
          >
            {p.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-cyan-400 text-slate-950 text-[10px] font-bold tracking-widest px-3 py-1">
                MOST POPULAR
              </span>
            )}
            <div className="text-white font-semibold text-lg">{p.name}</div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-semibold text-white tracking-tight">
                {p.price}
              </span>
              <span className="text-slate-500 text-sm">{p.cadence}</span>
            </div>
            <p className="mt-3 text-slate-400 text-sm leading-relaxed">
              {p.description}
            </p>
            <ul className="mt-6 space-y-2.5 flex-1">
              {p.features.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2 text-slate-200 text-sm"
                >
                  <CheckCircle2 className="h-4 w-4 text-cyan-300 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={onCTA}
              className={`mt-6 rounded-xl h-11 font-semibold text-sm transition ${
                p.highlight
                  ? "bg-cyan-400 hover:bg-cyan-300 text-slate-950"
                  : "border border-white/15 bg-white/5 hover:bg-white/10 text-white"
              }`}
            >
              {p.cta}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function FAQItem({ q, a, open, onToggle }) {
  return (
    <div className="border-b border-white/10">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-white font-semibold text-sm md:text-base">{q}</span>
        <span className="shrink-0 h-7 w-7 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 flex items-center justify-center">
          {open ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
        </span>
      </button>
      {open && (
        <div className="pb-5 text-slate-400 text-sm leading-relaxed max-w-2xl">
          {a}
        </div>
      )}
    </div>
  );
}

function FAQSection() {
  const [openIdx, setOpenIdx] = useState(0);
  return (
    <section id="faq" className="relative px-6 md:px-12 py-24 max-w-[1100px] mx-auto">
      <SectionHeader eyebrow="FAQ" title="Frequently asked questions" />
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] px-6 md:px-10">
        {FAQS.map((f, i) => (
          <FAQItem
            key={f.q}
            q={f.q}
            a={f.a}
            open={openIdx === i}
            onToggle={() => setOpenIdx(openIdx === i ? -1 : i)}
          />
        ))}
      </div>
    </section>
  );
}

function FinalCTA({ onTry, onDemo }) {
  return (
    <section className="relative px-6 md:px-12 py-24 max-w-[1500px] mx-auto">
      <div className="relative overflow-hidden rounded-3xl border border-cyan-400/30 bg-gradient-to-br from-cyan-400/[0.12] via-cyan-400/[0.04] to-transparent p-10 md:p-16 text-center">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-cyan-400/30 blur-[120px]" />
        <div className="relative">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-white leading-tight">
            Ready to make support
            <br />
            <span className="text-cyan-300">faster, smarter, and human.</span>
          </h2>
          <p className="mt-5 text-slate-300 max-w-xl mx-auto">
            See Centris AI Assist in action with your own data. Pilots take a
            week and cost nothing.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              onClick={onDemo}
              className="rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 h-12 px-6 font-semibold"
            >
              Book a Demo <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              onClick={onTry}
              className="rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-white h-12 px-6 font-semibold"
            >
              <PlayCircle className="mr-2 h-4 w-4" /> Try it now
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    {
      title: "Product",
      links: ["What to Say", "Sales Help", "QA Scoring", "Client Reports", "Training", "Knowledge Base"],
    },
    {
      title: "Company",
      links: ["About", "Careers", "Customers", "Press", "Contact"],
    },
    {
      title: "Resources",
      links: ["Docs", "API", "Blog", "Changelog", "Status"],
    },
    {
      title: "Legal",
      links: ["Privacy", "Terms", "Security", "DPA", "SLA"],
    },
  ];
  return (
    <footer className="relative border-t border-white/5 mt-10">
      <div className="px-6 md:px-12 py-16 max-w-[1500px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          <div className="col-span-2">
            <CentrisLogo />
            <p className="mt-4 text-slate-400 text-sm leading-relaxed max-w-xs">
              Human-first, AI-accelerated support for nearshore bilingual
              contact centers.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[Twitter, Linkedin, Github, Mail].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="h-9 w-9 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] flex items-center justify-center text-slate-400 hover:text-cyan-300 transition"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <div className="text-white font-semibold text-xs tracking-widest uppercase mb-4">
                {c.title}
              </div>
              <ul className="space-y-2.5">
                {c.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-slate-400 hover:text-cyan-300 text-sm transition"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-slate-500 text-xs">
            © {new Date().getFullYear()} Centris Info. All rights reserved.
          </div>
          <div className="text-slate-500 text-xs">
            Made for bilingual support teams in nearshore Mexico.
          </div>
        </div>
      </div>
    </footer>
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

        <FeaturesSection />
        <HowItWorksSection />
        <BilingualSection />
        <StatsSection />
        <SecuritySection />
        <TestimonialsSection />
        <PricingSection onCTA={scrollToAssistant} />
        <FAQSection />
        <FinalCTA onTry={scrollToAssistant} onDemo={scrollToAssistant} />
        <Footer />
      </div>
    </main>
  );
}

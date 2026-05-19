"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Sparkles,
  BarChart3,
  Users,
  ClipboardCheck,
  FileText,
  Bot,
  Headphones,
  MessageSquareText,
  ShieldCheck,
  TrendingUp,
  Languages,
  Clock3,
  CheckCircle2,
  Target,
  LineChart,
  Mail,
  BriefcaseBusiness,
  Gauge,
  Brain,
  Download,
  Database,
  ChevronRight,
  BadgeCheck,
  Activity,
  Zap,
  Globe2,
  Copy,
  AlertTriangle,
  RefreshCcw,
  Loader2,
  Wand2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const tabs = [
  {
    id: "agent",
    label: "What to Say",
    short: "Best agent response",
    icon: Headphones,
  },
  {
    id: "sales",
    label: "Sales Help",
    short: "Close more deals",
    icon: TrendingUp,
  },
  {
    id: "qa",
    label: "QA Review",
    short: "Score interactions",
    icon: ClipboardCheck,
  },
  {
    id: "reporting",
    label: "Client Reports",
    short: "Show value",
    icon: BarChart3,
  },
  {
    id: "training",
    label: "Training Coach",
    short: "Coach agents",
    icon: Users,
  },
  {
    id: "knowledge",
    label: "Knowledge Base",
    short: "Policy-safe answers",
    icon: Database,
  },
];

const tabDetails = {
  agent: {
    headline: "What should I say?",
    subhead:
      "Type what the customer said. Get a calm response, Spanish version, CRM notes, and next steps.",
    accent: "Agent Assist",
    sampleInput:
      "Customer says: I have called three times and no one fixed my bill.",
  },
  sales: {
    headline: "AI Sales Assistant",
    subhead:
      "Qualify leads, create follow-ups, handle objections, and build proposal language.",
    accent: "Revenue Growth",
    sampleInput:
      "Qualify this lead: healthcare company, 8 agents, bilingual appointment setting, after-hours support, wants lower cost.",
  },
  qa: {
    headline: "AI Quality Review",
    subhead:
      "Score interactions for empathy, tone, accuracy, compliance, resolution, and coaching opportunities.",
    accent: "Quality Intelligence",
    sampleInput:
      "Score this call: the agent solved the issue but sounded rushed and did not confirm the customer understood the next step.",
  },
  reporting: {
    headline: "Client Report Builder",
    subhead:
      "Turn call trends into executive summaries, client insights, and retention recommendations.",
    accent: "Client Retention",
    sampleInput:
      "Create a monthly client report summary with top issues, customer sentiment, and recommendations.",
  },
  training: {
    headline: "AI Training Coach",
    subhead:
      "Create role-play scenarios, coaching notes, onboarding modules, and bilingual practice scripts.",
    accent: "Training",
    sampleInput:
      "Create a role-play scenario for a new bilingual agent handling an angry billing customer.",
  },
  knowledge: {
    headline: "Knowledge Base Assistant",
    subhead:
      "Create policy-safe responses, agent scripts, FAQs, escalation notes, and simple explanations.",
    accent: "Consistency",
    sampleInput:
      "Create a policy-safe response for a customer asking for a refund exception.",
  },
};

const quickPrompts = {
  agent: [
    "Customer says: I have called three times and no one fixed this. Give me the best thing to say.",
    "Customer is angry about a billing issue. Give me English and Spanish responses.",
    "Summarize this call into CRM notes, sentiment, next steps, and escalation status.",
    "Give me a script for transferring an upset caller to a supervisor.",
  ],
  sales: [
    "Qualify this lead: healthcare company, 8 agents, bilingual appointment setting, after-hours support, wants lower cost.",
    "Create a follow-up email for a logistics prospect comparing Centris to offshore support.",
    "Build a proposal outline for sales support, customer service, and AI QA reporting.",
    "Give me objection responses for price, outsourcing concerns, data privacy, and AI replacing humans.",
  ],
  qa: [
    "Score this interaction and identify the top 3 coaching opportunities.",
    "Find missed empathy, dead air, script gaps, compliance risks, and escalation issues.",
    "Create a supervisor coaching note that is firm but supportive.",
    "Analyze this account for recurring customer complaints and training gaps.",
  ],
  reporting: [
    "Create an executive summary for a monthly client report.",
    "Turn call drivers into client recommendations and process improvements.",
    "Summarize sentiment, top complaints, agent wins, and next-month priorities.",
    "Create a client-ready report showing how Centris improved support visibility.",
  ],
  training: [
    "Create a 10-minute training module on empathy statements and de-escalation.",
    "Build a role-play scenario for a billing complaint in English and Spanish.",
    "Create a new-agent onboarding checklist for bilingual customer support.",
    "Generate a weekly coaching plan for an agent struggling with call control.",
  ],
  knowledge: [
    "Create a client FAQ from repeated customer questions.",
    "Turn this SOP into a short agent script and a supervisor checklist.",
    "Explain this policy in simple English and Spanish for agents.",
    "Find the best answer for a refund request and flag when supervisor approval is needed.",
  ],
};

const metrics = [
  {
    label: "Respond Instantly",
    value: "Live",
    note: "Suggested replies in real time",
    icon: Zap,
  },
  {
    label: "Bilingual Ready",
    value: "EN/ES",
    note: "English and Spanish support",
    icon: Languages,
  },
  {
    label: "CRM Notes",
    value: "Auto",
    note: "Clean internal summaries",
    icon: FileText,
  },
  {
    label: "QA Support",
    value: "Smart",
    note: "Coaching and risk flags",
    icon: ClipboardCheck,
  },
];

const workflowCards = [
  {
    title: "Lead Qualification",
    icon: Target,
    description:
      "Scores prospects by company size, service need, urgency, bilingual requirements, and revenue potential.",
    items: ["Lead score", "Recommended offer", "Next step", "Sales email"],
  },
  {
    title: "Proposal Builder",
    icon: BriefcaseBusiness,
    description:
      "Creates custom sales proposals based on the prospect’s industry, current support model, and goals.",
    items: ["Scope", "AI layer", "Human layer", "Outcomes"],
  },
  {
    title: "Agent Copilot",
    icon: Headphones,
    description:
      "Supports live agents with scripts, bilingual phrasing, empathy language, and escalation guidance.",
    items: ["Suggested reply", "Spanish version", "CRM notes", "Follow-up"],
  },
  {
    title: "QA Scoring",
    icon: Gauge,
    description:
      "Reviews calls for empathy, accuracy, tone, resolution, compliance, and missed opportunities.",
    items: ["Score", "Risk flags", "Coaching notes", "Trends"],
  },
];

function detectIntent(text, currentTab) {
  const lower = text.toLowerCase();

  if (
    /proposal|lead|sales|follow-up|objection|prospect|close|email|price|outsourcing/.test(
      lower
    )
  ) {
    return "sales";
  }

  if (
    /qa|score|coaching|compliance|tone|empathy|risk|dead air|script gap/.test(
      lower
    )
  ) {
    return "qa";
  }

  if (
    /report|monthly|executive summary|client|sentiment|recommendation|top complaints/.test(
      lower
    )
  ) {
    return "reporting";
  }

  if (/training|role-play|onboarding|coach|module|practice/.test(lower)) {
    return "training";
  }

  if (/policy|knowledge|sop|faq|refund exception|answer/.test(lower)) {
    return "knowledge";
  }

  if (
    /agent|customer says|angry|billing|spanish|crm|call note|supervisor|customer/.test(
      lower
    )
  ) {
    return "agent";
  }

  return currentTab;
}

function createResponseFromAI(data, mode) {
  return {
    title: data.title || "Centris AI Assist Response",
    mode: data.mode || mode,
    score: data.score || data.qaScore || data.leadScore || "Generated",
    next: data.recommendedAction || "Review and use the best parts",
    sections: [
      {
        label: "Best Thing to Say",
        value: "Recommended response",
        body:
          data.bestResponse ||
          "No direct response was generated. Try adding more context.",
      },
      {
        label: "Spanish Version",
        value: "Bilingual support",
        body:
          data.spanishVersion ||
          "Spanish version was not required for this request.",
      },
      {
        label: "CRM Notes",
        value: "Ready for internal records",
        body: data.crmNotes || "No CRM notes generated.",
      },
      {
        label: "Why This Works",
        value: data.riskLevel || "Reasoning",
        body: Array.isArray(data.whyThisWorks)
          ? data.whyThisWorks.join(" • ")
          : "This response is designed to be clear, calm, and useful.",
      },
      {
        label: "Next Steps",
        value: "Recommended workflow",
        body: Array.isArray(data.nextSteps)
          ? data.nextSteps.join(" • ")
          : "Review, copy, and escalate if needed.",
      },
      {
        label: "Coaching / Client Insight",
        value: data.qaScore || data.leadScore || "Useful insight",
        body:
          data.coachingNote ||
          data.clientSummary ||
          data.recommendedAction ||
          "Use this output to support the next action.",
      },
    ],
  };
}

const fallbackResponse = {
  title: "Welcome to Centris AI Assist",
  mode: "agent",
  score: "Ready",
  next: "Type a customer message or choose a quick prompt",
  sections: [
    {
      label: "What This Does",
      value: "Turns messy situations into clear words",
      body:
        "Type what the customer said. The assistant creates the best thing to say, Spanish version, CRM notes, why it works, and next steps.",
    },
    {
      label: "Best Use Case",
      value: "Customer support and bilingual agents",
      body:
        "This is designed to help agents respond with empathy, ownership, and a clear next step.",
    },
    {
      label: "Sales Use Case",
      value: "Lead qualification and follow-ups",
      body:
        "Sales can use it to qualify prospects, write follow-up emails, create proposal outlines, and explain Centris’ AI-human advantage.",
    },
    {
      label: "Supervisor Use Case",
      value: "QA and training",
      body:
        "Supervisors can use it to score calls, create coaching notes, identify risk, and build training scenarios.",
    },
  ],
};

function AssistantMessage({ children }) {
  return (
    <div className="flex gap-3">
      <div className="h-10 w-10 rounded-2xl bg-cyan-100 flex items-center justify-center shrink-0 border border-cyan-200">
        <Bot className="h-5 w-5 text-cyan-700" />
      </div>
      <div className="rounded-3xl bg-white border border-slate-200 shadow-sm px-5 py-4 text-sm leading-relaxed text-slate-700 max-w-4xl w-full">
        {children}
      </div>
    </div>
  );
}

function UserMessage({ children }) {
  return (
    <div className="flex justify-end">
      <div className="rounded-3xl bg-slate-950 text-white px-5 py-4 text-sm max-w-3xl shadow-sm">
        {children}
      </div>
    </div>
  );
}

function StructuredResponse({ response }) {
  const main = response.sections?.[0];
  const spanish = response.sections?.[1];
  const crm = response.sections?.[2];
  const why = response.sections?.[3];
  const next = response.sections?.[4];
  const coaching = response.sections?.[5];

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-700 font-bold mb-1">
            Generated Output
          </div>
          <h4 className="text-xl font-semibold text-slate-950">
            {response.title}
          </h4>
        </div>
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-emerald-800 text-xs font-semibold inline-flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" /> {response.score}
        </div>
      </div>

      {main && (
        <div className="rounded-3xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-cyan-700 font-bold">
                {main.label}
              </div>
              <div className="font-semibold text-slate-950 mt-1">
                {main.value}
              </div>
            </div>
            <span className="rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200 px-3 py-1 text-xs font-bold">
              Recommended
            </span>
          </div>
          <p className="text-lg md:text-xl text-slate-800 leading-relaxed font-medium">
            {main.body}
          </p>
          <CopyButton text={main.body} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[spanish, crm, why, next, coaching].filter(Boolean).map((section) => (
          <div
            key={section.label}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="text-xs uppercase tracking-wide text-slate-500 font-bold">
              {section.label}
            </div>
            <div className="font-semibold text-slate-950 mt-1">
              {section.value}
            </div>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              {section.body}
            </p>
            {(section.label === "Spanish Version" ||
              section.label === "CRM Notes") && <CopyButton text={section.body} />}
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-cyan-950 text-white p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="text-xs text-cyan-200 uppercase tracking-wide font-bold">
            Recommended Next Step
          </div>
          <div className="font-semibold mt-1">{response.next}</div>
        </div>
        <Button
          onClick={() => downloadOutput(response)}
          className="rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold"
        >
          <Download className="h-4 w-4 mr-2" /> Export Output
        </Button>
      </div>
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  async function copyText() {
    try {
      await navigator.clipboard.writeText(text || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      onClick={copyText}
      className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-cyan-700 hover:text-cyan-900"
    >
      <Copy className="h-3.5 w-3.5" />
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function downloadOutput(response) {
  const lines = [
    response.title,
    "",
    `Score: ${response.score}`,
    "",
    ...(response.sections || []).flatMap((section) => [
      section.label,
      section.value,
      section.body,
      "",
    ]),
    "Recommended Next Step",
    response.next,
  ];

  const blob = new Blob([lines.join("\n")], {
    type: "text/plain;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "centris-ai-assist-output.txt";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function ProgressBar({ label, value }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className="text-slate-900 font-semibold">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-cyan-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export default function CentrisAIAssistPage() {
  const [activeTab, setActiveTab] = useState("agent");
  const [input, setInput] = useState("");
  const [leadVolume, setLeadVolume] = useState(42);
  const [agentCount, setAgentCount] = useState(18);
  const [avgCost, setAvgCost] = useState(2800);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      response: fallbackResponse,
    },
  ]);

  const ActiveIcon = tabs.find((tab) => tab.id === activeTab)?.icon || Sparkles;
  const activeDetail = tabDetails[activeTab];

  const estimatedMonthlySavings = Math.round(agentCount * avgCost * 0.18);
  const estimatedAnnualSavings = estimatedMonthlySavings * 12;
  const projectedQualifiedLeads = Math.round(leadVolume * 0.38);

  const placeholder = useMemo(() => activeDetail.sampleInput, [activeDetail]);

  async function handleSend(text = input) {
    if (!text.trim() || loading) return;

    const userText = text.trim();
    const detectedMode = detectIntent(userText, activeTab);

    setActiveTab(detectedMode);
    setInput("");
    setLoading(true);

    setMessages((prev) => [
      ...prev,
      { role: "user", text: userText },
      {
        role: "assistant",
        response: {
          title: "Generating response...",
          mode: detectedMode,
          score: "Working",
          next: "Creating the best response now",
          sections: [
            {
              label: "Status",
              value: "Processing",
              body:
                "Centris AI Assist is reviewing the prompt and preparing a clear, usable response.",
            },
          ],
        },
      },
    ]);

    try {
      const res = await fetch("/api/assist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userText,
          mode: detectedMode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "AI request failed.");
      }

      const liveResponse = createResponseFromAI(data, detectedMode);

      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", response: liveResponse },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          response: {
            title: "AI Connection Error",
            mode: detectedMode,
            score: "Needs setup",
            next: "Check OPENAI_API_KEY and app/api/assist/route.js",
            sections: [
              {
                label: "Issue",
                value: "The live AI request failed",
                body:
                  error.message ||
                  "The app could not connect to the AI backend route.",
              },
              {
                label: "Fix",
                value: "Add your API key",
                body:
                  "Create .env.local with OPENAI_API_KEY=your_key_here, then restart the dev server. On Vercel, add OPENAI_API_KEY in Project Settings > Environment Variables and redeploy.",
              },
            ],
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#06131d] text-slate-900 p-4 md:p-8 relative overflow-hidden">
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top_left,#23c7d9_0,transparent_35%),radial-gradient(circle_at_75%_10%,#2dd4bf_0,transparent_25%),radial-gradient(circle_at_bottom_right,#0f766e_0,transparent_35%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] bg-[size:44px_44px]" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="rounded-[2rem] bg-white/10 border border-white/15 backdrop-blur-2xl p-5 md:p-8 shadow-2xl">
            <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-cyan-400/15 border border-cyan-300/30 text-cyan-100 px-4 py-2 text-sm mb-4">
                  <Sparkles className="h-4 w-4" /> Centris Info AI Assistant
                </div>
                <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-white">
                  Human-first support.
                  <span className="block text-cyan-300">
                    AI-accelerated responses.
                  </span>
                </h1>
                <p className="text-slate-300 mt-4 max-w-3xl text-base md:text-xl leading-relaxed">
                  Type what the customer said. Get the best response, Spanish
                  version, CRM notes, next steps, and supervisor guidance in
                  seconds.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full xl:w-auto">
                {metrics.map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <Card
                      key={metric.label}
                      className="bg-white/10 border-white/15 backdrop-blur-xl rounded-3xl overflow-hidden"
                    >
                      <CardContent className="p-4">
                        <Icon className="h-5 w-5 text-cyan-200 mb-2" />
                        <div className="text-2xl font-semibold text-white">
                          {metric.value}
                        </div>
                        <div className="text-xs text-cyan-100 font-medium mt-1">
                          {metric.label}
                        </div>
                        <div className="text-[11px] text-slate-300 mt-1">
                          {metric.note}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
          <Card className="rounded-[2rem] bg-white/95 shadow-2xl border-0 overflow-hidden h-fit">
            <CardContent className="p-4">
              <div className="rounded-3xl bg-slate-950 text-white p-5 mb-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-transparent" />
                <div className="relative flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <Bot className="h-7 w-7 text-slate-950" />
                  </div>
                  <div>
                    <div className="font-semibold">Centris AI Assist</div>
                    <div className="text-xs text-slate-300">
                      Sales + Agents + QA
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                        activeTab === tab.id
                          ? "bg-cyan-50 text-cyan-900 border border-cyan-200 shadow-sm"
                          : "hover:bg-slate-100 text-slate-700 border border-transparent"
                      }`}
                    >
                      <div
                        className={`h-10 w-10 rounded-2xl flex items-center justify-center ${
                          activeTab === tab.id ? "bg-cyan-100" : "bg-slate-100"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{tab.label}</div>
                        <div className="text-xs opacity-70">{tab.short}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 rounded-3xl bg-slate-50 border border-slate-200 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
                  <ShieldCheck className="h-4 w-4 text-cyan-700" /> AI Guardrails
                </div>
                <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                  <div className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    Human approval for sensitive decisions
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    Do not enter private customer data
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    AI supports agents, not replaces them
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
            <Card className="rounded-[2rem] bg-slate-50 shadow-2xl border-0 overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-white border-b border-slate-200 p-5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-3xl bg-cyan-100 flex items-center justify-center border border-cyan-200">
                        <ActiveIcon className="h-7 w-7 text-cyan-800" />
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-cyan-700 font-bold">
                          {activeDetail.accent}
                        </div>
                        <div className="text-xl font-semibold text-slate-950">
                          {activeDetail.headline}
                        </div>
                        <div className="text-sm text-slate-500 max-w-2xl">
                          {activeDetail.subhead}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-semibold">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Live AI
                    </div>
                  </div>
                </div>

                <div className="h-[640px] overflow-y-auto p-5 space-y-5 bg-gradient-to-b from-slate-50 to-white custom-scrollbar">
                  {messages.map((message, index) =>
                    message.role === "assistant" ? (
                      <AssistantMessage key={index}>
                        <StructuredResponse response={message.response} />
                      </AssistantMessage>
                    ) : (
                      <UserMessage key={index}>{message.text}</UserMessage>
                    )
                  )}
                </div>

                <div className="border-t border-slate-200 bg-white p-4">
                  <div className="flex flex-col md:flex-row gap-2">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSend();
                      }}
                      placeholder={placeholder}
                      className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <Button
                      onClick={() => handleSend()}
                      disabled={loading}
                      className="rounded-2xl bg-slate-950 hover:bg-slate-800 px-5 h-12 text-white"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      {loading ? "Generating" : "Generate"}
                    </Button>
                  </div>
                  <div className="mt-2 flex items-start gap-2 text-xs text-slate-500">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
                    Do not enter private customer data, payment details, medical
                    details, or sensitive account information into this demo.
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-5">
              <Card className="rounded-[2rem] bg-white/95 shadow-2xl border-0">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquareText className="h-5 w-5 text-cyan-700" />
                    <h3 className="font-semibold text-slate-950">
                      Easy Quick Prompts
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {quickPrompts[activeTab].map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => handleSend(prompt)}
                        disabled={loading}
                        className="group w-full text-left rounded-2xl border border-slate-200 bg-slate-50 hover:bg-cyan-50 hover:border-cyan-200 px-4 py-3 text-sm text-slate-700 transition disabled:opacity-60"
                      >
                        <div className="flex items-start gap-2">
                          <ChevronRight className="h-4 w-4 mt-0.5 text-cyan-700 opacity-0 group-hover:opacity-100 transition" />
                          <span>{prompt}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] bg-white/95 shadow-2xl border-0">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <CalculatorIcon />
                    <h3 className="font-semibold text-slate-950">
                      AI ROI Snapshot
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <label className="block">
                      <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                        <span>Monthly Leads</span>
                        <span>{leadVolume}</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="150"
                        value={leadVolume}
                        onChange={(e) => setLeadVolume(Number(e.target.value))}
                        className="w-full"
                      />
                    </label>

                    <label className="block">
                      <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                        <span>Agents Supported</span>
                        <span>{agentCount}</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="100"
                        value={agentCount}
                        onChange={(e) => setAgentCount(Number(e.target.value))}
                        className="w-full"
                      />
                    </label>

                    <label className="block">
                      <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                        <span>Avg. Monthly Cost / Agent</span>
                        <span>${avgCost.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min="1200"
                        max="6500"
                        step="100"
                        value={avgCost}
                        onChange={(e) => setAvgCost(Number(e.target.value))}
                        className="w-full"
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-cyan-50 border border-cyan-200 p-3">
                        <div className="text-xs text-cyan-700 font-bold uppercase">
                          Qualified Leads
                        </div>
                        <div className="text-2xl font-semibold text-cyan-950">
                          {projectedQualifiedLeads}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3">
                        <div className="text-xs text-emerald-700 font-bold uppercase">
                          Annual Efficiency
                        </div>
                        <div className="text-2xl font-semibold text-emerald-950">
                          ${estimatedAnnualSavings.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      Prototype estimate showing how AI-assisted qualification,
                      summaries, QA, and reporting can create measurable
                      operational leverage.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] bg-white/95 shadow-2xl border-0">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="h-5 w-5 text-cyan-700" />
                    <h3 className="font-semibold text-slate-950">
                      Live Intelligence
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <ProgressBar label="Lead Fit" value={92} />
                    <ProgressBar label="Customer Sentiment" value={78} />
                    <ProgressBar label="QA Confidence" value={86} />
                    <ProgressBar label="Client Retention Value" value={89} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {workflowCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card
                key={card.title}
                className="rounded-[2rem] bg-white/10 border-white/15 text-white backdrop-blur-xl overflow-hidden hover:bg-white/15 transition"
              >
                <CardContent className="p-5">
                  <div className="h-12 w-12 rounded-2xl bg-cyan-400/15 border border-cyan-300/20 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-cyan-200" />
                  </div>
                  <h3 className="font-semibold mb-2">{card.title}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed mb-4">
                    {card.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {card.items.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-white/10 border border-white/10 text-xs text-cyan-100 px-3 py-1"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card className="rounded-[2rem] bg-white/95 shadow-2xl border-0 lg:col-span-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <Brain className="h-5 w-5 text-cyan-700" />
                <h3 className="text-lg font-semibold text-slate-950">
                  Why This Works for Centris
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ValueCard
                  icon={Globe2}
                  title="Shows AI-human differentiation"
                  body="Prospects can see that Centris is more advanced than a traditional call center."
                />
                <ValueCard
                  icon={Languages}
                  title="Highlights bilingual support"
                  body="English and Spanish outputs make the nearshore Mexico advantage visual and easy to understand."
                />
                <ValueCard
                  icon={LineChart}
                  title="Makes value measurable"
                  body="ROI, lead scoring, QA scores, and reporting make the service easier to sell."
                />
                <ValueCard
                  icon={BadgeCheck}
                  title="Builds trust with guardrails"
                  body="Human approval and data-safe workflows show that AI is being used responsibly."
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] bg-cyan-400 text-slate-950 shadow-2xl border-0 overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,.55),transparent_40%)]" />
            <CardContent className="p-6 relative">
              <Zap className="h-8 w-8 mb-4" />
              <h3 className="text-2xl font-semibold tracking-tight">
                Website CTA Concept
              </h3>
              <p className="text-sm mt-3 leading-relaxed text-slate-800">
                Let prospects try the AI-human support model before they book a
                call. The assistant can qualify them, show sample outputs, and
                recommend the best Centris solution.
              </p>
              <Button className="mt-5 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white w-full h-12">
                <Mail className="h-4 w-4 mr-2" /> Request AI Support Demo
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function ValueCard({ icon: Icon, title, body }) {
  return (
    <div className="rounded-3xl bg-slate-50 border border-slate-200 p-4">
      <Icon className="h-5 w-5 text-cyan-700 mb-2" />
      <div className="font-semibold">{title}</div>
      <p className="text-sm text-slate-600 mt-1">{body}</p>
    </div>
  );
}

function CalculatorIcon() {
  return (
    <div className="h-5 w-5 rounded-md bg-cyan-100 flex items-center justify-center">
      <BarChart3 className="h-4 w-4 text-cyan-700" />
    </div>
  );
}

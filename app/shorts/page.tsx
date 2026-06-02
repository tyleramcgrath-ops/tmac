"use client";

import { useState } from "react";

const TONES = [
  "Educational + Surprising",
  "Motivational + High Energy",
  "Dark / Counterintuitive",
  "Funny + Relatable",
  "Luxury / Aspirational",
  "Scary but True",
];

const DURATIONS = [
  { label: "15s", value: 15 },
  { label: "30s", value: 30 },
  { label: "45s", value: 45 },
  { label: "60s", value: 60 },
];

interface ShortData {
  title: string;
  subtitle?: string;
  accentColor: string;
  gradientColors: [string, string, string];
  items: { emoji: string; heading: string; body: string }[];
  voiceover: string[];
  description: string;
  hashtags: string[];
  hook: string;
  callToAction: string;
}

export default function ShortsPage() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState(TONES[0]);
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ShortData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function generate() {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch("/api/shorts/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic, tone, durationSeconds: duration }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Unknown error");
      setData(json.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function downloadJson() {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `short-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
        color: "#fff",
        fontFamily: "'Inter', sans-serif",
        padding: "48px 24px",
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 48, textAlign: "center" }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.2em",
              color: "#FF6B35",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            YouTube Shorts Generator
          </div>
          <h1
            style={{
              fontSize: 48,
              fontWeight: 900,
              lineHeight: 1.1,
              margin: 0,
              background: "linear-gradient(90deg, #fff, #FF6B35)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Go Viral in 60 Seconds
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.55)",
              marginTop: 16,
              fontSize: 18,
            }}
          >
            Describe your topic. Claude writes the script, hook, voiceover, and
            description. Download & render.
          </p>
        </div>

        {/* Form */}
        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            borderRadius: 24,
            padding: 36,
            border: "1px solid rgba(255,255,255,0.1)",
            marginBottom: 36,
          }}
        >
          {/* Topic */}
          <label style={{ display: "block", marginBottom: 24 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.5)",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Topic / Idea
            </div>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generate()}
              placeholder="e.g. 3 foods that destroy your gut health"
              style={{
                width: "100%",
                background: "rgba(0,0,0,0.35)",
                border: "1.5px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                padding: "16px 20px",
                color: "#fff",
                fontSize: 18,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </label>

          {/* Tone */}
          <label style={{ display: "block", marginBottom: 24 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.5)",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Tone
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {TONES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 100,
                    border:
                      tone === t
                        ? "2px solid #FF6B35"
                        : "1.5px solid rgba(255,255,255,0.15)",
                    background:
                      tone === t ? "rgba(255,107,53,0.18)" : "transparent",
                    color: tone === t ? "#FF6B35" : "rgba(255,255,255,0.65)",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </label>

          {/* Duration */}
          <label style={{ display: "block", marginBottom: 32 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.5)",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Duration
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {DURATIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDuration(d.value)}
                  style={{
                    flex: 1,
                    padding: "14px 0",
                    borderRadius: 12,
                    border:
                      duration === d.value
                        ? "2px solid #FF6B35"
                        : "1.5px solid rgba(255,255,255,0.15)",
                    background:
                      duration === d.value
                        ? "rgba(255,107,53,0.18)"
                        : "transparent",
                    color:
                      duration === d.value
                        ? "#FF6B35"
                        : "rgba(255,255,255,0.65)",
                    fontSize: 18,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </label>

          {/* CTA */}
          <button
            onClick={generate}
            disabled={loading || !topic.trim()}
            style={{
              width: "100%",
              padding: "20px 0",
              borderRadius: 16,
              border: "none",
              background: loading
                ? "rgba(255,107,53,0.4)"
                : "linear-gradient(90deg, #FF6B35, #ff9a3c)",
              color: "#fff",
              fontSize: 20,
              fontWeight: 800,
              cursor: loading || !topic.trim() ? "not-allowed" : "pointer",
              letterSpacing: "0.02em",
              transition: "opacity 0.15s",
            }}
          >
            {loading ? "Generating your viral short…" : "Generate Short ⚡"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: "rgba(255,50,50,0.15)",
              border: "1px solid rgba(255,80,80,0.3)",
              borderRadius: 16,
              padding: 24,
              color: "#ff8080",
              marginBottom: 36,
            }}
          >
            {error}
          </div>
        )}

        {/* Result */}
        {data && (
          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              borderRadius: 24,
              border: "1px solid rgba(255,255,255,0.1)",
              overflow: "hidden",
            }}
          >
            {/* Title strip */}
            <div
              style={{
                background: data.accentColor + "22",
                borderBottom: `1px solid ${data.accentColor}44`,
                padding: "28px 36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <div>
                {data.subtitle && (
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: "0.2em",
                      color: data.accentColor,
                      textTransform: "uppercase",
                      marginBottom: 6,
                    }}
                  >
                    {data.subtitle}
                  </div>
                )}
                <h2
                  style={{
                    margin: 0,
                    fontSize: 32,
                    fontWeight: 900,
                    lineHeight: 1.1,
                  }}
                >
                  {data.title.replace("\\n", " ")}
                </h2>
              </div>
              <button
                onClick={downloadJson}
                style={{
                  padding: "12px 24px",
                  borderRadius: 12,
                  border: `2px solid ${data.accentColor}`,
                  background: "transparent",
                  color: data.accentColor,
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: "pointer",
                }}
              >
                Download data.json ↓
              </button>
            </div>

            <div style={{ padding: 36 }}>
              {/* Hook */}
              <Section label="Hook / Opening Caption">
                <CopyBox
                  text={data.hook}
                  copyKey="hook"
                  copied={copied}
                  onCopy={copy}
                  accent={data.accentColor}
                />
              </Section>

              {/* Items */}
              <Section label="List Items">
                {data.items.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 16,
                      padding: "16px 20px",
                      background: "rgba(0,0,0,0.25)",
                      borderRadius: 12,
                      marginBottom: 10,
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <div
                      style={{
                        minWidth: 44,
                        height: 44,
                        borderRadius: "50%",
                        background: data.accentColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 22,
                        fontWeight: 900,
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 18 }}>
                        {item.emoji} {item.heading}
                      </div>
                      <div
                        style={{
                          color: "rgba(255,255,255,0.65)",
                          fontSize: 15,
                          marginTop: 4,
                        }}
                      >
                        {item.body}
                      </div>
                    </div>
                  </div>
                ))}
              </Section>

              {/* Voiceover */}
              <Section label="Voiceover Script">
                {data.voiceover.map((line, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "10px 16px",
                      borderLeft: `3px solid ${data.accentColor}`,
                      marginBottom: 8,
                      color: "rgba(255,255,255,0.8)",
                      fontSize: 16,
                      background: "rgba(0,0,0,0.2)",
                      borderRadius: "0 8px 8px 0",
                    }}
                  >
                    {line}
                  </div>
                ))}
                <button
                  onClick={() => copy(data.voiceover.join("\n"), "voiceover")}
                  style={copyBtnStyle(data.accentColor)}
                >
                  {copied === "voiceover" ? "Copied!" : "Copy full script"}
                </button>
              </Section>

              {/* Description */}
              <Section label="YouTube / TikTok Description">
                <CopyBox
                  text={data.description}
                  copyKey="description"
                  copied={copied}
                  onCopy={copy}
                  accent={data.accentColor}
                  multiline
                />
              </Section>

              {/* CTA */}
              <Section label="Call to Action">
                <CopyBox
                  text={data.callToAction}
                  copyKey="cta"
                  copied={copied}
                  onCopy={copy}
                  accent={data.accentColor}
                />
              </Section>

              {/* Render instructions */}
              <Section label="Render Instructions">
                <div
                  style={{
                    background: "rgba(0,0,0,0.4)",
                    borderRadius: 12,
                    padding: 20,
                    fontFamily: "monospace",
                    fontSize: 14,
                    color: "#a8ff78",
                    lineHeight: 1.8,
                  }}
                >
                  <div style={{ color: "rgba(255,255,255,0.4)", marginBottom: 8 }}># 1. Download data.json above, then:</div>
                  <div>cd shorts</div>
                  <div>bash render.sh ../your-data.json out/short.mp4</div>
                </div>
              </Section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.15em",
          color: "rgba(255,255,255,0.4)",
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function CopyBox({
  text,
  copyKey,
  copied,
  onCopy,
  accent,
  multiline = false,
}: {
  text: string;
  copyKey: string;
  copied: string | null;
  onCopy: (text: string, key: string) => void;
  accent: string;
  multiline?: boolean;
}) {
  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          background: "rgba(0,0,0,0.3)",
          borderRadius: 12,
          padding: "16px 20px",
          paddingRight: 100,
          fontSize: 16,
          color: "rgba(255,255,255,0.85)",
          lineHeight: 1.6,
          border: "1px solid rgba(255,255,255,0.08)",
          whiteSpace: multiline ? "pre-wrap" : "normal",
          wordBreak: "break-word",
        }}
      >
        {text}
      </div>
      <button
        onClick={() => onCopy(text, copyKey)}
        style={{
          ...copyBtnStyle(accent),
          position: "absolute",
          top: 12,
          right: 12,
          marginTop: 0,
          padding: "6px 14px",
          fontSize: 13,
        }}
      >
        {copied === copyKey ? "✓" : "Copy"}
      </button>
    </div>
  );
}

function copyBtnStyle(accent: string): React.CSSProperties {
  return {
    marginTop: 10,
    padding: "8px 18px",
    borderRadius: 8,
    border: `1.5px solid ${accent}60`,
    background: `${accent}18`,
    color: accent,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  };
}

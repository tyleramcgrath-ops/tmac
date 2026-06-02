"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ListItem {
  emoji: string;
  heading: string;
  body: string;
}

interface ShortData {
  title: string;
  subtitle?: string;
  accentColor: string;
  gradientColors: [string, string, string];
  items: ListItem[];
  voiceover: string[];
  description: string;
  hashtags: string[];
  hook: string;
  callToAction: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TONES = [
  { label: "Educational", emoji: "🧠", value: "Educational + Surprising" },
  { label: "Motivational", emoji: "🔥", value: "Motivational + High Energy" },
  { label: "Dark Truth", emoji: "😈", value: "Dark / Counterintuitive" },
  { label: "Funny", emoji: "😂", value: "Funny + Relatable" },
  { label: "Luxury", emoji: "💎", value: "Luxury / Aspirational" },
  { label: "Scary True", emoji: "😱", value: "Scary but True" },
];

const DURATIONS = [
  { label: "15s", value: 15 },
  { label: "30s", value: 30 },
  { label: "45s", value: 45 },
  { label: "60s", value: 60 },
];

const OUTPUT_TABS = ["Preview", "Script", "Description", "Export"] as const;
type Tab = (typeof OUTPUT_TABS)[number];

// ─── Animated video preview component ────────────────────────────────────────

function VideoPreview({ data }: { data: ShortData | null }) {
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);
  const FPS = 30;
  const TOTAL_FRAMES = 90 * FPS; // max 90s for preview

  const TITLE_IN = 8;
  const ITEM_START = 45;
  const ITEM_GAP = 38;

  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    const step = (ts: number) => {
      if (!lastRef.current) lastRef.current = ts;
      const delta = ts - lastRef.current;
      if (delta >= 1000 / FPS) {
        setFrame((f: number) => {
          const next = f + 1;
          if (next >= TOTAL_FRAMES) {
            setPlaying(false);
            return 0;
          }
          return next;
        });
        lastRef.current = ts;
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing]);

  function restart() {
    setFrame(0);
    setPlaying(true);
  }

  function togglePlay() {
    if (!data) return;
    if (frame === 0 && !playing) restart();
    else setPlaying((p: boolean) => !p);
  }

  const totalFrames = data
    ? ITEM_START + data.items.length * ITEM_GAP + FPS * 2
    : 90;
  const progress = frame / totalFrames;

  // Easing helper
  function clamp(v: number, min: number, max: number) {
    return Math.min(Math.max(v, min), max);
  }
  function easeOut(t: number) {
    return 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  }

  // Title animation
  const titleProgress = easeOut((frame - TITLE_IN) / 15);
  const titleVisible = frame >= TITLE_IN;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Phone frame */}
      <div
        style={{
          width: 220,
          height: 390,
          borderRadius: 32,
          overflow: "hidden",
          border: "3px solid rgba(255,255,255,0.12)",
          position: "relative",
          boxShadow: "0 0 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
          background: data
            ? `linear-gradient(160deg, ${data.gradientColors[0]}, ${data.gradientColors[1]}, ${data.gradientColors[2]})`
            : "linear-gradient(160deg, #0f0c29, #302b63, #24243e)",
          flexShrink: 0,
        }}
      >
        {/* Grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(0deg,rgba(255,255,255,0.025) 0,rgba(255,255,255,0.025) 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,rgba(255,255,255,0.025) 0,rgba(255,255,255,0.025) 1px,transparent 1px,transparent 40px)",
          }}
        />

        {/* Vignette */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "28px 14px 14px",
          }}
        >
          {/* Title */}
          {data && (
            <div
              style={{
                textAlign: "center",
                opacity: titleVisible ? titleProgress : 0,
                transform: `scale(${0.7 + (titleVisible ? titleProgress * 0.3 : 0)})`,
                transition: "none",
              }}
            >
              {data.subtitle && (
                <div
                  style={{
                    fontSize: 8,
                    fontWeight: 800,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: data.accentColor,
                    marginBottom: 4,
                  }}
                >
                  {data.subtitle}
                </div>
              )}
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  color: "#fff",
                  lineHeight: 1.1,
                  textShadow: "0 2px 8px rgba(0,0,0,0.8)",
                }}
              >
                {data.title.replace("\\n", "\n")}
              </div>
            </div>
          )}

          {!data && (
            <div
              style={{
                textAlign: "center",
                opacity: 0.3,
                paddingTop: 40,
              }}
            >
              <div style={{ fontSize: 28 }}>🎬</div>
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.5)",
                  marginTop: 8,
                }}
              >
                Preview will appear here
              </div>
            </div>
          )}

          {/* List items */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 6, margin: "8px 0" }}>
            {data?.items.map((item, i) => {
              const entryFrame = ITEM_START + i * ITEM_GAP;
              const p = easeOut((frame - entryFrame) / 12);
              const visible = frame >= entryFrame;
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "flex-start",
                    opacity: visible ? p : 0,
                    transform: `translateX(${visible ? (1 - p) * -30 : -30}px)`,
                    background: "rgba(0,0,0,0.35)",
                    borderRadius: 8,
                    padding: "6px 8px",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: data.accentColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 9,
                      fontWeight: 900,
                      color: "#fff",
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 800, color: "#fff" }}>
                      {item.emoji} {item.heading}
                    </div>
                    <div style={{ fontSize: 8, color: "rgba(255,255,255,0.65)", lineHeight: 1.4, marginTop: 2 }}>
                      {item.body.slice(0, 50)}{item.body.length > 50 ? "…" : ""}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div>
            <div
              style={{
                height: 3,
                borderRadius: 4,
                background: "rgba(255,255,255,0.15)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(progress, 1) * 100}%`,
                  background: data
                    ? `linear-gradient(90deg, ${data.accentColor}, #fff)`
                    : "rgba(255,255,255,0.4)",
                  boxShadow: data ? `0 0 6px ${data.accentColor}` : "none",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Playback controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          disabled={!data}
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: `2px solid ${data?.accentColor ?? "rgba(255,255,255,0.2)"}`,
            background: data ? `${data.accentColor}22` : "transparent",
            color: data?.accentColor ?? "rgba(255,255,255,0.3)",
            fontSize: 16,
            cursor: data ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {playing ? "⏸" : "▶"}
        </button>
        <button
          onClick={() => { setFrame(0); setPlaying(false); }}
          disabled={!data}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "1.5px solid rgba(255,255,255,0.15)",
            background: "transparent",
            color: "rgba(255,255,255,0.4)",
            fontSize: 14,
            cursor: data ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ↺
        </button>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>
          {data ? `${(frame / FPS).toFixed(1)}s` : "—"}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ShortsPage() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState(TONES[0].value);
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ShortData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("Preview");
  const [copied, setCopied] = useState<string | null>(null);

  async function generate() {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    setTab("Preview");
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
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `short-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const accent = data?.accentColor ?? "#FF6B35";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #07060f 0%, #130f2a 50%, #0d0b1e 100%)",
        color: "#fff",
        fontFamily: "'Inter', -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top nav */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          height: 56,
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(0,0,0,0.3)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Link
            href="/"
            style={{
              color: "rgba(255,255,255,0.4)",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.05em",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            ← App
          </Link>
          <div
            style={{
              width: 1,
              height: 20,
              background: "rgba(255,255,255,0.1)",
            }}
          />
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: "-0.01em",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                background: `linear-gradient(90deg, ${accent}, #ffb347)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              ⚡ Shorts
            </span>
            Generator
          </div>
        </div>
        <div
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.3)",
            fontWeight: 500,
          }}
        >
          Powered by Claude
        </div>
      </nav>

      {/* Main layout */}
      <div
        style={{
          flex: 1,
          display: "flex",
          minHeight: 0,
        }}
      >
        {/* ── Left panel: Form ── */}
        <div
          style={{
            width: 420,
            flexShrink: 0,
            borderRight: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            padding: "32px 28px",
            gap: 28,
          }}
        >
          {/* Hero text */}
          <div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 900,
                lineHeight: 1.1,
                margin: 0,
                marginBottom: 8,
                background: `linear-gradient(90deg, #fff 60%, ${accent})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Go Viral in 60s
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.6 }}>
              Enter a topic. Claude writes the hook, script, voiceover, and description — ready to render.
            </p>
          </div>

          {/* Topic */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.4)",
                marginBottom: 10,
              }}
            >
              Your Topic
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate();
              }}
              placeholder="e.g. 3 foods that secretly age you faster&#10;e.g. habits of people who never get sick&#10;e.g. why 99% of people fail at diets"
              rows={4}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.05)",
                border: `1.5px solid ${topic ? accent + "55" : "rgba(255,255,255,0.1)"}`,
                borderRadius: 12,
                padding: "14px 16px",
                color: "#fff",
                fontSize: 15,
                outline: "none",
                resize: "none",
                lineHeight: 1.6,
                fontFamily: "inherit",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
            />
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.25)",
                marginTop: 6,
                textAlign: "right",
              }}
            >
              ⌘↵ to generate
            </div>
          </div>

          {/* Tone */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.4)",
                marginBottom: 10,
              }}
            >
              Tone
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              {TONES.map((t) => {
                const active = tone === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => setTone(t.value)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: active
                        ? `1.5px solid ${accent}`
                        : "1.5px solid rgba(255,255,255,0.1)",
                      background: active ? `${accent}18` : "rgba(255,255,255,0.03)",
                      color: active ? accent : "rgba(255,255,255,0.55)",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{t.emoji}</span>
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.4)",
                marginBottom: 10,
              }}
            >
              Duration
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {DURATIONS.map((d) => {
                const active = duration === d.value;
                return (
                  <button
                    key={d.value}
                    onClick={() => setDuration(d.value)}
                    style={{
                      flex: 1,
                      padding: "12px 0",
                      borderRadius: 10,
                      border: active
                        ? `1.5px solid ${accent}`
                        : "1.5px solid rgba(255,255,255,0.1)",
                      background: active ? `${accent}18` : "rgba(255,255,255,0.03)",
                      color: active ? accent : "rgba(255,255,255,0.45)",
                      fontSize: 16,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                background: "rgba(255,60,60,0.12)",
                border: "1px solid rgba(255,80,80,0.3)",
                borderRadius: 10,
                padding: "12px 16px",
                fontSize: 13,
                color: "#ff8080",
              }}
            >
              {error}
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={loading || !topic.trim()}
            style={{
              width: "100%",
              padding: "18px 0",
              borderRadius: 14,
              border: "none",
              background:
                loading || !topic.trim()
                  ? "rgba(255,107,53,0.25)"
                  : `linear-gradient(90deg, ${accent}, #ff9a3c)`,
              color: loading || !topic.trim() ? "rgba(255,255,255,0.4)" : "#fff",
              fontSize: 17,
              fontWeight: 800,
              cursor: loading || !topic.trim() ? "not-allowed" : "pointer",
              letterSpacing: "0.01em",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    display: "inline-block",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
                Generating viral short…
              </span>
            ) : (
              "⚡ Generate Short"
            )}
          </button>

          {/* Tips */}
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.07)",
              paddingTop: 20,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.25)",
                marginBottom: 12,
              }}
            >
              Pro tips
            </div>
            {[
              "Be specific — \"3 ways caffeine destroys sleep\" beats \"coffee\"",
              "Dark/counterintuitive tones get the most replays",
              "30s is the sweet spot for algorithm push",
            ].map((tip, i) => (
              <div
                key={i}
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.35)",
                  marginBottom: 8,
                  paddingLeft: 14,
                  borderLeft: "2px solid rgba(255,255,255,0.1)",
                  lineHeight: 1.5,
                }}
              >
                {tip}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel: Output ── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            overflowY: "auto",
          }}
        >
          {/* Tab bar */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              padding: "0 32px",
              background: "rgba(0,0,0,0.2)",
              position: "sticky",
              top: 0,
              zIndex: 10,
            }}
          >
            {OUTPUT_TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "14px 20px",
                  background: "none",
                  border: "none",
                  borderBottom: tab === t ? `2px solid ${accent}` : "2px solid transparent",
                  color: tab === t ? accent : "rgba(255,255,255,0.4)",
                  fontSize: 13,
                  fontWeight: tab === t ? 700 : 500,
                  cursor: "pointer",
                  transition: "color 0.15s",
                  marginBottom: -1,
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, padding: "32px" }}>

            {/* ── Preview tab ── */}
            {tab === "Preview" && (
              <div style={{ display: "flex", gap: 48, alignItems: "flex-start", flexWrap: "wrap" }}>
                <VideoPreview data={data} />

                {data && (
                  <div style={{ flex: 1, minWidth: 280 }}>
                    <div
                      style={{
                        display: "inline-block",
                        background: `${accent}22`,
                        border: `1px solid ${accent}44`,
                        borderRadius: 8,
                        padding: "4px 12px",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        color: accent,
                        marginBottom: 14,
                      }}
                    >
                      {data.subtitle ?? "Your Short"}
                    </div>
                    <h2
                      style={{
                        fontSize: 36,
                        fontWeight: 900,
                        margin: "0 0 8px",
                        lineHeight: 1.1,
                      }}
                    >
                      {data.title.replace("\\n", " ")}
                    </h2>
                    <div
                      style={{
                        fontSize: 14,
                        color: "rgba(255,255,255,0.5)",
                        marginBottom: 28,
                        fontStyle: "italic",
                      }}
                    >
                      "{data.hook}"
                    </div>

                    {data.items.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          gap: 14,
                          marginBottom: 16,
                          padding: "14px 16px",
                          background: "rgba(255,255,255,0.04)",
                          borderRadius: 12,
                          border: "1px solid rgba(255,255,255,0.07)",
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: accent,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 900,
                            fontSize: 14,
                            color: "#fff",
                            flexShrink: 0,
                          }}
                        >
                          {i + 1}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>
                            {item.emoji} {item.heading}
                          </div>
                          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
                            {item.body}
                          </div>
                        </div>
                      </div>
                    ))}

                    <div
                      style={{
                        marginTop: 8,
                        padding: "12px 16px",
                        background: `${accent}12`,
                        border: `1px solid ${accent}30`,
                        borderRadius: 10,
                        fontSize: 13,
                        color: accent,
                        fontWeight: 600,
                      }}
                    >
                      📢 {data.callToAction}
                    </div>
                  </div>
                )}

                {!data && !loading && (
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0.3,
                      textAlign: "center",
                      gap: 12,
                      paddingTop: 40,
                    }}
                  >
                    <div style={{ fontSize: 64 }}>🎬</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>Your short appears here</div>
                    <div style={{ fontSize: 14 }}>Fill in the form on the left and hit Generate</div>
                  </div>
                )}

                {loading && (
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 16,
                      paddingTop: 40,
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        border: "3px solid rgba(255,255,255,0.1)",
                        borderTopColor: accent,
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                    <div style={{ fontSize: 15, color: "rgba(255,255,255,0.5)" }}>
                      Claude is writing your viral short…
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Script tab ── */}
            {tab === "Script" && (
              <div style={{ maxWidth: 680 }}>
                {data ? (
                  <>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 20,
                      }}
                    >
                      <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
                        Voiceover Script
                      </h2>
                      <button
                        onClick={() => copy(data.voiceover.join("\n\n"), "script")}
                        style={chipBtn(accent)}
                      >
                        {copied === "script" ? "✓ Copied" : "Copy all"}
                      </button>
                    </div>
                    {data.voiceover.map((line, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          gap: 14,
                          marginBottom: 12,
                          alignItems: "flex-start",
                        }}
                      >
                        <div
                          style={{
                            minWidth: 28,
                            height: 28,
                            borderRadius: "50%",
                            background: `${accent}22`,
                            border: `1px solid ${accent}44`,
                            color: accent,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {i + 1}
                        </div>
                        <div
                          style={{
                            flex: 1,
                            padding: "12px 16px",
                            background: "rgba(255,255,255,0.04)",
                            borderRadius: 10,
                            fontSize: 15,
                            color: "rgba(255,255,255,0.85)",
                            lineHeight: 1.6,
                            borderLeft: `3px solid ${accent}60`,
                          }}
                        >
                          {line}
                        </div>
                        <button
                          onClick={() => copy(line, `line-${i}`)}
                          style={{ ...chipBtn(accent), fontSize: 11, padding: "4px 10px" }}
                        >
                          {copied === `line-${i}` ? "✓" : "Copy"}
                        </button>
                      </div>
                    ))}

                    <div
                      style={{
                        marginTop: 32,
                        padding: "20px 24px",
                        background: "rgba(255,255,255,0.04)",
                        borderRadius: 14,
                        border: "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 12 }}>
                        Hook / Opening Caption
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 16 }}>
                        {data.hook}
                      </div>
                      <button onClick={() => copy(data.hook, "hook")} style={chipBtn(accent)}>
                        {copied === "hook" ? "✓ Copied" : "Copy hook"}
                      </button>
                    </div>
                  </>
                ) : (
                  <EmptyState loading={loading} />
                )}
              </div>
            )}

            {/* ── Description tab ── */}
            {tab === "Description" && (
              <div style={{ maxWidth: 680 }}>
                {data ? (
                  <>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 20,
                      }}
                    >
                      <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
                        Post Copy
                      </h2>
                    </div>

                    <Section label="YouTube / TikTok Description" accent={accent}>
                      <div
                        style={{
                          background: "rgba(0,0,0,0.3)",
                          borderRadius: 12,
                          padding: "18px 20px",
                          fontSize: 15,
                          color: "rgba(255,255,255,0.8)",
                          lineHeight: 1.7,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          marginBottom: 10,
                        }}
                      >
                        {data.description}
                      </div>
                      <button onClick={() => copy(data.description, "desc")} style={chipBtn(accent)}>
                        {copied === "desc" ? "✓ Copied" : "Copy description"}
                      </button>
                    </Section>

                    <Section label="Hashtags" accent={accent}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                        {data.hashtags.map((tag, i) => (
                          <span
                            key={i}
                            onClick={() => copy(tag, `tag-${i}`)}
                            style={{
                              padding: "6px 14px",
                              background: `${accent}18`,
                              border: `1px solid ${accent}44`,
                              borderRadius: 100,
                              fontSize: 13,
                              color: accent,
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                          >
                            {copied === `tag-${i}` ? "✓" : tag}
                          </span>
                        ))}
                      </div>
                      <button onClick={() => copy(data.hashtags.join(" "), "tags")} style={chipBtn(accent)}>
                        {copied === "tags" ? "✓ Copied" : "Copy all hashtags"}
                      </button>
                    </Section>

                    <Section label="Call to Action" accent={accent}>
                      <div
                        style={{
                          background: `${accent}12`,
                          border: `1px solid ${accent}30`,
                          borderRadius: 12,
                          padding: "14px 18px",
                          fontSize: 16,
                          color: accent,
                          fontWeight: 600,
                          marginBottom: 10,
                        }}
                      >
                        {data.callToAction}
                      </div>
                      <button onClick={() => copy(data.callToAction, "cta")} style={chipBtn(accent)}>
                        {copied === "cta" ? "✓ Copied" : "Copy CTA"}
                      </button>
                    </Section>
                  </>
                ) : (
                  <EmptyState loading={loading} />
                )}
              </div>
            )}

            {/* ── Export tab ── */}
            {tab === "Export" && (
              <div style={{ maxWidth: 680 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>
                  Render to MP4
                </h2>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, margin: "0 0 28px", lineHeight: 1.6 }}>
                  Download the data file, then run the one-line render command on your machine to get a 1080×1920 MP4.
                </p>

                {data ? (
                  <div
                    style={{
                      background: `${accent}12`,
                      border: `1.5px solid ${accent}40`,
                      borderRadius: 14,
                      padding: "20px 24px",
                      marginBottom: 24,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "#fff", marginBottom: 4 }}>
                        {data.title.replace("\\n", " ")} — data.json
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                        {data.items.length} items · {duration}s · {tone}
                      </div>
                    </div>
                    <button
                      onClick={downloadJson}
                      style={{
                        padding: "10px 20px",
                        borderRadius: 10,
                        border: `2px solid ${accent}`,
                        background: "transparent",
                        color: accent,
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      ↓ Download data.json
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: 14,
                      padding: "20px 24px",
                      marginBottom: 24,
                      fontSize: 14,
                      color: "rgba(255,255,255,0.3)",
                      fontStyle: "italic",
                    }}
                  >
                    Generate a short first to download the data file
                  </div>
                )}

                {[
                  {
                    step: "1",
                    title: "Clone & install",
                    code: "cd shorts && npm install",
                  },
                  {
                    step: "2",
                    title: "Render",
                    code: "bash render.sh ~/Downloads/short-*.json out/short.mp4",
                  },
                  {
                    step: "3",
                    title: "Your MP4 is ready",
                    code: "open out/short.mp4",
                  },
                ].map((s) => (
                  <div
                    key={s.step}
                    style={{
                      display: "flex",
                      gap: 16,
                      marginBottom: 16,
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: `${accent}22`,
                        border: `1px solid ${accent}44`,
                        color: accent,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 900,
                        fontSize: 13,
                        flexShrink: 0,
                      }}
                    >
                      {s.step}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 6 }}>
                        {s.title}
                      </div>
                      <div
                        style={{
                          background: "rgba(0,0,0,0.5)",
                          borderRadius: 8,
                          padding: "10px 14px",
                          fontFamily: "monospace",
                          fontSize: 13,
                          color: "#a8ff78",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <span>{s.code}</span>
                        <button
                          onClick={() => copy(s.code, `cmd-${s.step}`)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "rgba(255,255,255,0.3)",
                            fontSize: 14,
                            flexShrink: 0,
                          }}
                        >
                          {copied === `cmd-${s.step}` ? "✓" : "⎘"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div
                  style={{
                    marginTop: 32,
                    padding: "18px 20px",
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.07)",
                    fontSize: 13,
                    color: "rgba(255,255,255,0.4)",
                    lineHeight: 1.7,
                  }}
                >
                  <strong style={{ color: "rgba(255,255,255,0.6)" }}>What gets rendered:</strong>{" "}
                  1080×1920 · 30fps · H.264 MP4 · animated gradient background · spring-physics title entry ·
                  sequential list item slide-ins · glowing progress bar · auto-timed to your content
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function chipBtn(accent: string): React.CSSProperties {
  return {
    padding: "8px 16px",
    borderRadius: 8,
    border: `1.5px solid ${accent}50`,
    background: `${accent}15`,
    color: accent,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  };
}

function Section({
  label,
  accent,
  children,
}: {
  label: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.3)",
          marginBottom: 12,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          paddingBottom: 8,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ loading }: { loading: boolean }) {
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 14, color: "rgba(255,255,255,0.4)", paddingTop: 20 }}>
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.15)",
            borderTopColor: "#FF6B35",
            animation: "spin 0.8s linear infinite",
          }}
        />
        Generating…
      </div>
    );
  }
  return (
    <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 15, paddingTop: 20 }}>
      Generate a short first to see content here.
    </div>
  );
}


"use client";

import { useEffect, useRef, useState } from "react";

const BEAT_EXAMPLES = [
  "Dark trap beat at 140 BPM, rolling 808s, sparse hi-hats, melancholic minor-key piano loop, tape hiss.",
  "Sun-soaked lo-fi house, 118 BPM, dusty Rhodes chords, shuffled drum machine, warm sub bass.",
  "Cinematic drill, 145 BPM half-time, sliding 808s, ominous string stabs, vinyl crackle.",
  "Bossa nova guitar over a soft jazz kit, brushed snare, upright bass walking line, 95 BPM.",
];

const SINGER_EXAMPLES = [
  "Raspy male voice in his 20s with falsetto hooks, somewhere between The Weeknd and Brent Faiyaz, emotional, slightly autotuned.",
  "Smoky alto woman, slow vibrato, Amy Winehouse-meets-Adele phrasing, intimate close-mic'd delivery.",
  "Airy indie tenor with a slight crack, lots of breath, reverb tail, evokes Bon Iver.",
  "Confident pop belter, bright tone, clean diction, polished radio-ready mix.",
];

export default function Home() {
  const [beat, setBeat] = useState("");
  const [singer, setSinger] = useState("");
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastUrl = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (lastUrl.current) URL.revokeObjectURL(lastUrl.current);
    };
  }, []);

  async function generate() {
    setError(null);
    if (!beat.trim() || !singer.trim()) {
      setError("Describe both the beat and the singer.");
      return;
    }
    setLoading(true);
    if (lastUrl.current) {
      URL.revokeObjectURL(lastUrl.current);
      lastUrl.current = null;
    }
    setAudioUrl(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          beat,
          singer,
          durationMs: duration * 1000,
        }),
      });

      if (!res.ok) {
        let msg = `Request failed (${res.status}).`;
        try {
          const data = (await res.json()) as { error?: string; detail?: string };
          if (data.error) msg = data.error;
          if (data.detail) msg += ` ${data.detail}`;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      lastUrl.current = url;
      setAudioUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function fillExample(kind: "beat" | "singer") {
    if (kind === "beat") {
      const pick = BEAT_EXAMPLES[Math.floor(Math.random() * BEAT_EXAMPLES.length)];
      setBeat(pick);
    } else {
      const pick =
        SINGER_EXAMPLES[Math.floor(Math.random() * SINGER_EXAMPLES.length)];
      setSinger(pick);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-5 py-10 md:py-16">
      <header className="mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs tracking-widest text-zinc-400 uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400" />
          Beat &amp; Voice
        </div>
        <h1 className="mt-4 bg-gradient-to-r from-fuchsia-300 via-violet-300 to-cyan-300 bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-5xl">
          Describe a beat. Describe a singer. Hear a song.
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-400">
          Tell the model what kind of production you want and what kind of voice
          should sing on top. It returns a generated track with vocals, powered
          by ElevenLabs Music.
        </p>
      </header>

      <section className="space-y-6">
        <Field
          label="The beat"
          hint="Genre, tempo, instruments, mood, references — anything that defines the production."
          onExample={() => fillExample("beat")}
        >
          <textarea
            value={beat}
            onChange={(e) => setBeat(e.target.value)}
            rows={4}
            placeholder={BEAT_EXAMPLES[0]}
            className="w-full resize-y rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-400/20"
          />
        </Field>

        <Field
          label="The singer"
          hint="Voice type, age, tone, phrasing, artist references — describe who is on the mic."
          onExample={() => fillExample("singer")}
        >
          <textarea
            value={singer}
            onChange={(e) => setSinger(e.target.value)}
            rows={4}
            placeholder={SINGER_EXAMPLES[0]}
            className="w-full resize-y rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/20"
          />
        </Field>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-zinc-200">Length</span>
            <span className="tabular-nums text-zinc-400">
              {duration < 60
                ? `${duration}s`
                : `${Math.floor(duration / 60)}m ${duration % 60 ? `${duration % 60}s` : ""}`.trim()}
            </span>
          </div>
          <input
            type="range"
            min={10}
            max={120}
            step={5}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full accent-fuchsia-500"
          />
          <div className="mt-1 flex justify-between text-[10px] tracking-widest text-zinc-600 uppercase">
            <span>10s</span>
            <span>2m</span>
          </div>
        </div>

        <button
          onClick={generate}
          disabled={loading}
          className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 px-6 py-3.5 font-semibold text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="relative z-10 inline-flex items-center justify-center gap-2">
            {loading ? (
              <>
                <Spinner />
                Generating… this can take 30–90s
              </>
            ) : (
              <>Generate track</>
            )}
          </span>
        </button>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {audioUrl && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-200">
                Your track
              </span>
              <a
                href={audioUrl}
                download="beat-and-voice.mp3"
                className="text-xs text-fuchsia-300 underline underline-offset-2 hover:text-fuchsia-200"
              >
                Download MP3
              </a>
            </div>
            <audio src={audioUrl} controls className="w-full" />
          </div>
        )}
      </section>

      <footer className="mt-14 text-xs text-zinc-600">
        Powered by ElevenLabs Music. Requires{" "}
        <code className="rounded bg-white/5 px-1 py-0.5">ELEVENLABS_API_KEY</code>{" "}
        in your environment.
      </footer>
    </main>
  );
}

function Field({
  label,
  hint,
  onExample,
  children,
}: {
  label: string;
  hint: string;
  onExample: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label className="text-sm font-medium text-zinc-200">{label}</label>
        <button
          type="button"
          onClick={onExample}
          className="text-[11px] tracking-wider text-zinc-500 uppercase transition hover:text-zinc-300"
        >
          Try an example
        </button>
      </div>
      {children}
      <p className="mt-1.5 text-xs text-zinc-500">{hint}</p>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="4"
      />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

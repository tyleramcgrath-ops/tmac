import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

type GenerateBody = {
  beat?: string;
  singer?: string;
  durationMs?: number;
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return json(
      {
        error:
          "ELEVENLABS_API_KEY is not set on the server. Add it to your environment and restart.",
      },
      500
    );
  }

  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const beat = (body.beat ?? "").trim();
  const singer = (body.singer ?? "").trim();
  if (!beat || !singer) {
    return json(
      { error: "Both a beat description and a singer description are required." },
      400
    );
  }

  const durationMs = clamp(
    Number.isFinite(body.durationMs) ? Number(body.durationMs) : 30_000,
    10_000,
    300_000
  );

  const prompt =
    `Produce a complete song with both instrumental and lead vocals throughout. ` +
    `Beat / production: ${beat}. ` +
    `Lead vocalist: ${singer}. ` +
    `The singer performs over the beat from start to finish — keep the vocal style consistent and the mix cohesive.`;

  let upstream: Response;
  try {
    upstream = await fetch("https://api.elevenlabs.io/v1/music", {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "content-type": "application/json",
        accept: "audio/mpeg",
      },
      body: JSON.stringify({
        prompt,
        music_length_ms: durationMs,
      }),
    });
  } catch (err) {
    return json(
      {
        error: "Could not reach ElevenLabs.",
        detail: err instanceof Error ? err.message : String(err),
      },
      502
    );
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    return json(
      {
        error: `ElevenLabs returned ${upstream.status}.`,
        detail: detail.slice(0, 2000),
      },
      502
    );
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "content-type": "audio/mpeg",
      "cache-control": "no-store",
    },
  });
}

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

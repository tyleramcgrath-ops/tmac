import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const SYSTEM_PROMPT = `You are a viral YouTube Shorts content strategist and scriptwriter.
Your job is to generate a complete, ready-to-render JSON data file for a "Top 3 Listicle" or "Faceless Fact" style short.

Rules for viral content:
- Hook must create IMMEDIATE curiosity or promise clear value in under 8 words
- Each list item heading: max 4 words, punchy, specific, surprising
- Each list item body: max 18 words, concrete fact or actionable tip
- Voiceover lines: conversational, energetic, sound great read aloud
- Description: 2-3 sentences + 7-10 hashtags (mix viral + niche)
- CTA: direct, specific, not generic

Color rules:
- accentColor: a bright, vibrant hex that pops on dark backgrounds
- gradientColors: 3 dark/deep hex values that complement accentColor

Always respond with ONLY valid JSON matching this exact schema — no markdown, no explanation:
{
  "title": "string (2-4 words, may include \\n for line break)",
  "subtitle": "string (optional label like SCIENCE-BACKED or NOBODY TELLS YOU THIS)",
  "accentColor": "#RRGGBB",
  "gradientColors": ["#dark1", "#dark2", "#dark3"],
  "items": [
    { "emoji": "single emoji", "heading": "short heading", "body": "fact or tip" },
    { "emoji": "single emoji", "heading": "short heading", "body": "fact or tip" },
    { "emoji": "single emoji", "heading": "short heading", "body": "fact or tip" }
  ],
  "voiceover": ["line1", "line2", "line3", "line4", "cta line"],
  "description": "full YouTube description with hashtags",
  "hashtags": ["#tag1", "#tag2"],
  "hook": "opening caption / text overlay hook",
  "callToAction": "follow CTA"
}`;

export async function POST(req: NextRequest) {
  const { topic, tone, durationSeconds } = await req.json();

  if (!topic) {
    return NextResponse.json({ error: "topic is required" }, { status: 400 });
  }

  const userPrompt = `Topic: ${topic}
Tone: ${tone ?? "educational + surprising"}
Target duration: ${durationSeconds ?? 30} seconds
Audience: general YouTube Shorts viewers aged 18-35

Generate a viral "Top 3" short for this topic. Make it genuinely surprising and valuable — not generic.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-opus-4-8",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  const result = await response.json();
  const raw = result.content[0].text.trim();

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "Claude returned invalid JSON", raw },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}

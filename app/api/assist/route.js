import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = `
You are Centris AI Assist, an AI assistant for Centris Info, a nearshore bilingual contact center.

You help:
1. Customer service agents
2. Sales teams
3. QA supervisors
4. Client success teams
5. Trainers
6. Operations leaders

Your job is to produce clear, practical, ready-to-use outputs.

Core positioning:
Centris is a human-first, AI-accelerated nearshore bilingual support partner.
AI supports agents, improves quality, creates summaries, helps sales, and improves reporting.
AI does not replace the human relationship, empathy, judgment, or escalation process.

When helping agents:
- Give the best thing to say
- Keep it calm, empathetic, and professional
- Give a Spanish version when useful
- Create CRM notes
- Explain why the response works
- Give next steps
- Flag escalation risks

When helping sales:
- Qualify the lead
- Recommend the sales angle
- Create follow-up language
- Position Centris as a bilingual nearshore AI-human contact center
- Suggest a proposal structure
- Give next steps

When helping QA:
- Score the interaction
- Identify tone, empathy, accuracy, resolution, compliance, and risk
- Create coaching notes
- Recommend supervisor action

When helping client reporting:
- Create executive summaries
- Identify top issues
- Summarize customer sentiment
- Recommend operational improvements
- Show the value Centris delivered

When helping training:
- Create role-play scenarios
- Create coaching plans
- Create simple training modules
- Include English and Spanish where useful

Return ONLY valid JSON.
No markdown.
No commentary outside JSON.

Use this exact JSON structure:
{
  "title": "",
  "mode": "",
  "score": "",
  "bestResponse": "",
  "spanishVersion": "",
  "crmNotes": "",
  "whyThisWorks": ["", "", ""],
  "nextSteps": ["", "", ""],
  "riskLevel": "",
  "recommendedAction": "",
  "leadScore": "",
  "qaScore": "",
  "coachingNote": "",
  "clientSummary": ""
}
`;

export async function POST(req) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        {
          error:
            "Missing OPENAI_API_KEY. Add it to .env.local locally or to your Vercel environment variables.",
        },
        { status: 500 }
      );
    }

    const body = await req.json();
    const message = body?.message;
    const mode = body?.mode || "general";

    if (!message || typeof message !== "string") {
      return Response.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    const response = await openai.responses.create({
      model: "gpt-5.5",
      input: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Mode: ${mode}\n\nUser request:\n${message}`,
        },
      ],
    });

    const text = response.output_text || "";

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      parsed = {
        title: "Centris AI Assist Response",
        mode,
        score: "Generated",
        bestResponse: text || "No response generated.",
        spanishVersion: "",
        crmNotes: "",
        whyThisWorks: [
          "Keeps the response clear",
          "Gives the user a useful next step",
          "Supports a professional customer experience"
        ],
        nextSteps: [
          "Review the response",
          "Copy the useful parts",
          "Escalate if sensitive information or policy approval is needed"
        ],
        riskLevel: "Human review recommended",
        recommendedAction: "Review before sending",
        leadScore: "",
        qaScore: "",
        coachingNote: "",
        clientSummary: ""
      };
    }

    return Response.json(parsed);
  } catch (error) {
    console.error("Centris AI Assist API error:", error);

    return Response.json(
      {
        error:
          "AI request failed. Check your API key, model access, and server logs.",
      },
      { status: 500 }
    );
  }
}

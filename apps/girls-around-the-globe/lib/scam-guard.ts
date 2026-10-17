// Client-side early warning for the most common romance-scam patterns. This
// only nudges the person reading or writing a message; real moderation needs a
// server-side pipeline once messaging is backed by a database.

const PATTERNS: { re: RegExp; reason: string }[] = [
  { re: /\b(send|wire|transfer|lend|loan)\b.{0,30}\b(money|cash|funds|\$|usd|eur)/i, reason: "asks for money" },
  { re: /\b(western union|moneygram|wire transfer)\b/i, reason: "mentions a money-transfer service" },
  { re: /\bgift ?cards?\b/i, reason: "mentions gift cards" },
  { re: /\b(crypto|bitcoin|btc|usdt|investment opportunity|trading platform)\b/i, reason: "mentions crypto or investing" },
  { re: /\b(plane|flight|visa)\b.{0,30}\b(ticket|fee|pay|money)\b/i, reason: "asks you to pay for travel or a visa" },
  { re: /\b(whatsapp|telegram|signal|kik|hangouts)\b/i, reason: "wants to move off the platform" },
  { re: /\b(rates?|donations?|roses|per hour|hourly|\d+\s?(hr|hour)s?)\b/i, reason: "looks like a paid arrangement, which isn't allowed here" },
  { re: /\b(bank account|card number|password|verification code|otp)\b/i, reason: "asks for account or card details" },
];

export function scanMessage(text: string): string[] {
  const reasons = new Set<string>();
  for (const { re, reason } of PATTERNS) {
    if (re.test(text)) reasons.add(reason);
  }
  return [...reasons];
}

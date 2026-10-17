import "server-only";
import Stripe from "stripe";

export const PREMIUM_NAME = "Globe+";
export const PREMIUM_PRICE_CENTS = 1499;
export const PREMIUM_PRICE_LABEL = "$14.99/month";

let client: Stripe | null = null;

export function stripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  client ??= new Stripe(key);
  return client;
}

export function siteUrl(): string {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

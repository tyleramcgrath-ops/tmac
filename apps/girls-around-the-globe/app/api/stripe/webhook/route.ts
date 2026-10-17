import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { query } from "@/lib/db";
import { stripe } from "@/lib/billing";

// Keeps users.premium_until in step with the member's Stripe subscription.
export async function POST(request: Request) {
  const client = stripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!client || !secret) return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });

  let event: Stripe.Event;
  try {
    event = client.webhooks.constructEvent(
      await request.text(),
      request.headers.get("stripe-signature") ?? "",
      secret,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.client_reference_id;
      const customer = typeof session.customer === "string" ? session.customer : session.customer?.id;
      if (userId && customer) {
        await query(
          `update users set stripe_customer_id = $2,
             premium_until = greatest(coalesce(premium_until, now()), now() + interval '31 days')
           where id = $1`,
          [userId, customer],
        );
      }
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object;
      const customer = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      const periodEnd = Math.max(0, ...invoice.lines.data.map((line) => line.period?.end ?? 0));
      if (customer && periodEnd) {
        await query("update users set premium_until = to_timestamp($2) where stripe_customer_id = $1", [customer, periodEnd]);
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const customer = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      await query("update users set premium_until = now(), passport = null where stripe_customer_id = $1", [customer]);
      break;
    }
  }

  return NextResponse.json({ received: true });
}

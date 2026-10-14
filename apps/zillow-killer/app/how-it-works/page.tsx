export const metadata = { title: "How bidding works — Gavel" };

const rules = [
  ["Everyone is verified", "Photo ID plus a lender pre-approval or proof of funds before you can bid. Your verified amount is your bid ceiling."],
  ["Proxy bidding", "Enter the most you'd pay. We bid for you one increment at a time, only as high as needed to keep you on top. Nobody — including the seller — sees your max."],
  ["Increments", "$1,000 under $100K · $2,500 to $500K · $5,000 to $1M · $10,000 above."],
  ["Soft close, no sniping", "A bid in the last 5 minutes adds 5 minutes. The auction ends only when the bidding actually stops."],
  ["Hidden reserve", "Sellers may set a minimum. You'll always see whether it's been met. Once a bidder's max reaches it, the price jumps to the reserve."],
  ["No-reserve auctions", "Marked clearly. The highest bid wins, period."],
  ["Buy Now", "Some sellers set an instant-win price. It disappears as soon as the reserve is met."],
  ["Ties", "Equal maxes go to whoever bid first."],
  ["No shill bidding", "Sellers, their family and linked accounts are blocked from bidding. We check identity, devices and payment methods, and review every auction for suspicious patterns."],
  ["$2,500 bid deposit", "A refundable card hold. Released if you don't win; applied to earnest money if you do. Forfeited only if you win and walk away without a contract reason."],
  ["Backup buyer", "If the winner doesn't sign or fund escrow within 48 hours, the runner-up is offered the home at their own max bid."],
];

const faq = [
  ["Do I still get an inspection?", "Yes — one is already in the data room, done by a licensed inspector the seller doesn't choose. You can also inspect during your contract's 7-day due-diligence window, and walk away for a material defect that wasn't disclosed."],
  ["What if the appraisal comes in low?", "Your contract has a financing/appraisal window. Many bidders add an “appraisal gap” amount they'll cover in cash when they register — sellers can see it, and it makes your bid stronger."],
  ["Can I use my own agent?", "Yes. You pay them directly under your buyer agreement, unless the seller has chosen to offer a concession. Your agent can bid for you only from your verified account."],
  ["Who handles the paperwork?", "Our brokerage provides the purchase contract, a licensed transaction coordinator, and partner title/escrow companies. In states that require an attorney at closing, one is included."],
  ["Is this legal without a realtor?", "Yes. Owners can always sell their own homes. Gavel operates as a licensed brokerage in every state it serves, so the auctions, contracts and escrow are handled under state license law."],
];

export default function HowItWorks() {
  return (
    <div className="mx-auto max-w-4xl px-4 pt-12 sm:px-6">
      <h1 className="font-display text-5xl font-semibold tracking-tight">How bidding works</h1>
      <p className="mt-3 text-lg text-ink-dim">
        eBay&apos;s best ideas — proxy bids, open prices, instant outbid alerts — rebuilt for the biggest purchase of your life.
      </p>
      <div className="mt-10 divide-y rounded-2xl border bg-surface">
        {rules.map(([t, b]) => (
          <div key={t} className="grid gap-1 p-5 sm:grid-cols-[220px_1fr]">
            <p className="font-semibold">{t}</p>
            <p className="text-ink-dim">{b}</p>
          </div>
        ))}
      </div>
      <h2 className="mt-16 font-display text-3xl font-semibold">Questions</h2>
      <div className="mt-6 space-y-3">
        {faq.map(([q, a]) => (
          <details key={q} className="card p-5">
            <summary className="cursor-pointer font-semibold">{q}</summary>
            <p className="mt-2 text-ink-dim">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

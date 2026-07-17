# RankForge RC1 — Product Honesty Audit

Governing rule (from Phases A/G): **nothing may imply rankings, traffic, ROI, or
AI-visibility we have not actually observed.** Every user-facing metric and label
was audited against the data that actually backs it. Verdicts: HONEST /
NEEDS-CAVEAT / MISLEADING.

## Summary
The honesty surface is, overall, unusually disciplined: evidence grades,
`unavailable`-not-zero rendering, null-revenue-when-unknown, and `'unknown'`
consensus metrics are all implemented correctly. **One MISLEADING violation was
found and fixed during this audit** (Operator trust score). A handful of
NEEDS-CAVEAT items remain (mostly wording).

## Findings

| # | Label / Metric | Verdict | Evidence | Action |
|---|---|---|---|---|
| 1 | Scan `siteScore` | HONEST | `scans/route.ts:49` avg of real per-page overall | — |
| 2 | Severity counts (critical/warning/info) | HONEST | filled from the same recommendation set shown in the list | — |
| 3 | Recommendation `confidence` (0-100) | HONEST | `reco/engine.ts` formula stored as `confidenceBasis`; not prevalence-based | — |
| 4 | `expectedImpact.size` (high/med/low) | HONEST | qualitative only; **no dollars or %-traffic anywhere** in `reco/` (confirmed by literal search) | — |
| 5 | `priorityScore`/`priorityRank` | HONEST | deterministic composite, presented as a rank not a promise | — |
| 6 | Competitor overlap grades | HONEST | uncrawlable → `unavailable` + `—`; business overlap correctly badged `estimated` | — |
| 7 | GA4 `revenue` | HONEST | `google.ts` `revenue: currency ? … : null` — null, never 0-as-fact | — |
| 8 | Atlas evidence-grade tally | HONEST | real count across observations | — |
| 9 | Consensus metrics (verificationSuccessRate, humanAgreementRate, …) | HONEST | return literal `'unknown'` when denominator is 0 | — |
| 10 | **Operator `trustScore`** | **MISLEADING → FIXED** | With 0 deployments it computed **40** (`0×0.6 + 1×0.25 + 1×0.15`), implying 40% trust from no evidence | **Fixed:** returns `null` (renders "—") until ≥1 applied deployment (`operator/metrics.ts`; test `operator-engine.test.ts`) |
| 11 | Operator success/rollback rates at 0 deployments | **NEEDS-CAVEAT → FIXED** | showed "0%" for zero attempts (reads as failure, not "no data") | **Fixed:** null → "—" (same change) |
| 12 | `verifiedImprovements` / "Verified fixes" | HONEST | straight count of verified deployments | — |
| 13 | AgentPanel "Your SEO agent team" / stances / consensus | NEEDS-CAVEAT | roles over one deterministic pipeline, not independent AI models; orchestrator is explicit but UI wording can mislead | **Recommend:** one-line subtitle "Agents are analytical roles over one evidence set, not separate AI models." (MEDIUM, deferred — wording only) |
| 14 | Hardcoded per-agent `confidence` (95/85/75/…) | NEEDS-CAVEAT | static literals rendered next to "confidence" | **Recommend:** drop the numbers or relabel as qualitative role-strength (LOW, deferred) |
| 15 | Marketing hero dashboard (SEO 92, AI 78) | HONEST | labeled "Sample values… not live measurements" + "Illustrative preview" badge | — |
| 16 | Marketing demo tour (rank heatmap, review counts, 92/100) | HONEST | inside a modal explicitly flagged "sample data — not live measurements" | — |
| 17 | "Ruthless ROI" + "14-day money-back guarantee" | NEEDS-CAVEAT | slogan, no numeric ROI promise; **but the refund guarantee is a factual claim that must be operationally real** | **Action (business, not code):** confirm the refund policy is honored before charging |
| 18 | Forge LLM prompt "tie fixes to business outcomes (rankings, traffic, revenue)" | NEEDS-CAVEAT | instructs relating, not fabricating; a stray "+X traffic" is possible | **Recommend:** add "never state specific ranking/traffic/revenue numbers not derivable from provided data" to `forge/route.ts` (LOW, deferred) |

## Suspicious-literal sweep
- `Math.random` in product paths: **none** (only a test email generator).
- Hardcoded scores / fake percentages: only in **clearly-labeled marketing
  sample data** or as the static per-agent confidences (#14).
- "estimated"/"projected" revenue: **none**; `revenue` is real-or-null; "estimated"
  appears only as a *disclosed evidence grade*.

## Bottom line
After the #10/#11 fix, **no fabricated metric leaks into the real product data
path.** The remaining items are wording caveats (#13, #14, #18) and one business
verification (#17, the refund guarantee). None is a launch blocker; #13 is worth
doing before broad launch so users don't over-trust the "agent team" framing.

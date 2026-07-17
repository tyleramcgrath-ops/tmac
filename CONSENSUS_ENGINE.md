# Consensus Engine (Phase F)

Before any recommendation is presented, the relevant agents each provide
findings, confidence, supporting evidence, and assumptions. The consensus engine
(`lib/foundation/agents/consensus.ts`) synthesizes those stances into one of four
verdicts and **never hides disagreement**.

## Inputs

For a finding, the engine receives the full set of `AgentStance` objects:

- Scout (neutral — discoverer)
- the primary domain owner (support — it stands behind the finding)
- Strategist (support/neutral — business priority)
- CRO / Local (support — when the page is in their domain)
- QA Reviewer (support/concern/neutral — the skeptic)

Each stance carries a `position`, `confidence`, `evidence[]`, and `assumptions[]`.

## The four outcomes

| Status | Meaning | Trigger |
|---|---|---|
| **agree** | Owner supports, QA does not object, confidence is solid | no concerns, finding + agent confidence high |
| **disagree** | A substantive concern conflicts with the owner's support | a concern exists AND someone supports the same finding |
| **needs-review** | Aligned but not confident; a human should confirm | low finding/agent confidence, a soft concern, or the engine's own human-review flag |
| **human-required** | Must be decided by a human | an **irreversible class** (indexation/canonical/robots) OR a **hard QA block** (QA concern at ≥85 confidence) |

## Evidence wins

The engine is deliberately conservative and evidence-weighted:

1. **Irreversibility raises the bar.** A dangerous rule class
   (`isDangerousRule`, the typed flag from D.6 P2 — no title regex) always
   routes to `human-required`, no matter how confident the owner is. Deindexing
   a page is not a majority-vote decision.
2. **A high-confidence QA objection is a hard block.** If the skeptic is ≥85%
   sure something is wrong (e.g. two independent weaknesses), the system asks a
   human rather than proceeding.
3. **Genuine conflict is surfaced, not averaged away.** When a concern coexists
   with support, the engine returns `disagree` and lists the conflict in plain
   language (`disagreements[]`, naming the challenging agent) — it never silently
   picks a side.
4. **Alignment without confidence is still flagged.** If everyone agrees but the
   aggregate confidence is low, the verdict is `needs-review`, not `agree`.

Only when the owner supports, QA raises no objection, and confidence is solid
does the engine return `agree`.

## Why disagreement improves quality

Disagreement is a feature. A `disagree` or `human-required` verdict is the system
telling the user exactly where the evidence is thin or the risk is high — the
places a human should spend attention. A tool that only ever "agrees with itself"
hides its weak spots; this engine exposes them. The success metrics
(`metrics.ts`) treat `agree` and `human-required` as *decisive* verdicts
(`consensusQuality`) and surface `disagree`/`needs-review` as open items for a
human — measuring the quality of the disagreement, not suppressing it.

## Worked examples (from the tests)

- **Missing `<title>` on a pricing page, confidence 90** → owner supports, CRO
  supports (money page), Strategist supports, QA supports (strong evidence, low
  risk) → **agree**, no disagreements.
- **`noindex` finding, confidence 95** → owner supports, but the class is
  irreversible → **human-required** (the 95% confidence does not override the
  irreversibility).
- **Thin-evidence content finding, confidence 62** → owner supports, QA raises a
  concern ("thin supporting evidence") → **disagree** (surfaced), naming the QA
  Reviewer, OR **needs-review** if confidence is the only issue.
- **Low-confidence, engine-flagged finding** → two QA weaknesses → hard block →
  **human-required**.

## Guarantee

`Never hide disagreement.` Every conflict is recorded on the recommendation
(`coordination.disagreements`) and rendered in the UI as a red "Disagreement
surfaced" block. The consensus verdict and its one-line reason are always shown.

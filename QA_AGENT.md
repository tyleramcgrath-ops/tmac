# QA Reviewer (Phase F)

The QA Reviewer's only job is to challenge every other agent. It exists because a
team that always agrees with itself hides its weak spots. QA is deliberately
skeptical: it asks, for every finding —

- **What could be wrong?**
- **What evidence is missing?**
- **What assumptions are weak?**
- **What would make this recommendation incorrect?**

It lives in `lib/foundation/agents/qa.ts` and produces an `AgentStance` that the
consensus engine weighs against the owner's support.

## What QA inspects (all from the finding's real, typed fields)

1. **Confidence** — is the finding's own confidence below 50?
2. **Human-review flag** — did the engine already mark it for review
   (`needsHumanReview`)?
3. **Evidence depth** — how many supporting elements + facts back it? One or
   fewer is "thin." Zero affected URLs is a red flag.
4. **Named failure mode** — the finding's own `whatCouldMakeWrong` caveat (the
   explainability field from Phase C). QA reads it as an explicit assumption to
   watch.
5. **Irreversibility** — is it a dangerous class (indexation/canonical/robots)?
   Irreversible changes demand stronger evidence, so QA raises the bar.

## How QA decides its position

- **≥2 weaknesses, or a dangerous class under 80% confidence** → a **hard
  concern** (confidence 85). This is strong enough to trigger `human-required`
  in the consensus engine — QA can force a human decision.
- **Exactly one weakness** → a **moderate concern** (confidence 65).
- **Strong + low-risk** (confidence ≥80, ≥2 evidence items, not dangerous) →
  **support** — but QA still records the acknowledged failure mode as an
  assumption, so the caveat is never lost, only judged unlikely.
- **A soft caveat with only moderate confidence** → a moderate concern (the
  finding admits it could be wrong and isn't confident enough to dismiss that).
- **Otherwise** → **neutral** (no strong objection, evidence only moderate).

The key subtlety: a finding's honest caveat does **not** by itself flip QA to a
concern when the finding is already strong and well-evidenced. QA is skeptical,
not obstructive — it distinguishes "acknowledged but unlikely" from "weak."

## What QA outputs

```ts
{
  agentId: 'qa',
  position: 'support' | 'concern' | 'neutral',
  confidence,                 // QA's confidence in ITS position, not the finding's
  evidence: [ 'confidence N', 'M affected URL(s)', 'K evidence item(s)',
              'dangerous rule class' | 'reversible change' ],
  assumptions: [ the finding's whatCouldMakeWrong caveat ],
  note                        // the specific challenge, in one line
}
```

## How QA changes outcomes

- A **hard QA concern** (≥85) → consensus `human-required` — QA can stop
  automation and demand a human, even on a high-confidence finding.
- A **QA concern against owner support** → consensus `disagree`, surfaced in the
  UI naming the QA Reviewer.
- **QA support** on a strong finding → clears the way for `agree`.

QA never approves or deploys — it only challenges. That separation (challenger ≠
proposer ≠ executor) is what makes its skepticism trustworthy rather than
theatrical.

## Verified

`tests/agents.test.ts`: QA raises a concern on a low-confidence, review-flagged
finding; supports a strong low-risk one; always records the finding's failure
mode as an assumption; and its high-confidence objection escalates a finding to
`human-required` in the consensus engine.

# Confidence Model 2.0 (Phase C §3)

## The problem it replaces

Phase B proved the old confidence was **prevalence-weighted**: `confidence = rule_certainty × prevalence`. Because prevalence dominated, a low-value fix that appeared on every page outranked an important fix that appeared once:

- "Add BreadcrumbList" (low value, partly wrong) → **85** (9/9 pages)
- "Add a meta description" (important) → **43** (1/9 pages)

A user sorting by confidence was led to the wrong work. Confidence measured *how common* a pattern was, not *how sure we are it's correct and worth doing*.

## The V2 model

Confidence expresses **how sure we are the recommendation is correct** — independent of how many pages have it. Prevalence is shown separately ("affects N pages") and never feeds confidence.

```
confidence = round( ruleCertainty × contextFactor × evidenceStrength × 100 )

  ruleCertainty   0–1  How mechanical/observed the detection is.
                       Missing <title> = 1.0; "thin content" heuristic = lower;
                       multiple-H1 = 0.6 (Google permits it).
  contextFactor   0.7 + 0.3 × classificationConfidence
                       Lowers confidence when the page type the rule depends on
                       is uncertain (cross-signal agreement).
  evidenceStrength 0.85 + 0.15 × min(1, supportingElements/2)
                       More concrete supporting facts → slightly higher.
```

Importance (business/SEO value) is a **separate** axis that feeds priority, not confidence — so an important-but-heuristic finding gets high priority without falsely claiming high certainty.

## Inputs, mapped to the brief

| Brief input | How V2 uses it |
|---|---|
| Evidence quality | `evidenceStrength` from count of concrete supporting elements |
| Rule certainty | `ruleCertainty` per rule (mechanical vs heuristic) |
| Business context | feeds **priority**, not confidence (kept orthogonal on purpose) |
| Cross-signal agreement | `contextFactor` via classification confidence |
| Historical accuracy | **not yet** — see "not built" below |
| Human validation | recommendation `status` history exists (accept/modify/reject) and is the substrate for future learning; **not yet fed back into confidence** |

## Result on real data (github.com)

The inversion is fixed:

| Recommendation | V1 conf | V2 conf |
|---|---|---|
| Missing meta description (important) | 43 | **80** |
| Multiple H1s (low value, Google-permitted) | 70 | **53** (and `needsHumanReview`) |
| Add Organization schema (page-appropriate) | 85 (generic) | 78 (specific) |

High-certainty, important fixes now score highest; debatable ones score lower and are flagged for review.

## Honest limitations (not built yet)

- **Historical accuracy** and **human-validation feedback** are *not* yet part of the confidence number. The data substrate exists — every recommendation stores a `status` + `history` (accepted/modified/rejected/deployed/verified/rolled_back) — but a learning loop that adjusts a rule's certainty from accumulated human decisions is future work. Confidence today is deterministic and transparent, which is the right foundation for adding that loop without hiding it behind a black box.
- Confidence is **not** a probability of ranking improvement; it is confidence that the finding is correct and worth doing. That distinction is stated in `confidenceBasis` on every recommendation.

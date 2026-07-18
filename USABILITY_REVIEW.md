# RankForge RC1 — Usability & New-User Review

Scope: the authenticated app (`app/app/**`) evaluated as a first-time user who
knows nothing about RankForge. Every screen should answer **"what do I do
next?"** — most do not, yet.

## Verdict at a glance
The core *task* screens (Audit → Recommendations → WordPress) are usable and
have empty states. The product fails a new user on **onboarding, terminology,
tab ordering, and the two advanced surfaces (Operator, Atlas)** that lead with
jargon and look broken when empty. None of this is a data-integrity risk — it is
comprehension and first-run friction.

## Per-screen summary

| Screen | Primary action clear? | Empty state | Loading | Help text | Answers "what next?" |
|---|---|---|---|---|---|
| Signup / Login | Yes | n/a | Yes | Minimal | Drops into projects with no orientation |
| Projects list | Yes ("New project") | Yes + CTA | Yes | Good | **Yes** (best in app) |
| Create Project modal | Yes | n/a | Yes | Weak (no "why these fields matter") | Lands on Audit with no pointer |
| Project shell / tabs | Tabs equal-weighted | Error→empty | Yes | None | No step ordering |
| **Audit** | **Yes ("Run scan")** | Yes (explains it populates the rest) | Inline progress | Good | **Yes** |
| Recommendations | Ambiguous (many competing actions) | Yes | Yes | Empty-state only | Partial ("Fix on WordPress →") |
| Operator | Gated behind understanding | Yes | Yes | One line | No — 8 undefined metric tiles |
| Atlas | Split / secondary | No true empty state | Yes | Good inline notes | No — reads "unavailable" everywhere |
| WordPress | Yes ("Connect & verify") | Yes | Yes | Good | Yes |
| Deploy modal | Yes ("Deploy & verify") | n/a | Yes | Strong | Yes |
| History | n/a (read-only) | Yes | No (prop) | Empty-state only | No (dead-end, no re-scan CTA) |

## Top gaps (most impactful first)

1. **No onboarding anywhere.** After signup and after project creation the user
   lands in a tabbed workspace with no guidance. `app/page.tsx` is a bare
   redirect; signup redirects to `/app/projects` with no orientation. The only
   thing resembling onboarding is the projects empty state ("create a project").
   → **Fix (RC1):** a project-level checklist on the Audit tab — *Run scan →
   Review recommendations → Connect WordPress → Deploy* — so step order is
   explicit, not buried inside each tab's empty state.

2. **Tab state is not in the URL** (`[projectId]/page.tsx`, `useState<Tab>`).
   Refresh resets to Audit, tabs aren't linkable/shareable, browser back doesn't
   move between tabs. → **Fix:** put the tab in the query string.

3. **"Operator" and "Atlas" are opaque labels, ordered before the WordPress tab
   they depend on.** Current order Audit · Recommendations · Operator · Atlas ·
   WordPress · History puts an advanced bulk-deploy surface (Operator) and an
   all-empty external-intel surface (Atlas) ahead of the prerequisite WordPress
   connection. → **Fix:** reorder to Audit · Recommendations · WordPress ·
   Operator · Atlas · History and/or rename ("Operator"→"Auto-fix",
   "Atlas"→"Competitors & Search").

4. **Operator shows 8 undefined metric tiles** (Trust score, Rollback rate,
   Verify-fail rate, Automation success, Avg resolution) that are all 0/— for a
   new account, looking broken. → **Fix:** tooltips/definitions + a real empty
   state ("Deploy a fix to start building trust metrics").

5. **Atlas looks broken, not empty.** Every overlap/briefing datum renders
   "—/unavailable, confidence unknown" with no top-level empty state. The
   evidence-grade badges (Observed/Imported/Estimated/Unavailable) are
   unexplained. → **Fix:** an Atlas empty state ("Connect Google and add
   competitors to populate this") + a one-line legend for the grades.

6. **AgentPanel is a wall of jargon** (Consensus, provenance chain, stances,
   disagreements, human-required, nine agent roles) with no glossary. → **Fix:**
   a short "what is this?" tooltip, or collapse it behind a disclosure.

7. **Three overlapping deploy paths** — Recommendations' "Fix on WordPress",
   Operator's bulk "Approve & deploy", and WordPress' manual DeployForm — all
   write the same posts with nothing explaining when to use which. → **Fix:**
   pick one primary path for RC1 (Recommendations one-click) and de-emphasize the
   others, or add one line of guidance.

8. **"Fix on WordPress" appears even when WordPress isn't connected**
   (`RecommendationsTab.tsx`); the dependency only surfaces as a modal error. →
   **Fix:** disable/annotate the button until WP is connected.

9. **Manual WordPress DeployForm requires raw Post ID + type** (`WpForms.tsx`)
   with no lookup — non-technical users won't know these. → **Fix:** lean on the
   slug-resolver already in `resolveWpTarget`; hide the manual form by default.

10. **Create Project collects industry/goal/locations with no "why"**
    (`projects/page.tsx`) — users skip them and weaken later recommendations
    without knowing the cost. → **Fix:** one helper line per field.

11. **Minor inconsistencies:** Audit uses ad-hoc progress text instead of the
    shared `Spinner`; the shared `EmptyState` supports a CTA `action` but only
    the Projects list uses it — every in-tab empty state omits the button.

## Jargon glossary (terms a non-expert will stumble on)
Operator, Mission Atlas, Morning briefing, Recommended mission, Consensus,
Provenance, stances, disagreements surfaced, human-required, owned findings,
evidence grade (Observed/Imported/Estimated/Unavailable), overlap
(business/topic/service/entity/authority), Trust score, Rollback rate,
Verify-fail rate, Automation success, Dry run, advisory, read-back, AIOSEO,
fixKind, confidenceBasis, "pinned", Application Password, Post ID/type.

RC1 recommendation: none of these are blockers to *data safety*, but items 1–5
are blockers to a self-serve first-run. For a **guided pilot** (see
`PILOT_PLAN.md`) they are manageable with a human walking each user through
setup; for **unassisted self-serve signup** they must be fixed first.

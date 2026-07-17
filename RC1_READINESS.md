# RankForge RC1 — Production Readiness Report

Audit scope: the whole authenticated product as it exists at branch head
(`claude/rankforge-phase-11-pilot-hop710`). Method: four evidence-based audits
(journey feature-existence, security break-testing, failure/graceful-degradation
+ product honesty, usability) cross-checked against the code and the test suite.
No claim below is made without file-level or test-level evidence.

**Environment caveat that governs the whole report:** this codebase was built and
tested in a sandbox whose outbound network is restricted to GitHub + package
registries. Therefore **no live third-party integration (real WordPress, real
Google) has ever been exercised.** Everything involving those is proven against
in-process fakes/mocks and typechecks only.

Baseline evidence: `tsc` clean · `next build` compiles (21 routes) · **284
tests pass, 8 Postgres-gated skipped** · store conformance + migrations 001–004
verified on real PostgreSQL 16.

RC1 fixes applied during this audit (blockers found, not new features):
- **SSRF** on the WordPress connect probe → now passes the resolved-IP/port guard.
- **pg Pool** had no `error` handler → a Postgres restart could crash the process; added.
- **Honesty violation**: a fresh project showed "Trust score 40 / 0%" with zero
  deployments → now renders "—" (no fabricated baseline).
- Minor: revoked Google token now surfaces as `unauthorized`; Google fetches have a 15s timeout.

---

# SECTION 1 — VERIFIED READY

Capabilities verified working end-to-end **within the test/mocked boundary**.
"Ready" here means: the code path is complete, exercised by tests, and behaves
correctly — NOT that it has been run against live third-party services (see the
limitations column and Section 2).

| Capability | Evidence | Test coverage | Known limitations |
|---|---|---|---|
| **Account signup / login / logout** | `app/api/auth/*`; session = HttpOnly+SameSite=Lax JWT (jose HS256) | `auth-routes.test.ts` (incl. logout-everywhere revoke, 429 on brute force) | No email verification (Section 2); accounts live instantly |
| **Session revocation (tokenVersion)** | `auth.ts:46-57` rejects stale `tv` | `auth-routes.test.ts` | — |
| **Tenant isolation** | Every `projects/[id]/*` route calls `requireUser`+`requireProjectRole`; cross-tenant → 404 (`auth.ts:106-108`) | `atlas-routes.test.ts`, `integrations-routes.test.ts` (cross-tenant 404) | Project-create returns 403 for foreign org (cosmetic inconsistency) |
| **Project CRUD** | `app/api/projects/*` (create=admin, delete=owner) | `scan-rec-routes.test.ts`, route tests | — |
| **Crawl → scan persistence** | `AuditTab` → client batched crawl → `crawl/route.ts` (SSRF-guarded) → `scans/route.ts` | `extract-signals.test.ts` (22), `page-validity.test.ts` | Crawl is client-driven; no per-user rate cap (Section 3, HIGH) |
| **Recommendation engine (V2)** | classify → page/cross-page rules → confidence → priority | `reco-engine.test.ts` (13), `recommendation-identity.test.ts` | — |
| **Recommendation triage + editable priority** | status machine + `userPriority` override | `integrations-routes.test.ts` (priority set/clear/foreign 404) | — |
| **WordPress deploy → read-back verify → rollback** | `wp-execution.ts` (capture-before → apply → re-read → reopen-on-fail) | `wordpress-execution.test.ts` (10), `wordpress-route.test.ts` | **Against a WP test double only — never a live WordPress (Section 2, BLOCKER)** |
| **New content fixes (https-upgrade / missing-H1 / internal-linking)** | `operator/content-fix.ts` + fixgen + pipeline; idempotent, invariant-verified | `content-fix.test.ts` (11), `wordpress-execution.test.ts` content cases | Live-WP-unvalidated; H1/internal-link are approval-gated |
| **Operator bulk deploy + safety/policy gating** | dangerous kinds blocked; approval required | `operator-engine.test.ts` (17), `operator-routes.test.ts` (8) | — |
| **Multi-agent coordination (roles over one pipeline)** | `agents/*`; provenance + consensus | `agents.test.ts` (17) | Roles, not independent models; UI wording NEEDS-CAVEAT (honesty audit) |
| **External intelligence, disconnected-by-default** | evidence grades observed/imported/estimated/unavailable | `external.test.ts` (16), `atlas-review.test.ts` (16) | Live providers unproven; GSC/GA4 not rendered (Section 2) |
| **Encrypted credential storage (WP + Google OAuth)** | AES-256-GCM (`crypto.ts`); never returned/logged | `oauth-google.test.ts` (11), `integrations-routes.test.ts` (no credential in projection) | — |
| **Persistence across sessions** | server store (Postgres/file); no localStorage source-of-truth | `store-conformance.test.ts` on real PG16; `migrations.test.ts` (001–004) | — |
| **SSRF / URL guard** | resolved-IP + port + rebinding guard on crawl, WP fetch, **and now WP connect** | `url-guard.test.ts` (68), `wordpress-route.test.ts` (SSRF case) | — |

---

# SECTION 2 — VERIFIED NOT READY

Every feature that is missing, partial, stubbed, hidden, not surfaced, or blocked
by the environment. Each is a verified absence/limitation, not an assumption.

| Feature | State | Evidence |
|---|---|---|
| **Live WordPress validation** | ENV-BLOCKED / UNPROVEN | The entire deploy path is proven only against the in-process WP double (`wordpress-execution.test.ts`). No real WordPress REST endpoint has ever been written to. This is the product's core promise. |
| **Live Google OAuth + API** | ENV-BLOCKED / UNPROVEN | The token exchange + GSC/GA4 calls are unit-tested with an injected fake; the real handshake with Google has never run (egress restricted). |
| **GSC data rendered in Atlas** | HIDDEN | `GoogleSearchConsoleProvider.fetchReport` produces `snapshot.gsc`, but `AtlasTab.tsx` never renders it — only the briefing, connect cards, competitors. Connecting Google shows no imported metrics. |
| **GA4 data rendered in Atlas** | HIDDEN | Same: `snapshot.analytics` is produced but never displayed. |
| **Atlas change-detection ("what changed overnight")** | NOT WIRED | `assembleAtlas` supports a `prev` snapshot, but the route never persists/passes one, so threats/opportunities from diffs are perpetually empty. |
| **Email verification** | ABSENT | No verification token, no mail sender; signup issues a live session immediately. |
| **Team invitations / member management** | STUBBED (store only) | `store.addMember/listMembers` + role gates exist, but there is **no invite route and no members UI**. Multi-user orgs are unreachable through the product. |
| **Explicit organization creation** | AUTO-ONLY | Org is auto-created at signup; no create-org surface. |
| **Strategy UI** | ABSENT (as a surface) | "Strategy" exists only as the internal business-context/priority engine; no Strategy tab/route. Its output appears inline in Recommendations. |
| **Roadmap generation/UI** | ABSENT | No roadmap route, engine, or UI; "roadmap" is only doc/briefing prose. |
| **CEO / executive briefing** | ABSENT (conflated) | Only the Atlas *morning briefing* exists; the Operator "Executive metrics" grid is KPIs, not a briefing document. |
| **Onboarding / first-run guidance** | ABSENT | No wizard/checklist/tour; signup and project-create drop the user into a tabbed workspace with no orientation. |
| **Deep-linkable tab state** | ABSENT | Project tab is React `useState`, not in the URL — refresh resets to Audit, tabs aren't shareable, browser back doesn't work. |
| **Rate limiting beyond auth** | ABSENT | Only login/signup are limited. `scans`/`crawl` (outbound amplification) and OAuth-start are uncapped. |
| **OAuth state single-use (replay store)** | ABSENT | `state.nonce` is generated but never persisted/checked; only a 10-min time window guards replay. Low practical risk (needs Google's one-time code + session). |

---

# SECTION 3 — RELEASE DECISION

Every remaining issue, classified. **Only BLOCKERs prevent the first paying
customer.**

## BLOCKER (must fix before any paying customer)
1. **Live WordPress deploy path is unvalidated.** The core value proposition is
   "one-click fixes to your live WordPress." That write→verify→rollback path has
   never touched a real WordPress. Modifying a paying customer's live site with
   an unproven path is unacceptable. → *Validate against ≥1 real WordPress
   (staging) for each fix kind: title, meta, https-upgrade, H1, internal-links.*
2. **"Connect Google" is a dead-end for the user.** The button connects and the
   OAuth is unproven live, **and even on success the imported GSC/GA4 data is
   never rendered.** A paying customer who connects Google sees nothing. →
   *Either (a) hide/label the Google + Atlas external-intel surface as
   "coming soon" and remove it from the paid scope, or (b) render GSC/GA4 AND
   validate the live handshake.* For a near-term launch, (a) is the honest path.

## HIGH (fix before broad/self-serve launch; tolerable for a *guided, allow-listed* pilot)
- **No onboarding.** A self-serve user is lost. Mitigation for a 10-customer
  pilot: human-guided setup (documented in `PILOT_PLAN.md`).
- **No rate limiting on scan/crawl.** Outbound-amplification abuse vector for
  open signup. Mitigation for pilot: allow-list the 10 known accounts.
- **No email verification.** Spam/abuse surface for open signup. Tolerable for
  hand-picked pilot accounts; document it.
- **No team invitations.** Product is effectively single-user. Tolerable if each
  pilot business uses one login; document it.

## MEDIUM (quality; schedule soon)
- Tab state not in URL (navigation defect).
- Atlas renders "unavailable everywhere" with no empty state — looks broken.
- Operator/Atlas jargon + tab ordering ahead of the prerequisite WordPress tab.
- OAuth nonce replay store (defense-in-depth).
- `assertSameOrigin` applied inconsistently (Lax cookie is the real guard; WP now covered).

## LOW (polish)
- Per-agent `confidence` integers are hardcoded literals rendered as "confidence."
- "Ruthless ROI" slogan / "14-day money-back guarantee" — verify the refund
  policy is operationally real.
- Minor UI inconsistencies (Spinner usage, empty-state CTAs).

---

# FINAL DECISION

**Would you personally launch this product to 10 paying beta customers tomorrow?**

## NO

**Why (not softened):**
1. The product's single headline capability — deploying SEO fixes to a
   customer's **live WordPress** — has **never been run against a real
   WordPress**. Every proof is against an in-process fake. Charging money to
   write changes to a customer's live site on an unvalidated path is not
   defensible, no matter how disciplined the code or how green the tests.
2. **"Connect Google" is advertised in the UI but delivers nothing to the user**
   — the live OAuth handshake is unproven and the fetched GSC/GA4 data is never
   rendered. A paying customer would connect their Google account and see a blank
   surface. That is a broken promise on day one.
3. There is **no onboarding, no email verification, and no way to add a
   teammate.** For an unassisted paid launch "tomorrow," users would be stranded.

The engineering foundation is genuinely strong — tenant isolation, encryption,
SSRF guard, read-back verification, evidence-graded honesty, and (after this
audit) no fabricated metrics. But "strong foundation" ≠ "ready to charge for,"
and the two BLOCKERs are about *unverified live behavior on the customer's own
property*, which is exactly where you cannot bluff.

## Minimum set of changes to turn this into a YES (for a guided, allow-listed 10-customer pilot)

1. **Validate the live WordPress path end-to-end** against at least one real
   WordPress (staging) — connect, deploy each fix kind, confirm read-back
   verification, and confirm rollback restores the original. (Validation work,
   not new features.) *This is the one non-negotiable.*
2. **Cut or clearly gate the Google/Atlas surface** for the pilot: hide the
   "Connect Google" button and the Atlas tab (or label them "Beta — not yet
   live") so no customer hits a dead-end. (Alternatively, finish rendering
   GSC/GA4 + validate live OAuth — larger, not required for the pilot.)
3. **Run the pilot guided and allow-listed**, per `PILOT_PLAN.md`: you (or an
   operator) walk each of the 10 businesses through signup → project → scan →
   connect their WordPress → deploy. This converts the onboarding, email-verify,
   invite, and rate-limit HIGH items into *documented, acceptable* limitations
   for a controlled cohort rather than blockers.

With (1) done and (2)+(3) in place, the answer becomes **YES for a guided pilot**
— because the customer-visible scope is then limited to capabilities that are
actually verified, and the one path that touches their live property has been
proven on real infrastructure. It is **not** yet a YES for open, self-serve,
unguided paid signup — that additionally needs the HIGH items (onboarding,
email verification, rate limiting, and ideally team invites) built.

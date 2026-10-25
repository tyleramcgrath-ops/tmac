---
name: ui-ux-pro-max
description: Build and review user-facing UI with senior-designer rigor. Framework-agnostic. TRIGGER when the user is creating, modifying, or reviewing UI surfaces — components, pages, layouts, forms, navigation, empty/loading/error states, design tokens, theming, marketing pages, or accessibility. Also triggers on phrases like "make this look better", "polish the UI", "design review", "is this accessible", "tighten the spacing", "improve the empty state". SKIP for pure backend/CLI work, infra, or code with no user-visible surface.
---

# ui-ux-pro-max

A working designer's skill for shipping interfaces that look considered, behave well, and survive real users. Two flows — **BUILD** (you're making something) and **REVIEW** (you're critiquing existing UI). Both start the same way: ground yourself in the repo.

## Step 0 — Ground yourself in the repo (always)

Before writing or reviewing anything UI-shaped, spend 60 seconds learning the codebase's existing visual language. Skipping this is the single biggest cause of design drift.

1. **Detect the stack.** Check `package.json` (or equivalent) for the framework and styling system: Tailwind, CSS Modules, styled-components, vanilla-extract, Panda, Emotion, plain CSS, design-system package, etc.
2. **Find the design tokens.** Look for `tailwind.config.*`, `tokens.{ts,json,css}`, `theme.{ts,js}`, `:root { --... }` blocks, or a `design-system/` / `ui/` package. These define the legal vocabulary: spacing scale, color ramps, radii, shadows, type scale, breakpoints.
3. **Find canonical components.** `grep` for one common primitive (`Button`, `Input`, `Card`) to see how the team writes components — naming, prop shape, state handling, a11y attributes.
4. **Find existing pages of the same kind.** If building a settings page, open another settings page. If building a form, open another form. **Match the room you're in** before redecorating.

If any of these are missing (e.g. no token system), say so up front — proposing tokens is part of the work, not an assumption to silently make.

---

## Flow A — BUILD

Use when implementing new UI or extending existing UI.

### 1. Clarify the job before the pixels

A component is a small product. Before writing JSX/HTML, answer:

- **Who uses this and what are they trying to accomplish?** One sentence.
- **What's the primary action?** There is one. Everything else is secondary.
- **What states exist?** At minimum: default, hover, focus, active, disabled, loading, empty, error, success. Not every component needs all of these — but you should know which ones it does need.
- **What content extremes will it see?** A name field will get "Al" and "Bartholomew Reginald Vandermeer III". A list will be empty, have 1 item, and have 10,000. Design for both ends, not the demo case.
- **What's the smallest viable version?** Ship that. Then iterate.

If any of these are unclear from the task, ask before building.

### 2. Compose, don't reinvent

- Reuse existing primitives. If the repo has a `<Button>`, do not write a new `<button className="...">` — extend the existing one or add a variant.
- Honor the token system. No magic numbers for spacing, color, or radius. If `theme.spacing(2)` exists, use it. Inline hex codes and `padding: 13px` are smells.
- Match the existing naming and file layout. If components live in `src/components/{Name}/{Name}.tsx`, follow that.

### 3. Build the hierarchy first, then style

Before reaching for color or weight, get the **structural** hierarchy right. A well-structured page in default browser styles should still be readable. In order:

1. **Semantic HTML.** `<button>` for buttons, `<a>` for links, `<label>` tied to inputs, `<h1>`–`<h6>` in order, `<nav>`/`<main>`/`<footer>` landmarks, `<ul>`/`<ol>` for lists. Never `<div onClick>` when a button will do.
2. **Reading order.** The DOM order should match the visual order. Don't use CSS to reorder things sighted users read top-to-bottom but screen readers hear bottom-to-top.
3. **Grouping.** Related things go in the same container with consistent spacing. Unrelated things get more space between them. Proximity is the cheapest design tool you have.
4. **Then** apply typographic hierarchy (size, weight, color) and only then decorative styling (shadows, borders, gradients).

### 4. Spacing, rhythm, and alignment

- Use the token scale. Stick to 4px or 8px multiples (whichever the repo uses). Mixing 12px, 13px, 14px reads as sloppy even when users can't articulate why.
- **Outer space > inner space.** Padding inside a card should be smaller than the margin around it. Otherwise things float disconnected.
- **One alignment line per region.** Pick left-align or center-align and commit. Don't mix without reason.
- **Optical alignment beats mathematical alignment** for icons next to text — a perfect 16x16 icon often needs a 1px nudge. Trust your eye.

### 5. Color and contrast

- Use semantic tokens (`color.text.primary`, `color.surface.muted`), not raw palette values (`gray.700`), inside components.
- **Contrast ratios:** body text ≥ 4.5:1, large text (≥18px or 14px bold) ≥ 3:1, UI components and graphical objects ≥ 3:1. Use a checker, not vibes.
- Color is never the only signal. Error states need an icon or label, not just red. Required fields need a marker, not just a color.
- Test dark mode if the repo supports it. Don't just invert — re-pick colors.

### 6. Typography

- Stick to the repo's type scale. 2–3 sizes per screen is usually enough. More is noise.
- Line length 45–75 characters for body text. Constrain with `max-width`, not by breaking the layout.
- Line height: ~1.5 for body, ~1.2 for headings. Tighter as size grows.
- Numbers in tables: tabular figures (`font-variant-numeric: tabular-nums`) so columns align.

### 7. The states checklist (the part everyone forgets)

For every interactive component, explicitly handle:

- **Default** — the resting state.
- **Hover** — pointer over (skip on touch).
- **Focus** — keyboard-focused. **Never** `outline: none` without a replacement. Focus rings are not optional.
- **Active/pressed** — during click/tap.
- **Disabled** — both visually distinct (lower contrast, but still ≥ 3:1 against background) and `aria-disabled` or `disabled` set; never silently swallow clicks.
- **Loading** — skeleton, spinner, or progress. Disable the trigger. Keep layout stable (no layout shift when content arrives).
- **Empty** — first-use state. Explain what goes here and give the primary action. "No data" is not an empty state; it's a missed opportunity.
- **Error** — recoverable. Tell the user what went wrong in their language, and what to do next. Never just "Error" or "Something went wrong".
- **Success** — confirmation that the action worked, when it's not self-evident.

### 8. Responsive and fluid

- Design mobile-first if the repo does, desktop-first if it does. Don't fight the codebase.
- Use the repo's breakpoints. Don't invent new ones.
- Test at common widths: 360, 768, 1024, 1440. Also test at the awkward ones — 320 (small phone) and ~900 (split-screen).
- Prefer fluid sizing (`clamp()`, `%`, `fr`) over a stack of breakpoint overrides.
- Tap targets ≥ 44×44 px on touch.

### 9. Motion

- Default to **subtle and fast**. 150–250ms for most UI transitions. Anything > 400ms feels slow.
- Use easing, not linear. `ease-out` for entrances, `ease-in` for exits.
- **Respect `prefers-reduced-motion`.** Wrap non-essential motion in the media query.
- Motion should serve a purpose: indicate causality, draw attention to a change, or smooth a transition. Decorative motion is a tax.

### 10. Accessibility (non-negotiable floor)

- All interactive elements reachable and operable by keyboard. Tab order matches visual order.
- Visible focus indicator on everything focusable.
- All images have `alt` (empty `alt=""` for purely decorative).
- All form inputs have an associated `<label>` (not just placeholder text).
- Color contrast meets WCAG AA.
- Dynamic content updates announced via `aria-live` when appropriate.
- Modals: focus trapped, `Esc` closes, focus returns to trigger on close, background scroll locked, `role="dialog"` + `aria-labelledby`.
- Run an automated check (axe, Lighthouse) before claiming done. Automated checks catch ~30% of issues — they're necessary, not sufficient.

### 11. Microcopy

- Buttons are verbs that name the outcome: "Save changes", "Delete project", not "OK" / "Submit".
- Destructive actions name what's destroyed: "Delete 12 files" not "Confirm".
- Error messages: what happened, why (if useful), what to do next. No blame, no jargon.
- Empty states: one sentence of context + the primary action.
- Sentence case for UI text unless the repo uses Title Case consistently.

### 12. Before you call it done

Run the build, open the page in a browser, and:

- Tab through every interactive element. Can you reach everything? Is focus visible? Does Enter/Space work?
- Resize the window from 320px to 1920px. Anything overflow, wrap weirdly, or stack badly?
- Force the empty, loading, and error states. Do they look intentional, or like a bug?
- View it in dark mode if supported.
- Squint at the screen. Does the hierarchy still read? The thing you want the user to do — does it stand out?
- Read every word out loud. Anything that sounds like a developer wrote it goes back to the keyboard.

If you can't open a browser in this environment, **say so explicitly** instead of claiming the UI works. Type checks and unit tests do not verify design.

---

## Flow B — REVIEW

Use when critiquing existing UI — a PR, a screenshot, or code.

### 1. Read the intent first

- What is this surface for? Who's the user? What's the primary action?
- If you can't answer those from the diff or the surrounding code, ask. Reviewing in a vacuum produces generic feedback.

### 2. Look at the rendered result, not just the code

- If it's a PR: pull the branch, run it, look at it. If you can't run it, ask for screenshots at multiple viewports + the relevant states.
- Code review without rendered review misses ~half of UI bugs.

### 3. Walk the checklist, prioritized

Triage findings into three buckets — fix all of P0, most of P1, note P2 for later:

**P0 — Blockers (must fix before merge):**
- Accessibility violations (keyboard inaccessible, missing labels, contrast failures, focus trap broken)
- Broken states (no error handling, no loading state on async actions, layout shift)
- Inconsistent with existing design system (raw hex codes when tokens exist, custom button when `<Button>` exists)
- Mobile/responsive broken
- Destructive action without confirmation

**P1 — Strong suggestions:**
- Hierarchy unclear or competing for attention
- Spacing inconsistent with the rest of the app
- Microcopy unclear, blaming, or developer-flavored
- Hover/focus/active states missing or weak
- Motion too slow / missing `prefers-reduced-motion`
- Empty state is just blank or "No data"

**P2 — Polish:**
- Optical alignment nudges
- Slight typography tightening
- Subtle motion improvements
- Marginal contrast improvements above AA

### 4. Write feedback that's actionable

For every issue, give:

1. **What** — the specific problem, with a file path + line number.
2. **Why it matters** — the user impact, not just "this is wrong".
3. **A concrete suggestion** — code snippet or specific direction, not "make it better".

Example of bad feedback: *"The button styling feels off."*
Example of good feedback: *"`Button.tsx:42` — the disabled state uses `opacity: 0.5` which drops contrast to 2.1:1 against the surface. Use `color.text.disabled` from tokens (3.8:1) and keep opacity at 1."*

### 5. Praise what's right

If the hierarchy, microcopy, or state handling is well done, say so. Reviews that only list problems train people to ship less, not better.

---

## Anti-patterns to flag on sight

These are smells that almost always indicate something to fix:

- `outline: none` without a replacement focus style
- `<div>` or `<span>` with `onClick` (should be `<button>`)
- Placeholder used as label (`<input placeholder="Email">` with no `<label>`)
- Tooltip as the only label for an icon button (icon needs `aria-label`)
- Hard-coded colors in components when a token system exists
- Magic-number spacing (`margin: 13px`)
- Generic error messages ("Error", "Something went wrong", "Invalid input")
- "OK" / "Submit" / "Confirm" as the only button label on a destructive action
- `disabled` button with no explanation of why it's disabled
- Loading state that causes layout shift when content arrives
- Modal without focus trap or `Esc`-to-close
- Color as the only differentiator (red text with no icon, green dot with no label)
- New breakpoint added inline instead of using the system's breakpoints
- 8 font sizes on one screen
- Centered body text longer than one line

---

## Deliverable shape

When building, end your turn with: a short note on what was built, what states were handled, what you tested, and what you couldn't verify (e.g. "didn't open a browser in this env — please spot-check the focus styles").

When reviewing, end with: a prioritized list (P0 / P1 / P2), one concrete suggestion per item, and a one-line summary of what's working well.

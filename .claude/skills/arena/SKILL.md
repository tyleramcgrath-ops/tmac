---
name: arena
description: Pit two or more competing solutions to the same task against each other, judge them blind against a rubric, and ship the winner. Use when the user types /arena, asks for a "bake-off", "shootout", "head-to-head", or wants several approaches tried before picking one (a tricky bug fix, a refactor, a prompt, copy, a design direction). Not for tasks with one obvious answer.
argument-hint: "<task> [--contenders N] [--rubric \"a, b, c\"]"
---

# Arena

Run the same task several ways, judge the results without knowing who made
which, and keep the best one. The point is to beat the first idea, not to
generate busywork, so skip the arena when the answer is obvious.

## 1. Frame the bout

From the user's arguments, pin down:

- **Task**: one sentence saying what "done" means. If it is too vague to judge, ask once.
- **Contenders**: default 3, max 5. Each gets a *different strategy*, not the same prompt
  three times. Name the strategies up front (for example "minimal patch", "fix at the
  root", "rewrite the helper").
- **Rubric**: 3–5 criteria, weighted, that are checkable. Use `--rubric` if given. For code,
  default to: correct (tests pass, 40%), minimal diff (20%), fits the surrounding code
  (20%), no new risk (20%). For writing, default to: accurate, clear, on-voice, concise.
- **Hard gates**: things that disqualify outright (does not build, fails `pnpm test`,
  touches files outside scope, invents facts).

Tell the user the task, contenders, and rubric in a few lines, then start.

## 2. Run the contenders

Spawn one subagent per contender **in a single message** so they run in parallel.
For code, give each `isolation: "worktree"` so they cannot see or clobber each other.
Each prompt contains: the task, that contender's strategy, the hard gates, and
"report back: what you changed, why, and the exact commands you ran to verify".
Do not tell a contender about the others or the rubric weights.

## 3. Judge blind

1. Shuffle the results and relabel them **A, B, C…**. Keep the mapping to yourself
   until scoring is done.
2. Check the hard gates first by running them (build, lint, the repo's tests, e.g.
   `pnpm test` / `pnpm lint`). A contender that fails a gate is out; say why.
3. Score each survivor 1–5 per criterion with a one-line reason, and compute the weighted
   total. For large or subjective outputs, a separate judge subagent that only sees the
   labeled outputs and the rubric keeps you honest.
4. Tie-break on the smaller, simpler change.

## 4. Report and ship

Show a scorecard:

| | Strategy | Gates | Correct | Minimal | Fit | Risk | Total |
|---|---|---|---|---|---|---|---|

Then: the winner, why it won in two or three sentences, and anything worth stealing
from the runners-up. Apply the winner to the working tree (merge its worktree changes
or copy its output), fold in stolen ideas only if they are small and clearly better,
and re-run the gates on the final result. Clean up losing worktrees.

Never declare a winner that failed a gate. If everything failed, say so plainly, show
what each attempt learned, and propose the next round instead of shipping.

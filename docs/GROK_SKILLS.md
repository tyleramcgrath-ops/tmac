# Grok skills setup

First-party agent skills authored in this repo live in `skills/`. Each skill is a
directory containing a `SKILL.md` (plus any helper scripts it needs).

Grok loads skills from two places: `.grok/skills/` next to the project, and
`~/.grok/skills/` for every project on the machine. Rather than copying skills into
those directories, we symlink them, so editing `skills/<name>/SKILL.md` in a branch
immediately changes what the agent reads.

`skills/` is separate from `.agents/skills/`, which holds the vendored HyperFrames
pack tracked by `skills-lock.json`. Don't hand-edit anything under `.agents/skills/`;
it is overwritten on the next skill-pack install.

## Quick start

```bash
./scripts/setup-grok-skills.sh
```

That links every skill in `skills/` into both scopes. Variations:

```bash
./scripts/setup-grok-skills.sh --project        # .grok/skills only
./scripts/setup-grok-skills.sh --global         # ~/.grok/skills only
./scripts/setup-grok-skills.sh remove-ai-marks  # a single skill by name
```

Or via pnpm:

```bash
pnpm skills:grok
```

Re-running is safe. Existing symlinks are repointed at the current checkout. If a
real directory is sitting where a symlink should go, the script says so and exits
non-zero instead of writing into it.

`.grok/` is gitignored, so the project-local links are per-clone. Run the script
once after cloning, and again if you move the checkout (the symlinks are absolute).

## Doing it by hand

```bash
# project-local
mkdir -p .grok/skills
ln -sfn "$(pwd)/skills/remove-ai-marks" .grok/skills/remove-ai-marks

# user-global
mkdir -p ~/.grok/skills
ln -sfn "$(pwd)/skills/remove-ai-marks" ~/.grok/skills/remove-ai-marks
```

## Available skills

### `remove-ai-marks`

Strips the tells that make text read as machine-generated (em-dash overuse,
`it's not just X, it's Y`, filler transitions, LLM vocabulary, templated bullet
lists, invisible characters) without changing what the text says. Useful on
generated blog posts, marketing copy, changelogs, and PR descriptions before they
ship.

It ships a scanner for the mechanical tells, usable on its own:

```bash
node skills/remove-ai-marks/scripts/scan.mjs path/to/post.md        # report
node skills/remove-ai-marks/scripts/scan.mjs --fix path/to/post.md  # strip invisibles
```

The scanner reports line-numbered hits and exits non-zero when it finds any, so it
works in a pre-publish check. Wording tells are checked in prose only, skipping code
fences, indented code, inline code spans, and block quotes. Invisible characters are
hunted everywhere, code included: a hidden payload ships regardless of what it is
nested inside. Structural tells (rule-of-three padding, symmetric bullets, sections
that restate their own heading) need a reader; the skill covers those.

`--fix` strips the invisible class: zero-width and format controls, soft hyphens,
bidi controls, variation selectors, and the Unicode Tags block (U+E0000–U+E007F),
which can carry an arbitrary hidden payload. Emoji joiners and presentation
selectors are preserved, and no-break spaces become ordinary spaces.

## Runtime enforcement

The skill covers text you are authoring by hand. Content this app generates is
cleaned automatically by `lib/strip-invisible.ts`, applied at every point where
model output leaves the system:

| Path | What it emits |
| --- | --- |
| `app/api/forge/rewrite/route.ts` | SEO title, meta description, JSON-LD deployed to WordPress |
| `app/api/projects/[projectId]/content/route.ts` | Blog post drafts, cleaned before they are stored |
| `app/api/forge/route.ts` | Streamed chat text, cleaned in flight |
| `app/api/errors/route.ts` | Error explanations |
| `ai/tools/generate-files/get-contents.ts` | Files written into the sandbox |

`app/api/chat/route.ts` is not covered. It emits a structured UI message stream
with tool-call parts, so sanitizing it needs a different hook than the others.

`tests/strip-invisible.test.ts` covers both implementations and asserts they agree,
since the skill's scanner carries its own copy of the character set to stay portable
to other repos.

Statistical watermarking, carried in word choice rather than in the bytes, is
outside what any of this can do. So is metadata in non-text formats: image C2PA /
content credentials, EXIF, PDF producer fields, Office document properties.

## Adding a skill

1. Create `skills/<name>/SKILL.md` with `name` and `description` frontmatter. The
   description is what the agent matches on, so say what the skill does and when to
   use it.
2. Run `./scripts/setup-grok-skills.sh <name>`.
3. Commit `skills/<name>/`. The symlinks are generated and stay out of git.

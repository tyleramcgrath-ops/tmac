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
node skills/remove-ai-marks/scripts/scan.mjs path/to/post.md
```

The scanner reports line-numbered hits and exits non-zero when it finds any, so it
works in a pre-publish check. It skips code fences, indented code, inline code
spans, and block quotes. Structural tells (rule-of-three padding, symmetric
bullets, sections that restate their own heading) need a reader; the skill covers
those.

## Adding a skill

1. Create `skills/<name>/SKILL.md` with `name` and `description` frontmatter. The
   description is what the agent matches on, so say what the skill does and when to
   use it.
2. Run `./scripts/setup-grok-skills.sh <name>`.
3. Commit `skills/<name>/`. The symlinks are generated and stay out of git.

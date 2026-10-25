# ECC — vendored bundle

## Source

- Upstream: https://github.com/affaan-m/ECC
- Commit: `2c0d226439ec14c60f509561386caba2a9ac7619`
- Plugin: `ecc@ecc` (v2.0.0-rc.1)
- Author: Affaan Mustafa <me@affaanmustafa.com>
- License: **MIT** (see `LICENSE` in this directory)

## What's vendored here

| Path | What | Upstream source |
|---|---|---|
| `skills/` | 232 skill directories | `/skills` (root of upstream) |
| `agents/` | 60 subagent definitions | `/agents` |
| `commands/` | 75 slash-command shims | `/commands` |
| `rules/` | 19 language/topic rule sets | `/rules` |
| `marketplace.json` | Plugin marketplace manifest | `/.claude-plugin/marketplace.json` |
| `LICENSE` | Upstream MIT license | `/LICENSE` |

## What's intentionally NOT vendored

| Path | Why excluded |
|---|---|
| `hooks/`, `hooks/memory-persistence/` | Hooks modify session behavior. Skipped per install-time decision; opt in later by copying + wiring into `.claude/settings.json`. |
| `.mcp.json` | Adds 6 MCP servers (github, context7, exa, memory, playwright, sequential-thinking) — some require API keys, some need Chromium. Skipped to keep tmac sessions unchanged. |
| `.codex/`, `.codex-plugin/`, `.cursor/`, `.gemini/`, `.kiro/`, `.opencode/`, `.qwen/`, `.trae/`, `.zed/`, `.codebuddy/`, `.agents/` | Distributions for other agent harnesses; not relevant to Claude Code. |
| `.claude/` (upstream) | Upstream had its own `.claude/` distribution; that would have merged into tmac's top-level `.claude/`. Kept everything under `.claude/ecc/` instead to namespace and prevent unintended overrides. |
| `scripts/`, `tests/`, `contexts/`, `examples/`, `mcp-configs/`, repo-level config files | Build / test / dev artifacts. |

## Status: vendored but NOT auto-active

The skills here live under `.claude/ecc/skills/`, **not** under `.claude/skills/`. The Claude Code harness only auto-discovers skills in `.claude/skills/<name>/SKILL.md`. So ECC's 232 skills are present in the repo as a reference library, but they do **not** automatically surface in sessions.

To promote a specific ECC skill to live status, copy or symlink it into `.claude/skills/`:

```bash
cp -r .claude/ecc/skills/<skill-name> .claude/skills/<skill-name>
```

The same applies to `agents/`, `commands/`, and `rules/`.

## Upgrading

To refresh against a newer upstream:

```bash
git clone --depth 1 https://github.com/affaan-m/ECC.git /tmp/ecc-upgrade
rm -rf .claude/ecc/{skills,agents,commands,rules}
cp -r /tmp/ecc-upgrade/{skills,agents,commands,rules} .claude/ecc/
cp /tmp/ecc-upgrade/.claude-plugin/marketplace.json .claude/ecc/marketplace.json
# Update the commit SHA above
```

# Attribution & Caveats

## Source

- Repo: https://github.com/tenfoldmarc/website-builder-setup
- Upstream commit: `83d94dac66b90b1da37152084ac671989379b692`
- Author: [@tenfoldmarc](https://instagram.com/tenfoldmarc)

## License

**Upstream repo ships no LICENSE file.** Under default copyright, "all rights reserved" applies. The author's README invites installation via the phrase "Install this skill for me: <URL>", which signals consent for personal use, but explicit permission for re-hosting was not obtained.

If the upstream author adds a LICENSE later, update this file.

## Environment caveats

This skill was designed for **desktop Claude Code** (Mac/Windows). Several of its steps do not work as written in Claude Code on the web sessions:

- `npm install -g uipro-cli` — global installs in cloud containers are ephemeral; they vanish at session end.
- `uipro init --ai claude` — expects to mutate a local Claude config.
- `~/.claude.json` MCP server registration — cloud sessions don't use that file for MCP configuration.
- "Restart Claude Code" — not applicable in web sessions.

The skill is still safe to trigger in a cloud session (it won't damage anything), but Steps 2–4 will produce no lasting effect.

## Third-party dependencies

When this skill runs, it will:

1. Globally install `uipro-cli` from npm (third-party CLI by the same author; no security audit).
2. Install `framer-motion` into the current project's `package.json`.
3. Prompt the user for a **21st.dev API key** (requires a free account at https://21st.dev/magic/console) and write it into the Claude config under an `mcpServers.21st-dev-magic` entry that runs `npx -y @21st-dev/magic@latest`.

Users invoking this skill should be aware they're installing third-party tooling and granting a third-party MCP server access to their Claude session.

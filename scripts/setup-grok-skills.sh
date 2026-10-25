#!/usr/bin/env bash
# Expose this repo's skills/ directory to Grok by symlinking each skill into the
# project-local (.grok/skills) and user-global (~/.grok/skills) skill directories.
#
#   scripts/setup-grok-skills.sh                 # both scopes, every skill
#   scripts/setup-grok-skills.sh --project       # .grok/skills only
#   scripts/setup-grok-skills.sh --global        # ~/.grok/skills only
#   scripts/setup-grok-skills.sh remove-ai-marks # one skill by name
#
# Re-running is safe: existing symlinks are repointed, and a real directory
# already sitting in the way is reported rather than clobbered.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILLS_DIR="$REPO_ROOT/skills"

do_project=1
do_global=1
names=()

for arg in "$@"; do
  case "$arg" in
    --project) do_global=0 ;;
    --global) do_project=0 ;;
    -h|--help) awk 'NR>1 && /^#/ {sub(/^# ?/, ""); print; next} NR>1 {exit}' "${BASH_SOURCE[0]}"; exit 0 ;;
    -*) echo "unknown option: $arg" >&2; exit 2 ;;
    *) names+=("$arg") ;;
  esac
done

if [ ! -d "$SKILLS_DIR" ]; then
  echo "no skills directory at $SKILLS_DIR" >&2
  exit 1
fi

if [ ${#names[@]} -eq 0 ]; then
  for dir in "$SKILLS_DIR"/*/; do
    [ -f "$dir/SKILL.md" ] && names+=("$(basename "$dir")")
  done
fi

if [ ${#names[@]} -eq 0 ]; then
  echo "no skills found in $SKILLS_DIR (a skill is a directory containing SKILL.md)" >&2
  exit 1
fi

link_skill() {
  local scope_dir="$1" name="$2" src="$SKILLS_DIR/$2" dest="$1/$2"

  if [ ! -f "$src/SKILL.md" ]; then
    echo "  ✗ $name — no $src/SKILL.md" >&2
    return 1
  fi

  # ln -sfn would nest the link inside a real directory instead of replacing it.
  if [ -d "$dest" ] && [ ! -L "$dest" ]; then
    echo "  ✗ $name — $dest is a real directory; move it aside first" >&2
    return 1
  fi

  mkdir -p "$scope_dir"
  ln -sfn "$src" "$dest"
  echo "  ✓ $dest -> $src"
}

status=0
if [ "$do_project" -eq 1 ]; then
  echo "project-local (.grok/skills):"
  for name in "${names[@]}"; do link_skill "$REPO_ROOT/.grok/skills" "$name" || status=1; done
fi

if [ "$do_global" -eq 1 ]; then
  echo "user-global (~/.grok/skills):"
  for name in "${names[@]}"; do link_skill "$HOME/.grok/skills" "$name" || status=1; done
fi

exit "$status"

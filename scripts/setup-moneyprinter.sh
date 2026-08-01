#!/usr/bin/env bash
# Clones FujiwaraChoki/MoneyPrinterV2 and prepares a local Python environment
# for it, next to (but not inside) this repo. See docs/MONEYPRINTER_SETUP.md
# for details and manual steps.
set -euo pipefail

REPO_URL="https://github.com/FujiwaraChoki/MoneyPrinterV2.git"
TARGET_DIR="${1:-../MoneyPrinterV2}"

if [ -d "$TARGET_DIR" ]; then
  echo "→ $TARGET_DIR already exists, skipping clone"
else
  echo "→ cloning $REPO_URL into $TARGET_DIR"
  git clone "$REPO_URL" "$TARGET_DIR"
fi

cd "$TARGET_DIR"

if [ ! -f config.json ]; then
  echo "→ copying config.example.json to config.json"
  cp config.example.json config.json
  echo "  fill in the values in $TARGET_DIR/config.json before running MoneyPrinterV2"
fi

if [ ! -d venv ]; then
  echo "→ creating virtual environment"
  python -m venv venv
fi

echo "→ installing requirements"
# shellcheck disable=SC1091
source venv/bin/activate
pip install -r requirements.txt

echo "→ done. Activate the environment with: source $TARGET_DIR/venv/bin/activate"

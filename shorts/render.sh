#!/usr/bin/env bash
set -e

DATA="${1:-data.json}"
OUTPUT="${2:-out/short.mp4}"

echo "🎬 YouTube Shorts Renderer"
echo "   Data:   $DATA"
echo "   Output: $OUTPUT"
echo ""

# Install deps if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies…"
  npm install
fi

node render.mjs "$DATA" "$OUTPUT"

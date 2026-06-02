/**
 * Render script — run with: node render.mjs [data.json path] [output.mp4 path]
 *
 * Usage:
 *   node render.mjs                          → renders data.json → out/short.mp4
 *   node render.mjs my-data.json out/ep2.mp4 → custom paths
 */

import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { createRequire } from "module";
import { readFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const dataPath = resolve(process.argv[2] ?? "data.json");
const outputPath = resolve(process.argv[3] ?? "out/short.mp4");

const data = JSON.parse(readFileSync(dataPath, "utf-8"));

// Auto-compute duration from data
const fps = 30;
const listStart = Math.round(fps * 1.5);
const itemDuration = Math.round(fps * 1.2);
const durationInFrames = Math.min(
  listStart + data.items.length * itemDuration + fps * 2,
  fps * 60
);

console.log(`📦 Bundling…`);
const bundled = await bundle({
  entryPoint: resolve(__dirname, "src/Root.tsx"),
  // Webpack alias so require("../data.json") resolves to the passed file
  webpackOverride: (config) => config,
});

console.log(`🎬 Selecting composition (${durationInFrames} frames @ ${fps}fps)…`);
const composition = await selectComposition({
  serveUrl: bundled,
  id: "ListicleShort",
  inputProps: { data },
});

// Override duration from data
composition.durationInFrames = durationInFrames;

mkdirSync(dirname(outputPath), { recursive: true });

console.log(`🖥  Rendering → ${outputPath}`);
await renderMedia({
  composition,
  serveUrl: bundled,
  codec: "h264",
  outputLocation: outputPath,
  inputProps: { data },
  onProgress: ({ progress }) => {
    process.stdout.write(`\r  ${(progress * 100).toFixed(1)}%`);
  },
});

console.log(`\n✅ Done! → ${outputPath}`);
console.log(`\n📋 Copy this description:\n`);
console.log(data.description);

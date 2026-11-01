#!/usr/bin/env node
/**
 * Post-processes a Next.js static export for plain static hosts (GitHub Pages).
 *
 * Next 16 writes per-segment prefetch payloads as nested folders, e.g.
 *   out/pricing/__next.!KHNpdGUp/pricing/__PAGE__.txt
 * but the client router requests them as one dotted file name:
 *   out/pricing/__next.!KHNpdGUp.pricing.__PAGE__.txt
 * A static host can't map one to the other, so client navigations 404 and fall back to full
 * page loads. This writes the dotted copies alongside the nested originals.
 *
 *   node scripts/flatten-export-segments.mjs [outDir]
 */
import { copyFileSync, existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const out = path.resolve(process.argv[2] ?? "out");
if (!existsSync(out)) {
  console.error(`No export found at ${out}`);
  process.exit(1);
}

let written = 0;

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (!statSync(full).isDirectory()) continue;
    if (name.startsWith("__next.")) flatten(dir, full, name);
    else walk(full);
  }
}

/** Copies every file under `segDir` to `<pageDir>/<segName>.<relative parts joined by ".">`. */
function flatten(pageDir, segDir, segName) {
  const stack = [segDir];
  while (stack.length) {
    const d = stack.pop();
    for (const name of readdirSync(d)) {
      const full = path.join(d, name);
      if (statSync(full).isDirectory()) {
        stack.push(full);
        continue;
      }
      const rel = path.relative(segDir, full).split(path.sep).join(".");
      const target = path.join(pageDir, `${segName}.${rel}`);
      if (!existsSync(target)) {
        copyFileSync(full, target);
        written++;
      }
    }
  }
}

walk(out);
console.log(`Flattened ${written} segment payload(s) in ${out}`);

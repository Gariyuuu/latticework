/**
 * Writes content/<slug>/metadata.json for every catalog entry that isn't
 * separately hand-authored with real lessons (currently just "python").
 * Safe to re-run — it only ever writes metadata.json, never touches a
 * modules/ directory that might have real content in it.
 */
import fs from "node:fs";
import path from "node:path";
import { CATALOG } from "./skill-catalog";

const HAND_AUTHORED = new Set(["python"]);
const CONTENT_ROOT = path.join(process.cwd(), "content");

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

let written = 0;
for (const entry of CATALOG) {
  if (HAND_AUTHORED.has(entry.slug)) continue;

  const dir = path.join(CONTENT_ROOT, entry.slug);
  fs.mkdirSync(dir, { recursive: true });

  const metadata = {
    slug: entry.slug,
    name: entry.name,
    category: entry.category,
    difficulty: entry.difficulty,
    estimatedHours: entry.hours,
    prerequisites: entry.prereqs ?? [],
    usefulFor: entry.usefulFor ?? [],
    status: "skeleton",
    modules: entry.modules.map((title) => ({
      slug: slugifyTitle(title),
      title,
      status: "planned",
    })),
  };

  fs.writeFileSync(path.join(dir, "metadata.json"), JSON.stringify(metadata, null, 2) + "\n");
  written++;
}

console.log(`[generate-skeletons] wrote ${written} skeleton metadata.json files (skipped: ${[...HAND_AUTHORED].join(", ")})`);

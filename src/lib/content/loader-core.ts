import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import {
  skillMetadataSchema,
  lessonFrontmatterSchema,
  testCaseFileSchema,
  type SkillMetadata,
  type LessonFrontmatter,
  type TestCaseFile,
} from "./schema";

const CONTENT_ROOT = path.join(process.cwd(), "content");

function safeReadDir(dir: string): string[] {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
}

/** Every skill in the catalog — built or skeleton — read from /content. */
export function listSkillSlugs(): string[] {
  return safeReadDir(CONTENT_ROOT).filter((entry) =>
    fs.existsSync(path.join(CONTENT_ROOT, entry, "metadata.json"))
  );
}

export function getSkillMetadata(slug: string): SkillMetadata | null {
  const file = path.join(CONTENT_ROOT, slug, "metadata.json");
  if (!fs.existsSync(file)) return null;
  const raw = JSON.parse(fs.readFileSync(file, "utf-8"));
  return skillMetadataSchema.parse(raw);
}

export function listAllSkills(): SkillMetadata[] {
  return listSkillSlugs()
    .map(getSkillMetadata)
    .filter((s): s is SkillMetadata => s !== null);
}

export function listLessonSlugs(skillSlug: string): string[] {
  const dir = path.join(CONTENT_ROOT, skillSlug, "modules");
  return safeReadDir(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

export interface LessonSource {
  frontmatter: LessonFrontmatter;
  content: string;
}

export function getLessonSource(skillSlug: string, lessonSlug: string): LessonSource | null {
  const file = path.join(CONTENT_ROOT, skillSlug, "modules", `${lessonSlug}.mdx`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf-8");
  const { data, content } = matter(raw);
  return { frontmatter: lessonFrontmatterSchema.parse(data), content };
}

export function getExerciseTestCases(skillSlug: string, testCasesId: string): TestCaseFile | null {
  const file = path.join(CONTENT_ROOT, skillSlug, "exercises", `${testCasesId}.json`);
  if (!fs.existsSync(file)) return null;
  const raw = JSON.parse(fs.readFileSync(file, "utf-8"));
  return testCaseFileSchema.parse(raw);
}

/** Flat dependency edge list across the whole catalog — powers the skill graph. */
export function getDependencyEdges(): { from: string; to: string }[] {
  return listAllSkills().flatMap((s) => s.prerequisites.map((p) => ({ from: p, to: s.slug })));
}

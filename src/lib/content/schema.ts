import { z } from "zod";

export const CATEGORIES = [
  "language",
  "web",
  "database",
  "ai-ml",
  "data-science",
  "quant",
  "cs",
  "devops",
  "cloud",
  "math",
  "tooling",
] as const;

export const DIFFICULTIES = ["intro", "beginner", "intermediate", "advanced"] as const;

export const moduleOutlineSchema = z.object({
  slug: z.string(),
  title: z.string(),
  status: z.enum(["built", "planned"]).default("planned"),
});

export const skillMetadataSchema = z.object({
  slug: z.string(),
  name: z.string(),
  category: z.enum(CATEGORIES),
  difficulty: z.enum(DIFFICULTIES),
  estimatedHours: z.number().positive(),
  prerequisites: z.array(z.string()).default([]),
  usefulFor: z.array(z.string()).default([]),
  status: z.enum(["built", "skeleton"]).default("skeleton"),
  description: z.string().optional(),
  modules: z.array(moduleOutlineSchema).default([]),
});

export type SkillMetadata = z.infer<typeof skillMetadataSchema>;

export const blockFrontmatterSchema = z.object({
  id: z.string(),
  type: z.enum([
    "explanation",
    "codeExample",
    "exercise",
    "quiz",
    "checkpoint",
    "visualization",
    "projectStep",
  ]),
  language: z.string().optional(),
  exerciseType: z
    .enum([
      "write-code",
      "fill-blank",
      "fix-bug",
      "predict-output",
      "code-ordering",
      "multiple-choice",
      "sql-query",
      "refactor",
      "performance",
    ])
    .optional(),
  testCasesId: z.string().optional(),
  difficulty: z.enum(DIFFICULTIES).default("beginner"),
  prompt: z.string().optional(),
  question: z.string().optional(),
  options: z.array(z.string()).optional(),
  answer: z.number().optional(),
  concept: z.string().optional(),
});

export const lessonFrontmatterSchema = z.object({
  slug: z.string(),
  title: z.string(),
  estimatedMinutes: z.number().positive().default(10),
  blocks: z.array(blockFrontmatterSchema),
});

export type LessonFrontmatter = z.infer<typeof lessonFrontmatterSchema>;
export type BlockFrontmatter = z.infer<typeof blockFrontmatterSchema>;

export const testCaseFileSchema = z.object({
  id: z.string(),
  type: z.literal("write-code"),
  language: z.string(),
  starterCode: z.string(),
  /** Pyodide package names to load before running (e.g. ["numpy"]) — see
   * src/lib/sandbox/providers/pyodide-provider.ts. Omit for pure-language
   * exercises that need nothing beyond the stdlib. */
  packages: z.array(z.string()).optional(),
  cases: z.array(
    z.object({
      call: z.string(),
      expect: z.string(),
    })
  ),
});

export type TestCaseFile = z.infer<typeof testCaseFileSchema>;

/** Stable, deterministic exercise slug — computed identically at content-sync
 * time (DB seed) and at render time (client submission), so the client never
 * needs to know a database UUID. */
export function exerciseSlugFor(skillSlug: string, lessonSlug: string, blockId: string): string {
  return `${skillSlug}--${lessonSlug}--${blockId}`;
}

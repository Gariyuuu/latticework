import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { requireLocalUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db/client";
import { exercises, hintUsage } from "@/lib/db/schema";
import { getAIChatCompletion } from "@/lib/ai/provider";

const bodySchema = z.object({
  exerciseSlug: z.string(),
  prompt: z.string().optional(),
  code: z.string(),
  level: z.number().int().min(1).max(4),
});

// Hint ladder — brief §35: hints get progressively more concrete but never
// hand over a full solution outright (that's a separate "reveal" action,
// tracked in ROADMAP.md as planned — it needs an authored canonical
// solution per exercise, which the content schema doesn't carry yet).
const LEVEL_INSTRUCTIONS: Record<number, string> = {
  1: "Give a short conceptual hint about what idea or concept is relevant. Do not mention code, syntax, or specific function names.",
  2: "Give a directional hint: what general approach or strategy should the learner try. Still no code or exact syntax.",
  3: "Give pseudocode-level guidance: describe the steps in plain language close to code structure, but write no real code.",
  4: "Give a partial-solution hint: you may show a small code fragment or fix one specific bug, but do not give the complete working solution.",
};

export async function POST(req: NextRequest) {
  const user = await requireLocalUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { exerciseSlug, prompt, code, level } = parsed.data;

  const exercise = await db.query.exercises.findFirst({ where: eq(exercises.slug, exerciseSlug) });

  if (exercise) {
    const already = await db.query.hintUsage.findFirst({
      where: and(eq(hintUsage.userId, user.id), eq(hintUsage.exerciseId, exercise.id), eq(hintUsage.level, level)),
    });
    if (!already) {
      await db.insert(hintUsage).values({ userId: user.id, exerciseId: exercise.id, level });
    }
  }

  const hint = await getAIChatCompletion([
    {
      role: "system",
      content:
        "You are an encouraging coding tutor inside an interactive learning platform called Latticework. " +
        "A learner is stuck on an exercise. " +
        LEVEL_INSTRUCTIONS[level] +
        " Keep the response to 2-3 sentences.",
    },
    {
      role: "user",
      content: `Exercise prompt: ${prompt ?? "(not provided)"}\n\nLearner's current code:\n${code}`,
    },
  ]);

  return NextResponse.json({
    hint,
    configured: hint !== null,
  });
}

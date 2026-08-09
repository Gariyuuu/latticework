import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { requireLocalUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db/client";
import { assessments, assessmentAttempts } from "@/lib/db/schema";

const bodySchema = z.object({
  assessmentSlug: z.string(),
  topics: z.array(z.string()),
  detectedLevels: z.record(z.string(), z.number()),
  score: z.number(),
});

/** Records a diagnostic attempt — brief §23. Only the Python diagnostic is
 * implemented today (see onboarding); other topics are Planned per
 * ROADMAP.md, so their detectedLevels entries simply won't exist yet. */
export async function POST(req: NextRequest) {
  const user = await requireLocalUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { assessmentSlug, topics, detectedLevels, score } = parsed.data;

  if (!process.env.DATABASE_URL) return NextResponse.json({ ok: false, synced: false });

  let assessment = await db.query.assessments.findFirst({ where: eq(assessments.slug, assessmentSlug) });
  if (!assessment) {
    [assessment] = await db
      .insert(assessments)
      .values({ slug: assessmentSlug, title: "Onboarding diagnostic", type: "diagnostic", topics })
      .returning();
  }

  await db.insert(assessmentAttempts).values({
    userId: user.id,
    assessmentId: assessment.id,
    detectedLevels,
    score,
  });

  return NextResponse.json({ ok: true });
}

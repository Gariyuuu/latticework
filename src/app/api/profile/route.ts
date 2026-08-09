import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { requireLocalUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { CAREER_TRACKS } from "@/lib/roadmap/tracks";

const bodySchema = z.object({
  careerGoal: z.enum(CAREER_TRACKS.map((t) => t.slug) as [string, ...string[]]).optional(),
  experienceLevel: z.enum(["new", "some", "cs-student", "intermediate", "advanced"]).optional(),
  dailyGoalMinutes: z.number().int().positive().max(480).optional(),
  editorTheme: z.string().optional(),
  appTheme: z.string().optional(),
  aiTutorEnabled: z.boolean().optional(),
  markOnboarded: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const user = await requireLocalUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { markOnboarded, ...rest } = parsed.data;

  await db
    .insert(profiles)
    .values({ userId: user.id, ...rest, onboardedAt: markOnboarded ? new Date() : undefined })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: { ...rest, ...(markOnboarded ? { onboardedAt: new Date() } : {}) },
    });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const user = await requireLocalUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await db.query.profiles.findFirst({ where: eq(profiles.userId, user.id) });
  return NextResponse.json({ profile });
}

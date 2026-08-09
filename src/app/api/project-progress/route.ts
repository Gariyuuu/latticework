import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { requireLocalUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db/client";
import { projectProgress, projects } from "@/lib/db/schema";
import { XP, awardXP } from "@/lib/scoring/xp";
import { recomputeSkillRating } from "@/lib/scoring/mastery";

const bodySchema = z.object({
  projectSlug: z.string(),
  milestoneId: z.string(),
  complete: z.boolean(),
});

export async function POST(req: NextRequest) {
  const user = await requireLocalUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { projectSlug, milestoneId, complete } = parsed.data;

  const project = await db.query.projects.findFirst({ where: eq(projects.slug, projectSlug) });
  if (!project) return NextResponse.json({ xpAwarded: 0, synced: false });

  const existing = await db.query.projectProgress.findFirst({
    where: and(eq(projectProgress.userId, user.id), eq(projectProgress.projectId, project.id)),
  });
  const current = new Set(existing?.completedMilestones ?? []);
  const wasComplete = current.has(milestoneId);
  if (complete) current.add(milestoneId);
  else current.delete(milestoneId);

  const completedMilestones = Array.from(current);
  const status = completedMilestones.length >= (project.milestones ?? []).length ? "completed" : "in-progress";

  await db
    .insert(projectProgress)
    .values({ userId: user.id, projectId: project.id, status, completedMilestones })
    .onConflictDoUpdate({
      target: [projectProgress.userId, projectProgress.projectId],
      set: { status, completedMilestones, updatedAt: new Date() },
    });

  let xpAwarded = 0;
  if (complete && !wasComplete) {
    xpAwarded = await awardXP(user.id, XP.projectMilestone, "project-milestone", milestoneId);
  }

  if (project.skillId) await recomputeSkillRating(user.id, project.skillId);

  return NextResponse.json({ xpAwarded, status });
}

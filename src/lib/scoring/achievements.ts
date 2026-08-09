import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { achievements, submissions, streaks, userAchievements } from "@/lib/db/schema";

export { ACHIEVEMENT_CATALOG } from "./achievement-catalog";

async function unlock(userId: string, slug: string) {
  const achievement = await db.query.achievements.findFirst({ where: eq(achievements.slug, slug) });
  if (!achievement) return null;
  const already = await db.query.userAchievements.findFirst({
    where: and(eq(userAchievements.userId, userId), eq(userAchievements.achievementId, achievement.id)),
  });
  if (already) return null;
  await db.insert(userAchievements).values({ userId, achievementId: achievement.id });
  return achievement;
}

/** Called after a passed submission; returns any newly-unlocked achievements. */
export async function checkSubmissionAchievements(userId: string) {
  const unlocked = [];

  const passedCount = await db.query.submissions.findMany({
    where: and(eq(submissions.userId, userId), eq(submissions.passed, true)),
  });
  if (passedCount.length === 1) {
    const a = await unlock(userId, "hello-world");
    if (a) unlocked.push(a);
  }

  const hour = new Date().getHours();
  if (hour >= 0 && hour < 4) {
    const a = await unlock(userId, "night-compiler");
    if (a) unlocked.push(a);
  }

  return unlocked;
}

export async function checkStreakAchievements(userId: string) {
  const streak = await db.query.streaks.findFirst({ where: eq(streaks.userId, userId) });
  if (!streak) return [];
  const unlocked = [];
  if (streak.currentLength >= 100) {
    const a = await unlock(userId, "100-days");
    if (a) unlocked.push(a);
  }
  return unlocked;
}

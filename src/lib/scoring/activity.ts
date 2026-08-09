import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { activity, streaks } from "@/lib/db/schema";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / (24 * 60 * 60 * 1000));
}

/** Records one unit of learning activity and updates the streak — brief
 * §24/§28: missing a day never wipes months of progress, freezes absorb a
 * gap of exactly one day automatically. */
export async function recordActivity(userId: string, delta: { exercisesCompleted?: number; minutesLearned?: number }) {
  const today = todayKey();

  await db
    .insert(activity)
    .values({
      userId,
      date: today,
      exercisesCompleted: delta.exercisesCompleted ?? 0,
      minutesLearned: delta.minutesLearned ?? 0,
    })
    .onConflictDoUpdate({
      target: [activity.userId, activity.date],
      set: {
        exercisesCompleted: sql`${activity.exercisesCompleted} + ${delta.exercisesCompleted ?? 0}`,
        minutesLearned: sql`${activity.minutesLearned} + ${delta.minutesLearned ?? 0}`,
      },
    });

  const streak = await db.query.streaks.findFirst({ where: eq(streaks.userId, userId) });
  if (!streak) {
    await db.insert(streaks).values({ userId, currentLength: 1, longestLength: 1, lastActiveDate: today });
    return;
  }
  if (streak.lastActiveDate === today) return; // already counted today

  const gap = streak.lastActiveDate ? daysBetween(streak.lastActiveDate, today) : 1;
  let currentLength = streak.currentLength;
  let freezesAvailable = streak.freezesAvailable;

  if (gap === 1) {
    currentLength += 1;
  } else if (gap === 2 && freezesAvailable > 0) {
    // One missed day, absorbed by a freeze — streak continues.
    currentLength += 1;
    freezesAvailable -= 1;
  } else {
    currentLength = 1;
  }

  await db
    .update(streaks)
    .set({
      currentLength,
      longestLength: Math.max(streak.longestLength, currentLength),
      freezesAvailable,
      lastActiveDate: today,
    })
    .where(eq(streaks.userId, userId));
}

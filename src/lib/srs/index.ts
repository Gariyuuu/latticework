import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { reviewItems } from "@/lib/db/schema";

const MIN_EASE = 1.3;

/** SM-2-inspired scheduler — see docs/LEARNING_ENGINE.md "Spaced repetition
 * (SRS)". Correct answers push the interval out; incorrect answers reset it
 * short so the concept resurfaces soon in Daily Forge / Weak Skills. */
export async function recordReviewOutcome(userId: string, concept: string, correct: boolean) {
  const existing = await db.query.reviewItems.findFirst({
    where: and(eq(reviewItems.userId, userId), eq(reviewItems.concept, concept)),
  });

  const prevInterval = existing?.intervalDays ?? 1;
  const prevEase = existing?.easeFactor ?? 2.5;
  const prevStreak = existing?.consecutiveCorrect ?? 0;

  const easeFactor = correct
    ? Math.max(MIN_EASE, prevEase + 0.1)
    : Math.max(MIN_EASE, prevEase - 0.2);
  const intervalDays = correct ? Math.max(1, Math.round(prevInterval * easeFactor)) : 1;
  const consecutiveCorrect = correct ? prevStreak + 1 : 0;
  const dueAt = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);

  await db
    .insert(reviewItems)
    .values({ userId, concept, intervalDays, easeFactor, consecutiveCorrect, dueAt })
    .onConflictDoUpdate({
      target: [reviewItems.userId, reviewItems.concept],
      set: { intervalDays, easeFactor, consecutiveCorrect, dueAt },
    });
}

export async function getDueReviews(userId: string, limit = 5) {
  const items = await db.query.reviewItems.findMany({
    where: eq(reviewItems.userId, userId),
  });
  const now = Date.now();
  return items
    .filter((i) => i.dueAt.getTime() <= now)
    .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())
    .slice(0, limit);
}

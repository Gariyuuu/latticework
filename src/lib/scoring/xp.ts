import "server-only";
import { db } from "@/lib/db/client";
import { xpEvents } from "@/lib/db/schema";

const DIFFICULTY_BASE_XP: Record<string, number> = {
  intro: 10,
  beginner: 20,
  intermediate: 35,
  advanced: 50,
  interview: 60,
  challenge: 45,
};

/** XP for a passed exercise/challenge — brief §28: legitimate learning
 * actions only, hints reduce the reward rather than blocking it outright. */
export function computeExerciseXP(difficulty: string | undefined, hintsUsed: number): number {
  const base = DIFFICULTY_BASE_XP[difficulty ?? "beginner"] ?? DIFFICULTY_BASE_XP.beginner;
  const penalty = Math.min(hintsUsed * 3, base * 0.6);
  return Math.max(Math.round(base - penalty), Math.round(base * 0.4));
}

export const XP = {
  lessonBlock: 5,
  quizCorrect: 10,
  projectMilestone: 60,
  assessmentCompleted: 25,
};

/** Level from cumulative XP — always derived, never stored as a mutable
 * counter (docs/DATABASE_SCHEMA.md "Notes on design choices"). */
export function levelForXP(totalXP: number): number {
  return Math.floor(Math.sqrt(totalXP / 40)) + 1;
}

export async function awardXP(userId: string, amount: number, source: string, sourceId?: string) {
  await db.insert(xpEvents).values({ userId, amount, source, sourceId });
  return amount;
}

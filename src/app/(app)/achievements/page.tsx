import { eq } from "drizzle-orm";
import { Lock, Trophy } from "lucide-react";
import { getOrCreateLocalUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db/client";
import { achievements, userAchievements } from "@/lib/db/schema";
import { ACHIEVEMENT_CATALOG } from "@/lib/scoring/achievements";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function AchievementsPage() {
  const user = await getOrCreateLocalUser().catch(() => null);
  const hasDb = Boolean(process.env.DATABASE_URL) && user;

  const unlockedSlugs = new Set<string>();
  if (hasDb) {
    const rows = await db
      .select({ slug: achievements.slug })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, user!.id));
    rows.forEach((r) => unlockedSlugs.add(r.slug));
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Achievements</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A growing catalog — see /changelog and ROADMAP.md for what&apos;s next.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ACHIEVEMENT_CATALOG.map((a) => {
          const unlocked = unlockedSlugs.has(a.slug);
          const hideDetails = a.hidden && !unlocked;
          return (
            <Card key={a.slug} className={cn("flex-row items-center gap-3 p-4", !unlocked && "opacity-60")}>
              {unlocked ? (
                <Trophy className="size-6 shrink-0 text-forge-warning" />
              ) : (
                <Lock className="size-6 shrink-0 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">{hideDetails ? "Hidden achievement" : a.title}</p>
                <p className="text-xs text-muted-foreground">
                  {hideDetails ? "Keep exploring to find this one." : a.description}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

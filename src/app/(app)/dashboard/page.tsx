import Link from "next/link";
import { eq } from "drizzle-orm";
import { ArrowRight, Flame, Trophy, Target } from "lucide-react";
import { getOrCreateLocalUser } from "@/lib/auth/current-user";
import { db, safeQuery } from "@/lib/db/client";
import { profiles, streaks, xpEvents, userAchievements, achievements } from "@/lib/db/schema";
import { generateRoadmap, getCareerTrack } from "@/lib/roadmap/generate";
import { levelForXP } from "@/lib/scoring/xp";
import { CAREER_TRACKS } from "@/lib/roadmap/tracks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const user = await getOrCreateLocalUser().catch(() => null);
  const hasDb = Boolean(process.env.DATABASE_URL) && user;

  const profile = hasDb
    ? await safeQuery(() => db.query.profiles.findFirst({ where: eq(profiles.userId, user!.id) }), undefined)
    : null;
  const streak = hasDb
    ? await safeQuery(() => db.query.streaks.findFirst({ where: eq(streaks.userId, user!.id) }), undefined)
    : null;
  const xpRows = hasDb ? await safeQuery(() => db.query.xpEvents.findMany({ where: eq(xpEvents.userId, user!.id) }), []) : [];
  const totalXP = xpRows.reduce((sum, e) => sum + e.amount, 0);
  const level = levelForXP(totalXP);

  const recentUnlocks = hasDb
    ? await safeQuery(
        () =>
          db
            .select({ title: achievements.title })
            .from(userAchievements)
            .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
            .where(eq(userAchievements.userId, user!.id))
            .limit(3),
        [],
      )
    : [];

  if (!profile?.careerGoal) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome to Latticework</h1>
        <p className="mt-2 text-muted-foreground">
          Pick a career goal and take a quick diagnostic so we can build your roadmap.
        </p>
        <Button asChild className="mt-6">
          <Link href="/onboarding">
            Start onboarding <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    );
  }

  const track = getCareerTrack(profile.careerGoal) ?? CAREER_TRACKS[0];
  const stages = await generateRoadmap(track.slug, user?.id);
  const nextNode = stages?.flatMap((s) => s.skills).find((s) => s.status === "available" && s.contentStatus === "built");
  const nextNodeAnyStatus = nextNode ?? stages?.flatMap((s) => s.skills).find((s) => s.contentStatus === "built");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Current goal: <span className="font-medium text-foreground">{track.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="gap-1 p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Trophy className="size-3.5" /> Level
          </div>
          <p className="text-2xl font-semibold">{level}</p>
          <p className="text-xs text-muted-foreground">{totalXP} XP total</p>
        </Card>
        <Card className="gap-1 p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Flame className="size-3.5" /> Streak
          </div>
          <p className="text-2xl font-semibold">{streak?.currentLength ?? 0} days</p>
          <p className="text-xs text-muted-foreground">{streak?.freezesAvailable ?? 0} freeze(s) available</p>
        </Card>
        <Card className="gap-1 p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Target className="size-3.5" /> Daily goal
          </div>
          <p className="text-2xl font-semibold">{profile.dailyGoalMinutes ?? 20} min</p>
          <p className="text-xs text-muted-foreground">Missing a day won&apos;t break your streak</p>
        </Card>
      </div>

      {nextNodeAnyStatus && (
        <Card className="flex-row items-center justify-between gap-4 p-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Recommended next</p>
            <p className="text-lg font-medium">{nextNodeAnyStatus.name}</p>
          </div>
          <Button asChild>
            <Link href={`/learn/${nextNodeAnyStatus.slug}`}>
              Continue <ArrowRight className="size-4" />
            </Link>
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="gap-3 p-5">
          <p className="text-sm font-medium">Daily Forge</p>
          <p className="text-sm text-muted-foreground">
            A short mixed review set (SRS due items + fresh practice) — see /practice.
          </p>
          <Button asChild variant="outline" size="sm" className="w-fit">
            <Link href="/practice">Start Daily Forge</Link>
          </Button>
        </Card>
        <Card className="gap-3 p-5">
          <p className="text-sm font-medium">Recent achievements</p>
          {recentUnlocks.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {recentUnlocks.map((a) => (
                <Badge key={a.title} variant="secondary">
                  {a.title}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">None yet — complete an exercise to unlock your first.</p>
          )}
          <Button asChild variant="outline" size="sm" className="w-fit">
            <Link href="/achievements">View all</Link>
          </Button>
        </Card>
      </div>

      <Card className="gap-3 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Your roadmap</p>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/roadmap?track=${track.slug}`}>
              Full roadmap <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">{track.description}</p>
      </Card>
    </div>
  );
}

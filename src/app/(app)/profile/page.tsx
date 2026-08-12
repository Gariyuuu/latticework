import { eq, desc } from "drizzle-orm";
import Image from "next/image";
import { getOrCreateLocalUser } from "@/lib/auth/current-user";
import { db, safeQuery } from "@/lib/db/client";
import { activity, profiles, skillRatings, skills, streaks, xpEvents } from "@/lib/db/schema";
import { levelForXP } from "@/lib/scoring/xp";
import { getCareerTrack } from "@/lib/roadmap/generate";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ProfilePage() {
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

  const ratings = hasDb
    ? await safeQuery(
        () =>
          db
            .select({ skillName: skills.name, rating: skillRatings.rating })
            .from(skillRatings)
            .innerJoin(skills, eq(skillRatings.skillId, skills.id))
            .where(eq(skillRatings.userId, user!.id))
            .orderBy(desc(skillRatings.rating)),
        [],
      )
    : [];

  const strong = ratings.filter((r) => r.rating >= 4);
  const weak = ratings.filter((r) => r.rating > 0 && r.rating <= 2);

  const recentActivity = hasDb
    ? await safeQuery(
        () => db.query.activity.findMany({ where: eq(activity.userId, user!.id), orderBy: desc(activity.date), limit: 30 }),
        [],
      )
    : [];

  const track = profile?.careerGoal ? getCareerTrack(profile.careerGoal) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        {user?.avatarUrl && (
          <Image src={user.avatarUrl} alt="" width={64} height={64} className="size-16 rounded-full" />
        )}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{user?.displayName ?? "Learner"}</h1>
          <p className="text-sm text-muted-foreground">
            Level {levelForXP(totalXP)} · {totalXP} XP {track && <>· {track.name}</>}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="gap-1 p-4">
          <p className="text-xs text-muted-foreground">Current streak</p>
          <p className="text-xl font-semibold">{streak?.currentLength ?? 0} days</p>
        </Card>
        <Card className="gap-1 p-4">
          <p className="text-xs text-muted-foreground">Longest streak</p>
          <p className="text-xl font-semibold">{streak?.longestLength ?? 0} days</p>
        </Card>
        <Card className="gap-1 p-4">
          <p className="text-xs text-muted-foreground">Active days (30d)</p>
          <p className="text-xl font-semibold">{recentActivity.length}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="gap-2 p-4">
          <p className="text-sm font-medium">Strong skills</p>
          {strong.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {strong.map((r) => (
                <Badge key={r.skillName} className="bg-forge-success/15 text-forge-success border-forge-success/30">
                  {r.skillName}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Keep practicing — nothing at Proficient+ yet.</p>
          )}
        </Card>
        <Card className="gap-2 p-4">
          <p className="text-sm font-medium">Weak skills</p>
          {weak.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {weak.map((r) => (
                <Badge key={r.skillName} variant="outline">
                  {r.skillName}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing flagged as weak right now.</p>
          )}
        </Card>
      </div>

      <Card className="gap-2 p-4">
        <p className="text-sm font-medium">Activity</p>
        <div className="flex flex-wrap gap-1">
          {recentActivity.length > 0 ? (
            recentActivity
              .slice()
              .reverse()
              .map((a) => (
                <div
                  key={a.date}
                  title={`${a.date}: ${a.exercisesCompleted} exercises`}
                  className="size-3 rounded-sm bg-primary"
                  style={{ opacity: Math.min(0.3 + a.exercisesCompleted * 0.15, 1) }}
                />
              ))
          ) : (
            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

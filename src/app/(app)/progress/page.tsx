import { eq, desc } from "drizzle-orm";
import { getOrCreateLocalUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db/client";
import { activity, skillRatings, skills, submissions } from "@/lib/db/schema";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default async function ProgressPage() {
  const user = await getOrCreateLocalUser().catch(() => null);
  const hasDb = Boolean(process.env.DATABASE_URL) && user;

  const activityRows = hasDb
    ? await db.query.activity.findMany({ where: eq(activity.userId, user!.id), orderBy: desc(activity.date), limit: 14 })
    : [];
  const totalMinutes = activityRows.reduce((sum, a) => sum + a.minutesLearned, 0);
  const totalExercises = activityRows.reduce((sum, a) => sum + a.exercisesCompleted, 0);

  const subs = hasDb ? await db.query.submissions.findMany({ where: eq(submissions.userId, user!.id) }) : [];
  const accuracy = subs.length > 0 ? Math.round((subs.filter((s) => s.passed).length / subs.length) * 100) : null;

  const ratings = hasDb
    ? await db
        .select({ skillName: skills.name, rating: skillRatings.rating })
        .from(skillRatings)
        .innerJoin(skills, eq(skillRatings.skillId, skills.id))
        .where(eq(skillRatings.userId, user!.id))
        .orderBy(desc(skillRatings.rating))
    : [];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Progress</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last 14 days · learning estimates, not a performance review.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="gap-1 p-4">
          <p className="text-xs text-muted-foreground">Minutes learned</p>
          <p className="text-2xl font-semibold">{totalMinutes}</p>
        </Card>
        <Card className="gap-1 p-4">
          <p className="text-xs text-muted-foreground">Exercises completed</p>
          <p className="text-2xl font-semibold">{totalExercises}</p>
        </Card>
        <Card className="gap-1 p-4">
          <p className="text-xs text-muted-foreground">Accuracy</p>
          <p className="text-2xl font-semibold">{accuracy !== null ? `${accuracy}%` : "—"}</p>
        </Card>
      </div>

      <Card className="gap-3 p-5">
        <p className="text-sm font-medium">Skill ratings</p>
        {ratings.length > 0 ? (
          <div className="space-y-3">
            {ratings.map((r) => (
              <div key={r.skillName}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{r.skillName}</span>
                  <span className="text-muted-foreground">{r.rating}/6</span>
                </div>
                <Progress value={(r.rating / 6) * 100} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Complete an exercise to see your first skill rating.</p>
        )}
      </Card>
    </div>
  );
}

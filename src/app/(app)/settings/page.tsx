import { eq } from "drizzle-orm";
import { getOrCreateLocalUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { SettingsForm } from "@/components/settings/settings-form";

export default async function SettingsPage() {
  const user = await getOrCreateLocalUser().catch(() => null);
  const profile =
    user && process.env.DATABASE_URL ? await db.query.profiles.findFirst({ where: eq(profiles.userId, user.id) }) : null;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Notifications, admin content tools, and per-course progress reset are planned — see ROADMAP.md.
        </p>
      </div>
      <SettingsForm
        initial={{
          careerGoal: profile?.careerGoal ?? "",
          experienceLevel: profile?.experienceLevel ?? "",
          dailyGoalMinutes: profile?.dailyGoalMinutes ?? 20,
        }}
      />
    </div>
  );
}

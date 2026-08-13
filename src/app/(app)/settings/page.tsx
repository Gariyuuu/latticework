import { eq } from "drizzle-orm";
import { getOrCreateLocalUser } from "@/lib/auth/current-user";
import { db, safeQuery } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { SettingsForm } from "@/components/settings/settings-form";
import { AppearanceSettings } from "@/components/settings/appearance-settings";

export default async function SettingsPage() {
  const user = await getOrCreateLocalUser().catch(() => null);
  const profile =
    user && process.env.DATABASE_URL
      ? await safeQuery(() => db.query.profiles.findFirst({ where: eq(profiles.userId, user.id) }), undefined)
      : null;

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

      <div className="border-t border-border pt-6">
        <h2 className="mb-1 text-lg font-medium">Appearance</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Saved on this device only — no account sync yet.
        </p>
        <AppearanceSettings />
      </div>
    </div>
  );
}

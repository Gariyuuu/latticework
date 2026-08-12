import Link from "next/link";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";
import { getOrCreateLocalUser } from "@/lib/auth/current-user";
import { generateRoadmap } from "@/lib/roadmap/generate";
import { CAREER_TRACKS } from "@/lib/roadmap/tracks";
import { db, safeQuery } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  available: "border-border",
  learning: "border-forge-cyan/50 bg-forge-cyan/5",
  proficient: "border-primary/50 bg-primary/5",
  mastered: "border-forge-success/50 bg-forge-success/5",
};

export default async function RoadmapPage({
  searchParams,
}: {
  searchParams: Promise<{ track?: string }>;
}) {
  const { track: trackParam } = await searchParams;
  const user = await getOrCreateLocalUser().catch(() => null);

  let activeTrack = trackParam;
  if (!activeTrack && user && process.env.DATABASE_URL) {
    const profile = await safeQuery(() => db.query.profiles.findFirst({ where: eq(profiles.userId, user.id) }), undefined);
    activeTrack = profile?.careerGoal ?? undefined;
  }
  activeTrack ??= CAREER_TRACKS[0].slug;

  const stages = await generateRoadmap(activeTrack, user?.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Roadmap</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Nothing here is locked — this is a suggested order, not a gate. Learning estimates only.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {CAREER_TRACKS.map((t) => (
          <Link key={t.slug} href={`/roadmap?track=${t.slug}`}>
            <Badge
              variant={t.slug === activeTrack ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-xs"
            >
              {t.name}
            </Badge>
          </Link>
        ))}
      </div>

      {stages && (
        <div className="space-y-8">
          {stages.map((s) => (
            <div key={s.stage}>
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                {s.stage}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {s.skills.map((node) => (
                  <Link key={node.slug} href={`/learn/${node.slug}`}>
                    <Card className={cn("h-full gap-1.5 p-4 transition-colors", STATUS_STYLE[node.status])}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{node.name}</span>
                        {node.status === "mastered" ? (
                          <Sparkles className="size-3.5 text-forge-success" />
                        ) : node.status === "available" ? (
                          <Circle className="size-3.5 text-muted-foreground" />
                        ) : (
                          <CheckCircle2 className="size-3.5 text-forge-cyan" />
                        )}
                      </div>
                      <span className="text-xs capitalize text-muted-foreground">
                        {node.status === "available" ? "Not started" : node.status} · Level {node.rating}/6
                      </span>
                      {node.contentStatus === "skeleton" && (
                        <span className="text-xs text-muted-foreground">Content planned</span>
                      )}
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

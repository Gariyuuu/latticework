import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CAREER_TRACKS } from "@/lib/roadmap/tracks";

export const metadata = { title: "Career Paths — Latticework" };

export default function CareersPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Career paths</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Each path is a dependency-ordered skill roadmap, not a promise. Coverage percentages elsewhere
        in the app are learning-readiness estimates, never a hiring probability.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CAREER_TRACKS.map((t) => {
          const stages = [...new Set(t.skills.map((s) => s.stage))];
          const coreSkills = t.skills.slice(0, 6);
          return (
            <Card key={t.slug} className="gap-3 p-5">
              <div>
                <p className="text-lg font-medium">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.description}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {coreSkills.map((s) => (
                  <Badge key={s.slug} variant="outline" className="text-xs">
                    {s.slug}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Stages: {stages.join(" → ")}</p>
              <Button asChild size="sm" variant="outline" className="w-fit">
                <Link href={`/roadmap?track=${t.slug}`}>
                  View roadmap <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

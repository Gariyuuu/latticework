import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { getSkillMetadata, listLessonSlugs, getLessonSource } from "@/lib/content/loader";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ skillSlug: string }>;
}) {
  const { skillSlug } = await params;
  const skill = getSkillMetadata(skillSlug);
  if (!skill) notFound();

  const builtLessonSlugs = new Set(listLessonSlugs(skillSlug));

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {skill.difficulty}
          </Badge>
          <span className="text-xs text-muted-foreground">{skill.estimatedHours}h estimated</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{skill.name}</h1>
        {skill.description && <p className="mt-2 text-muted-foreground">{skill.description}</p>}
      </div>

      {skill.prerequisites.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Prerequisites</h2>
          <div className="flex flex-wrap gap-2">
            {skill.prerequisites.map((p) => (
              <Link key={p} href={`/learn/${p}`}>
                <Badge variant="secondary">{p}</Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {skill.usefulFor.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Useful for</h2>
          <div className="flex flex-wrap gap-2">
            {skill.usefulFor.map((c) => (
              <Badge key={c} variant="outline" className="capitalize">
                {c.replace(/-/g, " ")}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Modules</h2>
        <div className="space-y-2">
          {skill.modules.map((m) => {
            const lessonExists = builtLessonSlugs.has(m.slug);
            const source = lessonExists ? getLessonSource(skillSlug, m.slug) : null;
            return (
              <Card key={m.slug} className="flex-row items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  {lessonExists ? (
                    <CheckCircle2 className="size-4 text-forge-success" />
                  ) : (
                    <Circle className="size-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{m.title}</p>
                    {source && <p className="text-xs text-muted-foreground">{source.frontmatter.estimatedMinutes} min</p>}
                  </div>
                </div>
                {lessonExists ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/learn/${skillSlug}/${m.slug}`}>
                      Start <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Planned
                  </Badge>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

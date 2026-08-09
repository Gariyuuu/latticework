import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { getProject } from "@/lib/projects/catalog";
import { getOrCreateLocalUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db/client";
import { projectProgress, projects } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { MilestoneChecklist } from "@/components/projects/milestone-checklist";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectSlug: string }>;
}) {
  const { projectSlug } = await params;
  const project = getProject(projectSlug);
  if (!project) notFound();

  const user = await getOrCreateLocalUser().catch(() => null);
  let initiallyCompleted: string[] = [];
  if (user && process.env.DATABASE_URL) {
    const dbProject = await db.query.projects.findFirst({ where: eq(projects.slug, projectSlug) });
    if (dbProject) {
      const progress = await db.query.projectProgress.findFirst({
        where: and(eq(projectProgress.userId, user.id), eq(projectProgress.projectId, dbProject.id)),
      });
      initiallyCompleted = progress?.completedMilestones ?? [];
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Badge variant="outline" className="mb-2 capitalize">
          {project.difficulty}
        </Badge>
        <h1 className="text-2xl font-semibold tracking-tight">{project.title}</h1>
        <p className="mt-2 text-muted-foreground">{project.overview}</p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">Requirements</h2>
        <ul className="list-inside list-disc space-y-1 text-sm">
          {project.requirements.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">Milestones</h2>
        <MilestoneChecklist
          projectSlug={project.slug}
          milestones={project.milestones}
          initiallyCompleted={initiallyCompleted}
        />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">Stretch goals</h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          {project.stretchGoals.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { and, eq } from "drizzle-orm";
import { getLessonSource, getSkillMetadata } from "@/lib/content/loader";
import { LessonRenderer } from "@/components/lesson/lesson-renderer";
import { getOrCreateLocalUser } from "@/lib/auth/current-user";
import { db, safeQuery } from "@/lib/db/client";
import { courses, lessonProgress, lessons, modules, skills as skillsTable } from "@/lib/db/schema";

async function getInitiallyCompleted(skillSlug: string, lessonSlug: string, userId: string | null): Promise<string[]> {
  if (!userId || !process.env.DATABASE_URL) return [];
  return safeQuery(async () => {
    const skill = await db.query.skills.findFirst({ where: eq(skillsTable.slug, skillSlug) });
    if (!skill) return [];
    const course = await db.query.courses.findFirst({ where: eq(courses.skillId, skill.id) });
    if (!course) return [];
    const row = await db
      .select({ id: lessons.id })
      .from(lessons)
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .where(and(eq(modules.courseId, course.id), eq(lessons.slug, lessonSlug)))
      .limit(1);
    const lessonId = row[0]?.id;
    if (!lessonId) return [];
    const progress = await db.query.lessonProgress.findFirst({
      where: and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessonId)),
    });
    return progress?.completedBlocks ?? [];
  }, []);
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ skillSlug: string; lessonSlug: string }>;
}) {
  const { skillSlug, lessonSlug } = await params;
  const skill = getSkillMetadata(skillSlug);
  const source = getLessonSource(skillSlug, lessonSlug);
  if (!skill || !source) notFound();

  const user = await getOrCreateLocalUser().catch(() => null);
  const initiallyCompleted = await getInitiallyCompleted(skillSlug, lessonSlug, user?.id ?? null);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/learn/${skillSlug}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-3.5" />
        {skill.name}
      </Link>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">{source.frontmatter.title}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{source.frontmatter.estimatedMinutes} min</p>

      <LessonRenderer skillSlug={skillSlug} lessonSlug={lessonSlug} initiallyCompleted={initiallyCompleted} />
    </div>
  );
}

import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db, safeQuery } from "@/lib/db/client";
import { skillRatings, skills as skillsTable } from "@/lib/db/schema";
import { getSkillMetadata } from "@/lib/content/loader";
import { CAREER_TRACKS, type CareerTrackDef } from "./tracks";

export function getCareerTrack(slug: string): CareerTrackDef | undefined {
  return CAREER_TRACKS.find((t) => t.slug === slug);
}

export type NodeStatus = "locked" | "available" | "learning" | "proficient" | "mastered";

export interface RoadmapSkillNode {
  slug: string;
  name: string;
  difficulty: string;
  category: string;
  contentStatus: "built" | "skeleton";
  status: NodeStatus;
  rating: number;
}

export interface RoadmapStage {
  stage: string;
  skills: RoadmapSkillNode[];
}

/** Builds the visual roadmap for a career track — see docs/ROADMAP_SYSTEM.md.
 * Works without a database connection (falls back to "available" for every
 * node); with one, pulls the user's actual SkillRating per node. Nothing is
 * ever hard-locked — brief §12: "Do not unnecessarily lock content." */
export async function generateRoadmap(trackSlug: string, userId?: string): Promise<RoadmapStage[] | null> {
  const track = getCareerTrack(trackSlug);
  if (!track) return null;

  let ratingsBySlug = new Map<string, number>();
  if (userId && process.env.DATABASE_URL) {
    const slugs = track.skills.map((s) => s.slug);
    const skillRows = await safeQuery(() => db.query.skills.findMany({ where: inArray(skillsTable.slug, slugs) }), []);
    const idToSlug = new Map(skillRows.map((s) => [s.id, s.slug]));
    if (skillRows.length > 0) {
      const ratingRows = await safeQuery(
        () =>
          db.query.skillRatings.findMany({
            where: and(
              eq(skillRatings.userId, userId),
              inArray(
                skillRatings.skillId,
                skillRows.map((s) => s.id)
              )
            ),
          }),
        [],
      );
      ratingsBySlug = new Map(ratingRows.map((r) => [idToSlug.get(r.skillId) ?? "", r.rating]));
    }
  }

  const stageOrder: string[] = [];
  for (const entry of track.skills) if (!stageOrder.includes(entry.stage)) stageOrder.push(entry.stage);

  return stageOrder.map((stageName) => ({
    stage: stageName,
    skills: track.skills
      .filter((e) => e.stage === stageName)
      .sort((a, b) => a.order - b.order)
      .map((e) => {
        const meta = getSkillMetadata(e.slug);
        const rating = ratingsBySlug.get(e.slug) ?? 0;
        const status: NodeStatus = rating === 0 ? "available" : rating <= 2 ? "learning" : rating <= 4 ? "proficient" : "mastered";
        return {
          slug: e.slug,
          name: meta?.name ?? e.slug,
          difficulty: meta?.difficulty ?? "beginner",
          category: meta?.category ?? "tooling",
          contentStatus: meta?.status ?? "skeleton",
          status,
          rating,
        };
      }),
  }));
}

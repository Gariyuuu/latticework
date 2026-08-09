import { MDXRemote } from "next-mdx-remote/rsc";
import { getExerciseTestCases, getLessonSource } from "@/lib/content/loader";
import { LessonProgressProvider, type LessonBlockData } from "./lesson-context";
import { Explanation } from "./explanation";
import { CodeExample } from "./code-example";
import { Exercise } from "./exercise";
import { Quiz } from "./quiz";
import { Checkpoint } from "./checkpoint";
import { Visualization } from "./visualization";
import { ProjectStep } from "./project-step";

const mdxComponents = {
  Explanation,
  CodeExample,
  Exercise,
  Quiz,
  Checkpoint,
  Visualization,
  ProjectStep,
};

export async function LessonRenderer({
  skillSlug,
  lessonSlug,
  initiallyCompleted = [],
}: {
  skillSlug: string;
  lessonSlug: string;
  initiallyCompleted?: string[];
}) {
  const source = getLessonSource(skillSlug, lessonSlug);
  if (!source) {
    return <p className="text-sm text-muted-foreground">Lesson not found.</p>;
  }

  const blocks: Record<string, LessonBlockData> = {};
  for (const block of source.frontmatter.blocks) {
    blocks[block.id] = {
      frontmatter: block,
      testCases:
        block.type === "exercise" && block.testCasesId
          ? getExerciseTestCases(skillSlug, block.testCasesId)
          : undefined,
    };
  }

  return (
    <LessonProgressProvider
      skillSlug={skillSlug}
      lessonSlug={lessonSlug}
      blocks={blocks}
      initiallyCompleted={initiallyCompleted}
    >
      <div className="space-y-4">
        <MDXRemote source={source.content} components={mdxComponents} />
      </div>
    </LessonProgressProvider>
  );
}

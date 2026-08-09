"use client";

import * as React from "react";
import { BookOpen } from "lucide-react";
import { BlockShell } from "./block-shell";
import { useLessonProgress } from "./lesson-context";

export function Explanation({ id, children }: { id: string; children: React.ReactNode }) {
  const { completed, markComplete } = useLessonProgress();

  React.useEffect(() => {
    markComplete(id);
    // Viewing an explanation block is enough to mark it read — mastery
    // weighting (docs/LEARNING_ENGINE.md) gives lesson completion only 15%,
    // so this can't inflate a skill rating on its own.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <BlockShell icon={BookOpen} label="Explanation" complete={completed.has(id)}>
      <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none">{children}</div>
    </BlockShell>
  );
}

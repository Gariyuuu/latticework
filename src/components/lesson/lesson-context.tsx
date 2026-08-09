"use client";

import * as React from "react";
import { toast } from "sonner";
import type { BlockFrontmatter } from "@/lib/content/schema";
import type { TestCaseFile } from "@/lib/content/schema";

export interface LessonBlockData {
  frontmatter: BlockFrontmatter;
  testCases?: TestCaseFile | null;
}

interface LessonContextValue {
  skillSlug: string;
  lessonSlug: string;
  blocks: Record<string, LessonBlockData>;
  completed: Set<string>;
  markComplete: (blockId: string, meta?: { hintsUsed?: number; code?: string }) => void;
}

const LessonContext = React.createContext<LessonContextValue | null>(null);

export function useLessonBlock(id: string): LessonBlockData {
  const ctx = React.useContext(LessonContext);
  if (!ctx) throw new Error("Lesson block components must be used within LessonProgressProvider");
  const block = ctx.blocks[id];
  if (!block) throw new Error(`No frontmatter found for lesson block "${id}"`);
  return block;
}

export function useLessonProgress() {
  const ctx = React.useContext(LessonContext);
  if (!ctx) throw new Error("useLessonProgress must be used within LessonProgressProvider");
  return ctx;
}

interface ProviderProps {
  skillSlug: string;
  lessonSlug: string;
  blocks: Record<string, LessonBlockData>;
  initiallyCompleted: string[];
  children: React.ReactNode;
}

export function LessonProgressProvider({
  skillSlug,
  lessonSlug,
  blocks,
  initiallyCompleted,
  children,
}: ProviderProps) {
  const [completed, setCompleted] = React.useState<Set<string>>(new Set(initiallyCompleted));

  const markComplete = React.useCallback(
    (blockId: string, meta?: { hintsUsed?: number; code?: string }) => {
      setCompleted((prev) => {
        if (prev.has(blockId)) return prev;
        const next = new Set(prev);
        next.add(blockId);
        return next;
      });

      fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillSlug, lessonSlug, blockId, ...meta }),
      })
        .then(async (res) => {
          if (!res.ok) return;
          const data = await res.json();
          if (data.xpAwarded) {
            toast.success(`+${data.xpAwarded} XP`, { duration: 2000 });
          }
        })
        .catch(() => {
          // Best-effort: local completion state already reflects the action;
          // a failed sync doesn't block the user from continuing the lesson.
        });
    },
    [skillSlug, lessonSlug]
  );

  const value = React.useMemo(
    () => ({ skillSlug, lessonSlug, blocks, completed, markComplete }),
    [skillSlug, lessonSlug, blocks, completed, markComplete]
  );

  return <LessonContext.Provider value={value}>{children}</LessonContext.Provider>;
}

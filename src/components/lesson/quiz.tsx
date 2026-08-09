"use client";

import * as React from "react";
import { HelpCircle, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlockShell } from "./block-shell";
import { useLessonBlock, useLessonProgress } from "./lesson-context";
import { exerciseSlugFor } from "@/lib/content/schema";
import { cn } from "@/lib/utils";

export function Quiz({ id }: { id: string }) {
  const { frontmatter } = useLessonBlock(id);
  const { skillSlug, lessonSlug, completed, markComplete } = useLessonProgress();
  const [selected, setSelected] = React.useState<number | null>(null);
  const [checked, setChecked] = React.useState(false);

  const isComplete = completed.has(id);
  const correct = selected === frontmatter.answer;

  function handleCheck() {
    if (selected === null) return;
    setChecked(true);
    if (correct) {
      markComplete(id);
      fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseSlug: exerciseSlugFor(skillSlug, lessonSlug, id),
          passed: true,
        }),
      }).catch(() => {});
    }
  }

  return (
    <BlockShell icon={HelpCircle} label="Quiz" complete={isComplete}>
      <p className="mb-3 text-sm font-medium">{frontmatter.question}</p>
      <div className="space-y-2">
        {(frontmatter.options ?? []).map((opt, i) => {
          const isSelected = selected === i;
          const showState = checked && (isSelected || i === frontmatter.answer);
          return (
            <button
              key={i}
              type="button"
              onClick={() => !checked && setSelected(i)}
              disabled={checked}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                isSelected && !checked && "border-primary bg-primary/5",
                !isSelected && !checked && "border-border hover:bg-muted/50",
                showState && i === frontmatter.answer && "border-forge-success/50 bg-forge-success/10",
                showState && isSelected && i !== frontmatter.answer && "border-destructive/50 bg-destructive/10"
              )}
            >
              {checked && i === frontmatter.answer && <CheckCircle2 className="size-4 shrink-0 text-forge-success" />}
              {checked && isSelected && i !== frontmatter.answer && <XCircle className="size-4 shrink-0 text-destructive" />}
              {opt}
            </button>
          );
        })}
      </div>
      {!checked ? (
        <Button size="sm" className="mt-3" onClick={handleCheck} disabled={selected === null}>
          Check answer
        </Button>
      ) : (
        <p className={cn("mt-3 text-sm font-medium", correct ? "text-forge-success" : "text-destructive")}>
          {correct ? "Correct." : "Not quite — review the explanation above and try the next one."}
        </p>
      )}
    </BlockShell>
  );
}

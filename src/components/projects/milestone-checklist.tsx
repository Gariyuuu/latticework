"use client";

import * as React from "react";
import { toast } from "sonner";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export function MilestoneChecklist({
  projectSlug,
  milestones,
  initiallyCompleted,
}: {
  projectSlug: string;
  milestones: string[];
  initiallyCompleted: string[];
}) {
  const [completed, setCompleted] = React.useState<Set<string>>(new Set(initiallyCompleted));

  async function toggle(id: string) {
    const willComplete = !completed.has(id);
    setCompleted((prev) => {
      const next = new Set(prev);
      if (willComplete) next.add(id);
      else next.delete(id);
      return next;
    });

    const res = await fetch("/api/project-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectSlug, milestoneId: id, complete: willComplete }),
    }).catch(() => null);
    if (res?.ok) {
      const data = await res.json();
      if (data.xpAwarded) toast.success(`+${data.xpAwarded} XP`);
      if (data.status === "completed") toast.success("Project complete!");
    }
  }

  return (
    <div className="space-y-2">
      {milestones.map((title, i) => {
        const id = `m${i}`;
        const done = completed.has(id);
        return (
          <button
            key={id}
            onClick={() => toggle(id)}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
              done ? "border-forge-success/40 bg-forge-success/5" : "border-border hover:bg-muted/50"
            )}
          >
            {done ? (
              <CheckCircle2 className="size-4 shrink-0 text-forge-success" />
            ) : (
              <Circle className="size-4 shrink-0 text-muted-foreground" />
            )}
            <span className={done ? "line-through text-muted-foreground" : ""}>{title}</span>
          </button>
        );
      })}
    </div>
  );
}

import { ListChecks } from "lucide-react";
import { BlockShell } from "./block-shell";

export function ProjectStep({ children }: { id: string; children: React.ReactNode }) {
  return (
    <BlockShell icon={ListChecks} label="Project Step">
      <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none">{children}</div>
    </BlockShell>
  );
}

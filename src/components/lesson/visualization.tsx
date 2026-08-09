import { Sparkles } from "lucide-react";
import { BlockShell } from "./block-shell";

/** Step-through algorithm/data-structure visualizations (brief §34) are
 * planned — see ROADMAP.md "Advanced learning". This placeholder keeps the
 * block type wired into content/rendering so authoring isn't blocked on it. */
export function Visualization({ children }: { id: string; children?: React.ReactNode }) {
  return (
    <BlockShell icon={Sparkles} label="Visualization">
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
        <span>Interactive visualization — planned (see ROADMAP.md).</span>
        {children}
      </div>
    </BlockShell>
  );
}

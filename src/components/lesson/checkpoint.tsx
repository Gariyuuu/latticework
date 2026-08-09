import { Flag } from "lucide-react";
import { BlockShell } from "./block-shell";

export function Checkpoint({ children }: { id: string; children: React.ReactNode }) {
  return (
    <BlockShell icon={Flag} label="Checkpoint" complete>
      <div className="text-sm font-medium text-forge-success">{children}</div>
    </BlockShell>
  );
}

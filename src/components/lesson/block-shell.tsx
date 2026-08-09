import * as React from "react";
import { CheckCircle2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BlockShellProps {
  icon: LucideIcon;
  label: string;
  complete?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function BlockShell({ icon: Icon, label, complete, children, className }: BlockShellProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card p-5 transition-colors",
        complete && "border-forge-success/40",
        className
      )}
    >
      <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
        {complete && <CheckCircle2 className="ml-auto size-4 text-forge-success" />}
      </div>
      {children}
    </section>
  );
}

import Link from "next/link";
import { Layers } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { CommandPalette } from "@/components/shell/command-palette";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-8">
      <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
        <Layers className="size-5 text-primary" />
        <span className="font-semibold tracking-tight">Latticework</span>
      </Link>
      <div className="md:hidden">
        <CommandPalette />
      </div>
      <div className="ml-auto flex items-center gap-3">
        <UserButton />
      </div>
    </header>
  );
}

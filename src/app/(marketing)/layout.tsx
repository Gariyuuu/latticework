import Link from "next/link";
import { Layers } from "lucide-react";
import { Show, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Layers className="size-5 text-primary" />
          <span className="font-semibold tracking-tight">Latticework</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link href="/learn" className="hover:text-foreground">Explore</Link>
          <Link href="/careers" className="hover:text-foreground">Careers</Link>
          <Link href="/changelog" className="hover:text-foreground">Changelog</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Show when="signed-out">
            <Button asChild variant="ghost" size="sm">
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/sign-up">Start Learning</Link>
            </Button>
          </Show>
          <Show when="signed-in">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <UserButton />
          </Show>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border px-4 py-8 text-center text-xs text-muted-foreground md:px-8">
        Latticework — an interactive skill academy. Learning estimates only, never a hiring guarantee.
      </footer>
    </div>
  );
}

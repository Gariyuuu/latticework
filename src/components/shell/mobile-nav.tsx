"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/nav";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import * as React from "react";

const PRIMARY = NAV_ITEMS.slice(0, 4);
const OVERFLOW = NAV_ITEMS.slice(4);

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-card/95 backdrop-blur md:hidden">
      {PRIMARY.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px]",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="size-5" />
            {item.label}
          </Link>
        );
      })}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-auto flex-1 flex-col items-center gap-1 rounded-none py-2.5 text-[11px] text-muted-foreground"
          >
            <Menu className="size-5" />
            More
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="pb-8">
          <SheetTitle className="px-1 pb-2">More</SheetTitle>
          <div className="grid grid-cols-3 gap-2">
            {OVERFLOW.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-3 text-xs"
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}

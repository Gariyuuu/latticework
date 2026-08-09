import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  BookOpen,
  Map,
  Swords,
  FolderKanban,
  MessageSquareCode,
  TerminalSquare,
  LineChart,
  Trophy,
  User,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// Shared between the desktop sidebar and the mobile bottom nav — see
// docs/DESIGN_SYSTEM.md / brief §48. Order matters: it's the priority order
// for the mobile nav's visible slots before the "more" overflow.
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/roadmap", label: "Roadmap", icon: Map },
  { href: "/practice", label: "Practice", icon: Swords },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/interview", label: "Interview", icon: MessageSquareCode },
  { href: "/playground", label: "Playground", icon: TerminalSquare },
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/achievements", label: "Achievements", icon: Trophy },
  { href: "/profile", label: "Profile", icon: User },
];

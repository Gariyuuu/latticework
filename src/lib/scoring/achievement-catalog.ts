// Pure data — no "server-only" guard, so scripts/content-sync.ts (run via
// tsx outside Next's webpack build) can import it directly. DB-touching
// unlock logic lives in achievements.ts, which re-exports this and keeps
// the server-only guard for the app.

// A handful of real, checked achievements from brief §29. The rest of the
// catalog is Planned — see ROADMAP.md "Polish" — this is intentionally not
// padded out with unchecked entries that would silently never unlock.
export const ACHIEVEMENT_CATALOG = [
  { slug: "hello-world", title: "Hello World", description: "Complete your first exercise.", hidden: false },
  { slug: "100-days", title: "100 Days", description: "100 active learning days.", hidden: false },
  {
    slug: "night-compiler",
    title: "Night Compiler",
    description: "Complete an exercise between midnight and 4am.",
    hidden: true,
  },
];

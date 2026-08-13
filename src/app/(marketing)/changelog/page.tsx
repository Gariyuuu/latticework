export const metadata = { title: "Changelog — Latticework" };

const ENTRIES = [
  {
    version: "0.3.0",
    date: "2026-08-13",
    features: [
      "Appearance settings: an accent-color wheel that re-tints buttons, links, and highlights across the whole app live, plus a background picker (6 built-in ambient artwork presets, or upload your own image) — both saved on-device",
      "A real favicon, replacing the default Next.js placeholder",
    ],
    improvements: [
      "Every color token now derives from a single --accent-hue CSS variable instead of being hard-coded, so the theme wheel can re-tint the entire UI, not just one button",
    ],
    fixes: [
      "Homepage was silently serving the default create-next-app starter page instead of the real Latticework landing page — a leftover, never-edited src/app/page.tsx was shadowing the real one at the same URL",
    ],
  },
  {
    version: "0.2.0",
    date: "2026-08-13",
    features: [
      "CLI-simulation exercises: a new in-browser Unix-shell sandbox (navigation, file ops, pipes, redirection, variables, permissions, sort/uniq, a grep/sed/awk subset) — brings the Bash, Terminal/CLI, and Linux courses to life for the first time",
    ],
    improvements: [
      "Skill catalog coverage: 77 of 99 technologies now have real interactive lessons, up from 74",
    ],
    fixes: [],
  },
  {
    version: "0.1.0",
    date: "2026-08-08",
    features: [
      "Career roadmap engine covering 11 tracks with a dependency-ordered skill graph",
      "Interactive Python course (Variables, Loops, Functions) with in-browser sandboxed execution",
      "XP, mastery/skill-rating engine, spaced repetition, and streaks",
      "AI tutor hint ladder (4 levels, OpenAI-compatible provider)",
      "Onboarding flow with a short diagnostic and personalized first-skills recommendation",
      "98-technology skill catalog (Explore page + skill graph), most as structured skeletons",
    ],
    improvements: [],
    fixes: [],
  },
];

const SECTIONS = [
  { key: "features" as const, label: "Features", dotClass: "bg-forge-cyan" },
  { key: "improvements" as const, label: "Improvements", dotClass: "bg-primary" },
  { key: "fixes" as const, label: "Fixes", dotClass: "bg-forge-warning" },
];

export default function ChangelogPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 md:px-8">
      <h1 className="mb-1 text-3xl font-semibold tracking-tight">Changelog</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Every user-facing feature, improvement, and fix — including UI/UX changes — as they ship.
      </p>
      <div className="space-y-10">
        {ENTRIES.map((e) => (
          <div key={e.version}>
            <div className="mb-3 flex items-baseline gap-3">
              <h2 className="text-lg font-medium">v{e.version}</h2>
              <span className="text-sm text-muted-foreground">{e.date}</span>
            </div>
            <div className="space-y-3">
              {SECTIONS.map(
                (s) =>
                  e[s.key].length > 0 && (
                    <div key={s.key}>
                      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        <span className={`size-1.5 rounded-full ${s.dotClass}`} />
                        {s.label}
                      </p>
                      <ul className="list-inside list-disc space-y-1 text-sm">
                        {e[s.key].map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-8 text-xs text-muted-foreground">
        See <span className="font-mono">ROADMAP.md</span> in the repository for the full planned/in-progress list.
      </p>
    </div>
  );
}

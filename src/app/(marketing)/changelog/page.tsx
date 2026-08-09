export const metadata = { title: "Changelog — Latticework" };

const ENTRIES = [
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

export default function ChangelogPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 md:px-8">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">Changelog</h1>
      <div className="space-y-8">
        {ENTRIES.map((e) => (
          <div key={e.version}>
            <div className="mb-2 flex items-baseline gap-3">
              <h2 className="text-lg font-medium">v{e.version}</h2>
              <span className="text-sm text-muted-foreground">{e.date}</span>
            </div>
            {e.features.length > 0 && (
              <>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Features</p>
                <ul className="mb-3 list-inside list-disc space-y-1 text-sm">
                  {e.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ))}
      </div>
      <p className="mt-8 text-xs text-muted-foreground">
        See <span className="font-mono">ROADMAP.md</span> in the repository for the full planned/in-progress list.
      </p>
    </div>
  );
}

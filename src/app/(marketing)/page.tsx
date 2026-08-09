import Link from "next/link";
import { ArrowRight, Map, Code2, Layers, FolderKanban, Sparkles, LineChart } from "lucide-react";
import { Show } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listAllSkills } from "@/lib/content/loader";

const FEATURES = [
  { icon: Map, title: "Career roadmaps", body: "Pick a goal — Quant Developer, ML Engineer, SWE — and get a dependency-ordered skill path, not a link dump." },
  { icon: Code2, title: "Interactive coding", body: "Real code, running in your browser. Lessons are mostly practice, not paragraphs." },
  { icon: Layers, title: "A real skill graph", body: "Languages, frameworks, CS fundamentals, and quant math connected by prerequisites — not equally-sized course tiles." },
  { icon: FolderKanban, title: "Projects", body: "Apply what you learned in scoped, milestone-tracked builds instead of just isolated exercises." },
  { icon: Sparkles, title: "AI tutor", body: "A hint ladder that nudges instead of solving it for you — conceptual, then directional, then a partial fix." },
  { icon: LineChart, title: "Progress tracking", body: "Spaced repetition and a transparent mastery formula — always labeled as a learning estimate." },
];

export default function LandingPage() {
  const skillCount = listAllSkills().length;

  return (
    <div>
      <section className="mx-auto max-w-4xl px-4 py-24 text-center md:px-8">
        <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
          Master the skills engineers actually use.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          Learn programming, AI, data, computer science, and quantitative engineering through
          interactive lessons and real code.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Show when="signed-out">
            <Button asChild size="lg">
              <Link href="/sign-up">
                Start Learning <ArrowRight className="size-4" />
              </Link>
            </Button>
          </Show>
          <Show when="signed-in">
            <Button asChild size="lg">
              <Link href="/dashboard">
                Go to dashboard <ArrowRight className="size-4" />
              </Link>
            </Button>
          </Show>
          <Button asChild size="lg" variant="outline">
            <Link href="/learn">Explore Skills</Link>
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">{skillCount} technologies and concepts on the skill graph today.</p>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-24 md:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="gap-2 p-5">
              <f.icon className="size-5 text-primary" />
              <p className="font-medium">{f.title}</p>
              <p className="text-sm text-muted-foreground">{f.body}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

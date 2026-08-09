import Link from "next/link";
import { listAllSkills } from "@/lib/content/loader";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Learn — Latticework" };

const CATEGORY_LABEL: Record<string, string> = {
  language: "Languages",
  web: "Web Development",
  database: "Databases",
  "ai-ml": "AI / ML",
  "data-science": "Data Science",
  quant: "Quant",
  cs: "Computer Science",
  devops: "DevOps",
  cloud: "Cloud",
  math: "Math",
  tooling: "Engineering Tools",
};

export default function LearnPage() {
  const allSkills = listAllSkills().sort((a, b) => a.name.localeCompare(b.name));
  const built = allSkills.filter((s) => s.status === "built");
  const byCategory = new Map<string, typeof allSkills>();
  for (const skill of allSkills) {
    const list = byCategory.get(skill.category) ?? [];
    list.push(skill);
    byCategory.set(skill.category, list);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Explore skills</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {allSkills.length} technologies and concepts. {built.length} have full interactive lessons
          today — the rest are outlined and on the roadmap (see /changelog).
        </p>
      </div>

      {[...byCategory.entries()].map(([category, list]) => (
        <div key={category}>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {CATEGORY_LABEL[category] ?? category}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((skill) => (
              <Link key={skill.slug} href={`/learn/${skill.slug}`}>
                <Card className="h-full gap-2 p-4 transition-colors hover:border-primary/40">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{skill.name}</span>
                    {skill.status === "built" ? (
                      <Badge className="bg-forge-success/15 text-forge-success border-forge-success/30">
                        Available
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Planned
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{skill.difficulty}</span>
                    <span>·</span>
                    <span>{skill.estimatedHours}h</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = [
  { name: "Software Engineering", topics: ["Algorithms", "Coding", "System design fundamentals", "Debugging"] },
  { name: "Machine Learning", topics: ["Python", "Statistics", "ML concepts", "Model evaluation", "ML system design"] },
  { name: "Quant", topics: ["Probability", "Statistics", "Mental math", "Python", "C++", "Algorithms", "Brainteasers", "Markets"] },
  { name: "Data Science", topics: ["SQL", "Statistics", "Experimentation", "Python", "Product analytics"] },
];

export default function InterviewPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Interview Prep</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Career-specific practice. Question banks and timed/mock modes are planned — see ROADMAP.md.
          Today, use Practice and the exercises inside each skill to build the underlying knowledge.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CATEGORIES.map((c) => (
          <Card key={c.name} className="gap-3 p-4">
            <p className="font-medium">{c.name}</p>
            <div className="flex flex-wrap gap-1.5">
              {c.topics.map((t) => (
                <Badge key={t} variant="outline" className="text-xs">
                  {t}
                </Badge>
              ))}
            </div>
            <Badge variant="secondary" className="w-fit">
              Planned
            </Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}

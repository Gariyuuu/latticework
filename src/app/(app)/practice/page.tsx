import Link from "next/link";
import { Bug, Search, Timer, RotateCcw } from "lucide-react";
import { getOrCreateLocalUser } from "@/lib/auth/current-user";
import { getDueReviews } from "@/lib/srs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PLANNED_MODES = [
  { icon: Bug, title: "Bug Hunt", description: "Diagnose and fix real broken programs." },
  { icon: Search, title: "Code Detective", description: "Read unfamiliar code and answer questions about it." },
  { icon: Timer, title: "Code Sprint", description: "Timed rapid-fire rounds scored on accuracy and speed." },
];

export default async function PracticePage() {
  const user = await getOrCreateLocalUser().catch(() => null);
  const dueReviews = user && process.env.DATABASE_URL ? await getDueReviews(user.id, 5) : [];

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Practice</h1>
        <p className="mt-1 text-sm text-muted-foreground">Daily Forge — a short, mixed review set.</p>
      </div>

      <Card className="gap-3 p-5">
        <div className="flex items-center gap-2">
          <RotateCcw className="size-4 text-forge-cyan" />
          <p className="text-sm font-medium">Due for review</p>
        </div>
        {dueReviews.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {dueReviews.map((r) => (
              <Badge key={r.concept} variant="outline">
                {r.concept}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nothing due yet — reviews get scheduled automatically as you pass exercises. Head to{" "}
            <Link href="/learn/python" className="underline">
              Python
            </Link>{" "}
            to get started.
          </p>
        )}
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Coming soon
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PLANNED_MODES.map((m) => (
            <Card key={m.title} className="gap-2 p-4 opacity-70">
              <m.icon className="size-5 text-muted-foreground" />
              <p className="text-sm font-medium">{m.title}</p>
              <p className="text-xs text-muted-foreground">{m.description}</p>
              <Badge variant="outline" className="w-fit text-muted-foreground">
                Planned
              </Badge>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

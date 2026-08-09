import Link from "next/link";
import { PROJECT_CATALOG } from "@/lib/projects/catalog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PLANNED = [
  "Ecommerce Analytics (SQL)",
  "Dashboard (Frontend)",
  "REST API (Backend)",
  "House Price Model (ML)",
  "Fraud Classifier (ML)",
  "Image Classifier (PyTorch)",
  "Portfolio Analyzer (Quant)",
  "Monte Carlo Simulator (Quant)",
  "Order Book Simulator (C++)",
  "Realtime Chat App (Full Stack)",
];

export default function ProjectsPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="mt-1 text-sm text-muted-foreground">Build something real with what you&apos;ve learned.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PROJECT_CATALOG.map((p) => (
          <Link key={p.slug} href={`/projects/${p.slug}`}>
            <Card className="h-full gap-2 p-4 transition-colors hover:border-primary/40">
              <div className="flex items-center justify-between">
                <span className="font-medium">{p.title}</span>
                <Badge variant="outline" className="capitalize">
                  {p.difficulty}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{p.overview}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">Coming soon</h2>
        <div className="flex flex-wrap gap-2">
          {PLANNED.map((p) => (
            <Badge key={p} variant="outline" className="text-muted-foreground">
              {p}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

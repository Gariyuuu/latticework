"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Code2, Loader2, Lightbulb, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlockShell } from "./block-shell";
import { useLessonBlock, useLessonProgress } from "./lesson-context";
import { useSandbox } from "@/hooks/use-sandbox";
import { exerciseSlugFor } from "@/lib/content/schema";
import { cn } from "@/lib/utils";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="h-56 animate-pulse rounded-lg bg-muted" />,
});

interface CaseResult {
  call: string;
  expect: string;
  actual: string;
  pass: boolean;
}

const MAX_HINT_LEVEL = 4; // 5th action is "reveal solution"

export function Exercise({ id }: { id: string }) {
  const { frontmatter, testCases } = useLessonBlock(id);
  const { skillSlug, lessonSlug, completed, markComplete } = useLessonProgress();
  const language = (testCases?.language ?? "python") as "python";
  const { run, status } = useSandbox(language);

  const [code, setCode] = React.useState(testCases?.starterCode ?? "");
  const [results, setResults] = React.useState<CaseResult[] | null>(null);
  const [runError, setRunError] = React.useState<string | null>(null);
  const [hintLevel, setHintLevel] = React.useState(0);
  const [hintText, setHintText] = React.useState<string | null>(null);
  const [hintLoading, setHintLoading] = React.useState(false);
  const [startedAt] = React.useState(() => Date.now());
  const [submitted, setSubmitted] = React.useState(false);

  const exerciseSlug = exerciseSlugFor(skillSlug, lessonSlug, id);
  const isComplete = completed.has(id);

  async function handleRun() {
    if (!testCases) return;
    setRunError(null);
    const res = await run(code, {
      evalExpressions: testCases.cases.map((c) => c.call),
      packages: testCases.packages,
    });

    if (res.error) {
      setRunError(res.error);
      setResults(null);
      return;
    }

    const actuals = (res.value ?? "").split("\n---\n");
    const caseResults: CaseResult[] = testCases.cases.map((c, i) => ({
      call: c.call,
      expect: c.expect,
      actual: actuals[i] ?? "",
      pass: (actuals[i] ?? "") === c.expect,
    }));
    setResults(caseResults);

    const allPass = caseResults.every((c) => c.pass);
    if (allPass && !submitted) {
      setSubmitted(true);
      markComplete(id, { hintsUsed: hintLevel, code });
      const timeSpentSeconds = Math.round((Date.now() - startedAt) / 1000);
      fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseSlug,
          passed: true,
          timeSpentSeconds,
          code,
        }),
      })
        .then(async (r) => {
          if (!r.ok) return;
          const data = await r.json();
          if (data.xpAwarded) toast.success(`Exercise passed — +${data.xpAwarded} XP`);
        })
        .catch(() => {});
    }
  }

  async function handleHint() {
    if (hintLevel >= MAX_HINT_LEVEL + 1) return;
    setHintLoading(true);
    const nextLevel = hintLevel + 1;
    try {
      const res = await fetch("/api/ai/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseSlug, prompt: frontmatter.prompt, code, level: nextLevel }),
      });
      const data = await res.json();
      setHintText(data.hint ?? "AI tutor isn't configured yet — add an AI provider key to enable hints.");
      setHintLevel(nextLevel);
    } finally {
      setHintLoading(false);
    }
  }

  if (!testCases) {
    return (
      <BlockShell icon={Code2} label="Exercise">
        <p className="text-sm text-muted-foreground">Exercise content is missing test cases.</p>
      </BlockShell>
    );
  }

  return (
    <BlockShell icon={Code2} label="Exercise" complete={isComplete}>
      <p className="mb-3 text-sm leading-relaxed">{frontmatter.prompt}</p>

      <div className="overflow-hidden rounded-lg border border-border">
        <MonacoEditor
          height={220}
          language={language}
          theme="vs-dark"
          value={code}
          onChange={(v) => setCode(v ?? "")}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "var(--font-geist-mono)",
            scrollBeyondLastLine: false,
            padding: { top: 12 },
          }}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={handleRun} disabled={status === "loading" || status === "running"}>
          {status === "loading" || status === "running" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Code2 className="size-3.5" />
          )}
          Run & Check
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleHint}
          disabled={hintLoading || hintLevel > MAX_HINT_LEVEL}
        >
          {hintLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Lightbulb className="size-3.5" />}
          {hintLevel === 0
            ? "Hint"
            : hintLevel <= MAX_HINT_LEVEL
              ? `Hint ${hintLevel + 1}`
              : "No more hints"}
        </Button>
        {hintLevel > 0 && <span className="text-xs text-muted-foreground">{hintLevel} hint(s) used</span>}
      </div>

      {hintText && (
        <div className="mt-3 rounded-lg border border-forge-purple/30 bg-forge-purple/5 p-3 text-sm">
          <span className="mb-1 block text-xs font-medium text-forge-purple">
            AI Tutor · Hint {hintLevel}
          </span>
          {hintText}
        </div>
      )}

      {runError && (
        <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          {runError}
        </pre>
      )}

      {results && (
        <div className="mt-3 space-y-1.5">
          {results.map((r, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-xs",
                r.pass ? "border-forge-success/30 bg-forge-success/5" : "border-destructive/30 bg-destructive/5"
              )}
            >
              {r.pass ? (
                <CheckCircle2 className="size-3.5 shrink-0 text-forge-success" />
              ) : (
                <XCircle className="size-3.5 shrink-0 text-destructive" />
              )}
              <span className="truncate">{r.call}</span>
              {!r.pass && (
                <span className="ml-auto shrink-0 text-muted-foreground">
                  expected {r.expect}, got {r.actual || "nothing"}
                </span>
              )}
            </div>
          ))}
          {results.every((r) => r.pass) && (
            <p className="pt-1 text-sm font-medium text-forge-success">BUILD PASSED</p>
          )}
        </div>
      )}
    </BlockShell>
  );
}

"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSandbox } from "@/hooks/use-sandbox";
import type { RunOptions, RunResult, SandboxLanguage } from "@/lib/sandbox/types";
import { cn } from "@/lib/utils";

// Monaco is never part of the initial bundle — it's only imported once a
// lesson block that actually needs it mounts. See docs/DESIGN_SYSTEM.md §64.
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
      Loading editor…
    </div>
  ),
});

const MONACO_LANGUAGE: Record<SandboxLanguage, string> = {
  python: "python",
  javascript: "javascript",
  typescript: "typescript",
  sql: "sql",
};

interface CodeRunnerProps {
  language: SandboxLanguage;
  initialCode: string;
  readOnly?: boolean;
  height?: number;
  onRun?: (result: RunResult) => void;
  runOptions?: RunOptions;
  runLabel?: string;
}

export function CodeRunner({
  language,
  initialCode,
  readOnly = false,
  height = 220,
  onRun,
  runOptions,
  runLabel = "Run",
}: CodeRunnerProps) {
  const [code, setCode] = React.useState(initialCode);
  const [result, setResult] = React.useState<RunResult | null>(null);
  const { run, status } = useSandbox(language);

  const handleRun = async () => {
    const res = await run(code, runOptions);
    setResult(res);
    onRun?.(res);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border">
        <MonacoEditor
          height={height}
          language={MONACO_LANGUAGE[language]}
          theme="vs-dark"
          value={code}
          onChange={(v) => setCode(v ?? "")}
          options={{
            readOnly,
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "var(--font-geist-mono)",
            scrollBeyondLastLine: false,
            padding: { top: 12 },
          }}
        />
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <span className="text-xs text-muted-foreground">
          {status === "loading" && "Starting Python runtime…"}
          {status === "running" && "Running…"}
        </span>
        <Button size="sm" onClick={handleRun} disabled={status === "loading" || status === "running"}>
          {status === "loading" || status === "running" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Play className="size-3.5" />
          )}
          {runLabel}
        </Button>
      </div>
      {result && (
        <div className="border-t border-border bg-background/60 px-3 py-2 font-mono text-xs">
          {result.stdout && <pre className="whitespace-pre-wrap text-foreground">{result.stdout}</pre>}
          {result.error && (
            <pre className={cn("whitespace-pre-wrap", "text-destructive")}>{result.error}</pre>
          )}
          {result.stderr && (
            <pre className="whitespace-pre-wrap text-destructive">{result.stderr}</pre>
          )}
          {!result.stdout && !result.error && !result.stderr && (
            <span className="text-muted-foreground">No output</span>
          )}
        </div>
      )}
    </div>
  );
}

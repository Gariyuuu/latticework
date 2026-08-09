"use client";

import * as React from "react";
import { Terminal } from "lucide-react";
import { BlockShell } from "./block-shell";
import { CodeRunner } from "./code-runner";
import { useLessonProgress } from "./lesson-context";
import type { SandboxLanguage } from "@/lib/sandbox/types";

interface CodeExampleProps {
  id: string;
  language: SandboxLanguage;
  code: string;
  caption?: string;
  /** Pyodide package names this snippet needs (e.g. ["numpy"]) — see
   * src/lib/sandbox/providers/pyodide-provider.ts. */
  packages?: string[];
}

export function CodeExample({ id, language, code, caption, packages }: CodeExampleProps) {
  const { completed, markComplete } = useLessonProgress();

  return (
    <BlockShell icon={Terminal} label="Try it" complete={completed.has(id)}>
      {caption && <p className="mb-3 text-sm text-muted-foreground">{caption}</p>}
      <CodeRunner
        language={language}
        initialCode={code}
        height={160}
        onRun={() => markComplete(id)}
        runOptions={packages ? { packages } : undefined}
      />
    </BlockShell>
  );
}

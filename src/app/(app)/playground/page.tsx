"use client";

import * as React from "react";
import { CodeRunner } from "@/components/lesson/code-runner";
import { Badge } from "@/components/ui/badge";

const STARTER = `# Scratch playground — Python runs entirely in your browser (Pyodide/WASM).
# Nothing here touches the app server. See docs/SECURITY.md.

def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a

print([fibonacci(i) for i in range(10)])
`;

export default function PlaygroundPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Playground</h1>
          <Badge variant="outline">Python</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Freeform scratch space. JS/TS and SQL sandboxes are planned — see ROADMAP.md &quot;Code
          engine&quot;.
        </p>
      </div>
      <CodeRunner language="python" initialCode={STARTER} height={420} runLabel="Run" />
    </div>
  );
}

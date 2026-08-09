import type { SandboxLanguage, SandboxProvider } from "./types";
import { getPyodideProvider } from "./providers/pyodide-provider";

export function getSandboxProvider(language: SandboxLanguage): SandboxProvider {
  switch (language) {
    case "python":
      return getPyodideProvider();
    case "sql":
    case "javascript":
    case "typescript":
      // Planned — see ROADMAP.md "Code engine". sql.js and a sandboxed
      // Worker follow the same SandboxProvider interface as Pyodide.
      throw new Error(`Sandbox for "${language}" is not implemented yet`);
  }
}

export type { SandboxLanguage, SandboxProvider, RunResult, RunOptions } from "./types";

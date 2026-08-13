import type { SandboxLanguage, SandboxProvider } from "./types";
import { getPyodideProvider } from "./providers/pyodide-provider";
import { getSqlProvider } from "./providers/sql-provider";
import { getCliProvider } from "./providers/cli-provider";

export function getSandboxProvider(language: SandboxLanguage): SandboxProvider {
  switch (language) {
    case "python":
      return getPyodideProvider();
    case "sql":
      return getSqlProvider();
    case "bash":
      return getCliProvider();
    case "javascript":
    case "typescript":
      // Planned — see ROADMAP.md "Code engine". A sandboxed Worker follows
      // the same SandboxProvider interface as Pyodide/sql.js.
      throw new Error(`Sandbox for "${language}" is not implemented yet`);
  }
}

export type { SandboxLanguage, SandboxProvider, RunResult, RunOptions } from "./types";

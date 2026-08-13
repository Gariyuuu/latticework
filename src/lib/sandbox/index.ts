import type { SandboxLanguage, SandboxProvider } from "./types";
import { getPyodideProvider } from "./providers/pyodide-provider";
import { getSqlProvider } from "./providers/sql-provider";
import { getCliProvider } from "./providers/cli-provider";
import { getJsProvider, getTsProvider } from "./providers/js-provider";

export function getSandboxProvider(language: SandboxLanguage): SandboxProvider {
  switch (language) {
    case "python":
      return getPyodideProvider();
    case "sql":
      return getSqlProvider();
    case "bash":
      return getCliProvider();
    case "javascript":
      return getJsProvider();
    case "typescript":
      return getTsProvider();
  }
}

export type { SandboxLanguage, SandboxProvider, RunResult, RunOptions } from "./types";

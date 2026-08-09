export type SandboxLanguage = "python" | "javascript" | "typescript" | "sql";

export interface RunResult {
  stdout: string;
  stderr: string;
  /** Best-effort stringified return value of an expression, when requested. */
  value?: string;
  error?: string;
  durationMs: number;
}

export interface RunOptions {
  /** Extra expressions to evaluate after the main program body (used for
   * exercise test-case grading: run the user's code, then evaluate each
   * `call` and compare the stringified result to `expect`). */
  evalExpressions?: string[];
  /** Package names to load before running (Pyodide only — e.g. ["numpy",
   * "pandas"]). Ignored by providers that don't support extra packages.
   * Loading is cached by the provider, so repeated runs of the same
   * exercise/example don't re-download anything after the first call. */
  packages?: string[];
  /** SQL only: schema + seed data to run against a fresh in-memory database
   * before the submitted query runs. Ignored by other providers. */
  setupSql?: string;
}

/**
 * Execution provider abstraction — see docs/ARCHITECTURE.md "Execution
 * provider abstraction" and docs/SECURITY.md. Every implementation in this
 * MVP runs entirely on the user's own machine (WASM/Worker); none of them
 * talk to our server. A future server-side provider (compiled languages)
 * implements this same interface behind an API route instead.
 */
export interface SandboxProvider {
  language: SandboxLanguage;
  ready(): Promise<void>;
  run(code: string, opts?: RunOptions): Promise<RunResult>;
}

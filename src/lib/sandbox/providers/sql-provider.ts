"use client";

import type { RunOptions, RunResult, SandboxProvider } from "../types";

const SQLJS_VERSION = "1.10.3";
const CDN_BASE = `https://cdn.jsdelivr.net/npm/sql.js@${SQLJS_VERSION}/dist/`;

// Minimal shape of the global sql.js runtime we actually use — deliberately
// not bundled as an npm dependency of the app itself (multi-hundred-KB wasm
// asset; loaded from the CDN only when a SQL exercise is actually opened,
// same lazy-load approach as the Pyodide provider).
interface SqlJsDatabase {
  run(sql: string): void;
  exec(sql: string): { columns: string[]; values: unknown[][] }[];
  close(): void;
}
interface SqlJsStatic {
  Database: new () => SqlJsDatabase;
}

declare global {
  interface Window {
    initSqlJs?: (opts: { locateFile: (file: string) => string }) => Promise<SqlJsStatic>;
  }
}

let scriptPromise: Promise<void> | null = null;
let sqlJsPromise: Promise<SqlJsStatic> | null = null;

function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (window.initSqlJs) return resolve();
    const script = document.createElement("script");
    script.src = `${CDN_BASE}sql-wasm.js`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load sql.js from CDN"));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

async function getSqlJs(): Promise<SqlJsStatic> {
  if (sqlJsPromise) return sqlJsPromise;
  sqlJsPromise = loadScript().then(() => {
    if (!window.initSqlJs) throw new Error("sql.js failed to attach to window");
    return window.initSqlJs({ locateFile: (file) => `${CDN_BASE}${file}` });
  });
  return sqlJsPromise;
}

/** Plain-text table for `stdout` — the generic CodeRunner ("Try it" blocks)
 * only ever renders stdout/stderr/error, not the structured `value` field
 * the Exercise component's grading logic reads. */
function formatTable(columns: string[], rows: unknown[][]): string {
  if (columns.length === 0) return "(no rows)";
  const cellText = (v: unknown) => (v === null ? "NULL" : String(v));
  const widths = columns.map((c, i) => Math.max(c.length, ...rows.map((r) => cellText(r[i]).length)));
  const line = (cells: string[]) => cells.map((c, i) => c.padEnd(widths[i])).join(" | ");
  const out = [line(columns), widths.map((w) => "-".repeat(w)).join("-+-"), ...rows.map((r) => line(r.map(cellText)))];
  out.push(`(${rows.length} row${rows.length === 1 ? "" : "s"})`);
  return out.join("\n");
}

export class SqlProvider implements SandboxProvider {
  language = "sql" as const;

  async ready() {
    await getSqlJs();
  }

  /** Runs opts.setupSql (schema + seed data) once against a fresh in-memory
   * database, then runs `code` (the student's query) and returns the LAST
   * result set as JSON in `value` — `{"columns":[...],"rows":[[...]]}`.
   * A query producing zero result sets (e.g. a SELECT matching zero rows
   * runs fine and still produces one empty-values result set; only
   * non-SELECT statements produce none) returns `{"columns":[],"rows":[]}`. */
  async run(code: string, opts?: RunOptions): Promise<RunResult> {
    const started = performance.now();
    const SQL = await getSqlJs();
    const db = new SQL.Database();

    try {
      if (opts?.setupSql) {
        db.run(opts.setupSql);
      }

      const results = db.exec(code);
      const last = results[results.length - 1];
      const columns = last?.columns ?? [];
      const rows = last?.values ?? [];

      return {
        stdout: formatTable(columns, rows),
        stderr: "",
        value: JSON.stringify({ columns, rows }),
        durationMs: performance.now() - started,
      };
    } catch (err) {
      return {
        stdout: "",
        stderr: "",
        error: err instanceof Error ? err.message : String(err),
        durationMs: performance.now() - started,
      };
    } finally {
      db.close();
    }
  }
}

let singleton: SqlProvider | null = null;
export function getSqlProvider(): SqlProvider {
  if (!singleton) singleton = new SqlProvider();
  return singleton;
}

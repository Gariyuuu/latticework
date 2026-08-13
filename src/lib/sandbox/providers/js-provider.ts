"use client";

import type { RunOptions, RunResult, SandboxProvider } from "../types";

const WORKER_TIMEOUT_MS = 5000;

/** Runs inside a fresh, disposable Web Worker per `run()` call — isolated
 * from the main thread's DOM/cookies/localStorage by construction (a
 * dedicated Worker has none of those), with `fetch`/`XMLHttpRequest`/
 * `WebSocket`/`importScripts` explicitly stripped to honor
 * docs/SECURITY.md's "JS/TS via a sandboxed Web Worker with no DOM/network
 * access" requirement — Workers can otherwise make outbound network
 * requests by default, which that doc rules out. This is an MVP-level
 * guarantee (matches the effort level of every other provider here, not a
 * hardened boundary against a truly adversarial payload) since the only
 * code that ever runs here is the user's own, in their own browser tab.
 *
 * The student's `code` and every `cases[].call` expression are concatenated
 * into ONE script wrapped in a single `(async () => { ... })()` IIFE,
 * evaluated with ONE indirect eval call — not one eval per piece, and not
 * a plain (non-async) wrapper. Both were tried and rejected, verified by
 * actually running each design (see `verify-js-worker.mjs`, referenced
 * from ROADMAP.md), not assumed from spec-reading:
 * - Separate eval calls per piece: indirect eval's `function`/`var`
 *   declarations become real global-object properties (so they'd survive
 *   separate calls), but `const`/`let` do NOT — they live in a per-call
 *   lexical scope invisible to a later, separate eval call. Since
 *   idiomatic modern JS (`const isEven = (n) => ...`) uses `const`, that
 *   design silently breaks on every arrow-function exercise.
 * - A non-async wrapper: `code` and the eval-expression results are
 *   computed back-to-back in the same synchronous tick, so anything
 *   involving a Promise/setTimeout (e.g. `await delay(10)`) would be
 *   graded against STALE state — the results run before the async work
 *   finishes.
 * Wrapping everything in one `async` IIFE fixes both at once: everything
 * lives in the same function scope (so `const`/`let` "just work," no
 * global-object trick needed), and the student's code can use a real
 * top-level `await` inside it, which the worker's message handler then
 * itself awaits before collecting results — so async exercises resolve
 * fully before grading. */
const WORKER_SOURCE = `
self.fetch = undefined;
self.XMLHttpRequest = undefined;
self.WebSocket = undefined;
self.importScripts = undefined;

function __stringify(v) {
  if (v === undefined) return "undefined";
  if (typeof v === "string") return v;
  try { return JSON.stringify(v); } catch (e) { return String(v); }
}

self.onmessage = async function (e) {
  const code = e.data.code;
  const evalExpressions = e.data.evalExpressions || [];
  const logs = [];
  self.console.log = function () {
    logs.push(Array.prototype.map.call(arguments, function (a) {
      return typeof a === "string" ? a : __stringify(a);
    }).join(" "));
  };

  const resultLines = evalExpressions.map(function (expr, i) {
    return "try { __values[" + i + "] = __stringify(" + expr + "); } catch (__e) { __values[" + i +
      "] = \\"__ERROR__: \\" + (__e && __e.message ? __e.message : String(__e)); }";
  }).join("\\n");
  const combined =
    "(async () => {\\nconst __values = [];\\n" + code + "\\n" + resultLines + "\\nreturn __values;\\n})()";

  try {
    const values = await (0, eval)(combined);
    self.postMessage({ stdout: logs.join("\\n"), value: values.join("\\n---\\n") });
  } catch (err) {
    self.postMessage({ stdout: logs.join("\\n"), error: err && err.message ? err.message : String(err) });
  }
};
`;

let workerBlobUrl: string | null = null;
function getWorkerUrl(): string {
  if (!workerBlobUrl) {
    const blob = new Blob([WORKER_SOURCE], { type: "application/javascript" });
    workerBlobUrl = URL.createObjectURL(blob);
  }
  return workerBlobUrl;
}

interface WorkerReply {
  stdout: string;
  value?: string;
  error?: string;
}

function runInWorker(code: string, evalExpressions: string[] | undefined): Promise<WorkerReply> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(getWorkerUrl());
    const timer = setTimeout(() => {
      worker.terminate();
      reject(new Error(`Execution timed out after ${WORKER_TIMEOUT_MS}ms — check for an infinite loop.`));
    }, WORKER_TIMEOUT_MS);
    worker.onmessage = (e: MessageEvent<WorkerReply>) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(e.data);
    };
    worker.onerror = (e) => {
      clearTimeout(timer);
      worker.terminate();
      reject(new Error(e.message || "Worker error"));
    };
    worker.postMessage({ code, evalExpressions });
  });
}

export class JsProvider implements SandboxProvider {
  language = "javascript" as const;

  async ready() {}

  async run(code: string, opts?: RunOptions): Promise<RunResult> {
    const started = performance.now();
    try {
      const reply = await runInWorker(code, opts?.evalExpressions);
      return {
        stdout: reply.stdout,
        stderr: "",
        value: reply.value,
        error: reply.error,
        durationMs: performance.now() - started,
      };
    } catch (err) {
      return {
        stdout: "",
        stderr: "",
        error: err instanceof Error ? err.message : String(err),
        durationMs: performance.now() - started,
      };
    }
  }
}

const TS_VERSION = "5.9.3";
const TS_CDN_URL = `https://cdn.jsdelivr.net/npm/typescript@${TS_VERSION}/lib/typescript.js`;

interface TsCompiler {
  transpileModule(input: string, opts: unknown): { outputText: string; diagnostics?: unknown[] };
  ModuleKind: { None: number };
  ScriptTarget: { ES2020: number };
}

declare global {
  interface Window {
    ts?: TsCompiler;
  }
}

let tsScriptPromise: Promise<void> | null = null;
function loadTsCompiler(): Promise<void> {
  if (tsScriptPromise) return tsScriptPromise;
  tsScriptPromise = new Promise((resolve, reject) => {
    if (window.ts) return resolve();
    const script = document.createElement("script");
    script.src = TS_CDN_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load the TypeScript compiler from CDN"));
    document.head.appendChild(script);
  });
  return tsScriptPromise;
}

function transpile(ts: TsCompiler, source: string): string {
  return ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.None, target: ts.ScriptTarget.ES2020 },
  }).outputText;
}

/** TypeScript exercises grade by transpiling (stripping types via the real
 * `typescript` npm package's `transpileModule`, same version as this repo's
 * own `tsc`) then running the resulting JS through the exact same Worker as
 * JsProvider — NOT full static type-checking. `transpileModule` is a
 * per-file syntactic transform; it does not catch type errors across
 * declarations the way `tsc --noEmit` does. This means exercises here can
 * only meaningfully grade TS features with an observable RUNTIME footprint
 * (e.g. `typeof`/`instanceof` narrowing, a generic function's behavior
 * across call sites) — features that are purely compile-time with zero
 * runtime trace (utility types like `Partial<T>`, strict-mode config) have
 * nothing for this provider to grade and are deliberately left as
 * content-authoring gaps rather than force-fit, same discipline as every
 * other provider's documented subset. */
export class TsProvider implements SandboxProvider {
  language = "typescript" as const;

  async ready() {
    await loadTsCompiler();
  }

  async run(code: string, opts?: RunOptions): Promise<RunResult> {
    const started = performance.now();
    try {
      await loadTsCompiler();
      const ts = window.ts!;
      const transpiledCode = transpile(ts, code);
      const transpiledExpressions = (opts?.evalExpressions ?? []).map((expr) => {
        const out = transpile(ts, `(${expr})`);
        // transpileModule appends a trailing `;\n` and may wrap in parens differently;
        // strip a trailing semicolon/newline so it stays a bare expression for eval.
        return out.trim().replace(/;$/, "");
      });
      const reply = await runInWorker(transpiledCode, transpiledExpressions);
      return {
        stdout: reply.stdout,
        stderr: "",
        value: reply.value,
        error: reply.error,
        durationMs: performance.now() - started,
      };
    } catch (err) {
      return {
        stdout: "",
        stderr: "",
        error: err instanceof Error ? err.message : String(err),
        durationMs: performance.now() - started,
      };
    }
  }
}

let jsSingleton: JsProvider | null = null;
export function getJsProvider(): JsProvider {
  if (!jsSingleton) jsSingleton = new JsProvider();
  return jsSingleton;
}

let tsSingleton: TsProvider | null = null;
export function getTsProvider(): TsProvider {
  if (!tsSingleton) tsSingleton = new TsProvider();
  return tsSingleton;
}

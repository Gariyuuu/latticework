"use client";

import type { RunOptions, RunResult, SandboxProvider } from "../types";

const PYODIDE_VERSION = "0.26.4";
const CDN_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

// Minimal shape of the global Pyodide runtime we actually use — the real
// type lives in the pyodide package, which we deliberately don't bundle
// (it ships multi-megabyte wasm assets; loading it from the CDN only when
// a Python exercise is actually opened matches the "don't load Monaco
// until necessary" performance rule in docs/DESIGN_SYSTEM.md / brief §64).
interface PyodideRuntime {
  runPythonAsync(code: string): Promise<unknown>;
  setStdout(opts: { batched: (msg: string) => void }): void;
  setStderr(opts: { batched: (msg: string) => void }): void;
  loadPackage(names: string | string[], opts?: { messageCallback?: (msg: string) => void }): Promise<void>;
}

declare global {
  interface Window {
    loadPyodide?: (opts: { indexURL: string }) => Promise<PyodideRuntime>;
  }
}

let scriptPromise: Promise<void> | null = null;
let pyodidePromise: Promise<PyodideRuntime> | null = null;

function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (window.loadPyodide) return resolve();
    const script = document.createElement("script");
    script.src = `${CDN_BASE}pyodide.js`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Pyodide from CDN"));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

async function getPyodide(): Promise<PyodideRuntime> {
  if (pyodidePromise) return pyodidePromise;
  pyodidePromise = loadScript().then(() => {
    if (!window.loadPyodide) throw new Error("Pyodide failed to attach to window");
    return window.loadPyodide({ indexURL: CDN_BASE });
  });
  return pyodidePromise;
}

// loadPackage is safe to call repeatedly for the same package (Pyodide
// no-ops if it's already loaded), but tracking this ourselves avoids
// awaiting an extra microtask + Pyodide's own internal lookup on every
// single run of an exercise that was already loaded.
const loadedPackages = new Set<string>();

export class PyodideProvider implements SandboxProvider {
  language = "python" as const;

  async ready() {
    await getPyodide();
  }

  async run(code: string, opts?: RunOptions): Promise<RunResult> {
    const started = performance.now();
    const pyodide = await getPyodide();

    let stdout = "";
    let stderr = "";
    pyodide.setStdout({ batched: (msg) => (stdout += msg + "\n") });
    pyodide.setStderr({ batched: (msg) => (stderr += msg + "\n") });

    try {
      const toLoad = (opts?.packages ?? []).filter((p) => !loadedPackages.has(p));
      if (toLoad.length) {
        await pyodide.loadPackage(toLoad, { messageCallback: () => {} });
        for (const p of toLoad) loadedPackages.add(p);
      }

      await pyodide.runPythonAsync(code);

      const values: string[] = [];
      if (opts?.evalExpressions?.length) {
        for (const expr of opts.evalExpressions) {
          try {
            const result = await pyodide.runPythonAsync(`str(${expr})`);
            values.push(String(result));
          } catch (err) {
            values.push(`__ERROR__: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }

      return {
        stdout: stdout.trimEnd(),
        stderr: stderr.trimEnd(),
        value: values.join("\n---\n"),
        durationMs: performance.now() - started,
      };
    } catch (err) {
      return {
        stdout: stdout.trimEnd(),
        stderr: stderr.trimEnd(),
        error: err instanceof Error ? err.message : String(err),
        durationMs: performance.now() - started,
      };
    }
  }
}

let singleton: PyodideProvider | null = null;
export function getPyodideProvider(): PyodideProvider {
  if (!singleton) singleton = new PyodideProvider();
  return singleton;
}

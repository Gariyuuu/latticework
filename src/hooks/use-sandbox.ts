"use client";

import { useCallback, useRef, useState } from "react";
import { getSandboxProvider } from "@/lib/sandbox";
import type { RunOptions, RunResult, SandboxLanguage } from "@/lib/sandbox/types";

export function useSandbox(language: SandboxLanguage) {
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "running">("idle");
  const providerRef = useRef(getSandboxProvider(language));

  const run = useCallback(
    async (code: string, opts?: RunOptions): Promise<RunResult> => {
      setStatus((s) => (s === "ready" ? "running" : "loading"));
      try {
        await providerRef.current.ready();
        setStatus("running");
        const result = await providerRef.current.run(code, opts);
        setStatus("ready");
        return result;
      } catch (err) {
        setStatus("ready");
        return {
          stdout: "",
          stderr: "",
          error: err instanceof Error ? err.message : String(err),
          durationMs: 0,
        };
      }
    },
    []
  );

  return { run, status };
}

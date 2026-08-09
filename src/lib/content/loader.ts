import "server-only";

// The actual fs-reading implementation lives in loader-core.ts, which has
// no server-only guard so it can also be imported by scripts/content-sync.ts
// (run via tsx, outside Next's webpack build — server-only's runtime check
// throws unconditionally there). Next.js server components/routes should
// import from this file, not loader-core, so the client-bundling guard
// stays in effect for the app.
export * from "./loader-core";

import type { RunOptions, RunResult, SandboxProvider } from "../types";

/**
 * A deterministic, in-memory Unix-shell simulator — NOT a real bash/coreutils
 * runtime. There's no practical way to run real bash inside a browser tab for
 * this MVP (unlike Python/SQL, which have mature WASM runtimes), so this is a
 * from-scratch simulation of a well-defined subset of shell behavior, in the
 * same spirit as the Apache Spark track's verified pure-Python simulation of
 * Spark's execution model (see ROADMAP.md "Content coverage").
 *
 * Ground truth for exercise-authoring purposes is THIS implementation, run
 * headless in Node — not real bash. Common commands were cross-checked
 * against real bash/coreutils during development to keep behavior intuitive,
 * but exact output formatting (e.g. `ls`, `wc`) deliberately simplifies real
 * coreutils' column padding, since exercises grade by exact string match and
 * padding-heavy output is a poor fit for that. Never hand-type an expected
 * value for a cli-simulation exercise — generate it by actually running this
 * provider (e.g. via a scratch Node script that imports `CliProvider`).
 *
 * Gotcha worth remembering when authoring exercises: `echo ... > file`
 * appends a trailing newline to the written content (matching real bash), so
 * `cat`/`cp`/`mv` on that file reproduce that trailing newline verbatim —
 * `cat out.txt` after `echo hi > out.txt` returns "hi\n", not "hi". And
 * `wc -l` counts newline characters, not "logical lines" — a file containing
 * "a\nb\n" (two echo-terminated lines) reports 2, matching real coreutils,
 * not the count of non-empty lines.
 */

const HOME = "/home/user";

class CliError extends Error {}

interface DirEntry {
  name: string;
  isDir: boolean;
}

class Vfs {
  private files = new Map<string, string>();
  private dirs = new Set<string>(["/"]);
  private perms = new Map<string, string>();

  getPerm(path: string): string {
    return this.perms.get(path) ?? (this.dirs.has(path) ? "755" : "644");
  }

  setPerm(path: string, mode: string): void {
    this.perms.set(path, mode);
  }

  private normalize(path: string): string {
    const isAbsolute = path.startsWith("/");
    const parts = path.split("/").filter((p) => p.length > 0 && p !== ".");
    const stack: string[] = [];
    for (const part of parts) {
      if (part === "..") stack.pop();
      else stack.push(part);
    }
    const joined = "/" + stack.join("/");
    return isAbsolute || joined.startsWith("/") ? joined : joined;
  }

  resolve(cwd: string, input: string): string {
    if (input === "~") return HOME;
    if (input.startsWith("~/")) return this.normalize(HOME + "/" + input.slice(2));
    if (input.startsWith("/")) return this.normalize(input);
    return this.normalize(cwd + "/" + input);
  }

  exists(path: string): boolean {
    return path === "/" || this.dirs.has(path) || this.files.has(path);
  }

  isDir(path: string): boolean {
    return path === "/" || this.dirs.has(path);
  }

  isFile(path: string): boolean {
    return this.files.has(path);
  }

  private dirname(path: string): string {
    const idx = path.lastIndexOf("/");
    return idx <= 0 ? "/" : path.slice(0, idx);
  }

  private basename(path: string): string {
    const idx = path.lastIndexOf("/");
    return idx === -1 ? path : path.slice(idx + 1);
  }

  /** Creates every missing ancestor directory of `path` (not `path` itself). */
  private ensureAncestors(path: string): void {
    const parent = this.dirname(path);
    if (parent === "/") return;
    if (this.files.has(parent)) throw new CliError(`not a directory: ${parent}`);
    if (!this.dirs.has(parent)) {
      this.ensureAncestors(parent);
      this.dirs.add(parent);
    }
  }

  /** Used only for exercise setup (`initialFiles`) — always succeeds. */
  seedFile(path: string, content: string): void {
    const abs = this.normalize(path.startsWith("/") ? path : HOME + "/" + path);
    this.ensureAncestors(abs);
    this.files.set(abs, content);
  }

  ensureHome(): void {
    this.ensureAncestors(HOME + "/.");
    this.dirs.add(HOME);
  }

  mkdir(path: string, parents: boolean): void {
    if (this.dirs.has(path)) {
      if (!parents) throw new CliError(`mkdir: cannot create directory '${path}': File exists`);
      return;
    }
    if (this.files.has(path)) {
      throw new CliError(`mkdir: cannot create directory '${path}': File exists`);
    }
    const parent = this.dirname(path);
    if (!this.exists(parent)) {
      if (!parents) {
        throw new CliError(`mkdir: cannot create directory '${path}': No such file or directory`);
      }
      this.mkdir(parent, true);
    }
    this.dirs.add(path);
  }

  touch(path: string): void {
    if (this.dirs.has(path)) throw new CliError(`touch: cannot touch '${path}': Is a directory`);
    const parent = this.dirname(path);
    if (!this.exists(parent)) {
      throw new CliError(`touch: cannot touch '${path}': No such file or directory`);
    }
    if (!this.files.has(path)) this.files.set(path, "");
  }

  readFile(path: string): string {
    const content = this.files.get(path);
    if (content === undefined) throw new CliError(`No such file or directory: ${path}`);
    return content;
  }

  writeFile(path: string, content: string): void {
    if (this.dirs.has(path)) throw new CliError(`${path}: Is a directory`);
    const parent = this.dirname(path);
    if (!this.exists(parent)) throw new CliError(`${path}: No such file or directory`);
    this.files.set(path, content);
  }

  listDir(path: string): DirEntry[] {
    const prefix = path === "/" ? "/" : path + "/";
    const entries: DirEntry[] = [];
    const seen = new Set<string>();
    const collect = (set: Set<string> | Map<string, unknown>, isDir: boolean) => {
      for (const key of set instanceof Map ? set.keys() : set) {
        if (key === path || !key.startsWith(prefix)) continue;
        const rest = key.slice(prefix.length);
        if (rest.includes("/")) continue; // not a direct child
        if (seen.has(rest)) continue;
        seen.add(rest);
        entries.push({ name: rest, isDir });
      }
    };
    collect(this.dirs, true);
    collect(this.files, false);
    return entries;
  }

  remove(path: string): void {
    if (this.dirs.has(path)) {
      const prefix = path + "/";
      for (const key of [...this.dirs]) {
        if (key === path || key.startsWith(prefix)) {
          this.dirs.delete(key);
          this.perms.delete(key);
        }
      }
      for (const key of [...this.files.keys()]) {
        if (key.startsWith(prefix)) {
          this.files.delete(key);
          this.perms.delete(key);
        }
      }
    } else {
      this.files.delete(path);
      this.perms.delete(path);
    }
  }

  /** Recursively lists every descendant path under (and including) `path`. */
  walk(path: string): string[] {
    const results = [path];
    if (!this.dirs.has(path) && path !== "/") return results;
    const prefix = path === "/" ? "/" : path + "/";
    for (const key of this.dirs) if (key.startsWith(prefix)) results.push(key);
    for (const key of this.files.keys()) if (key.startsWith(prefix)) results.push(key);
    return results;
  }

  copyInto(src: string, dst: string, recursive: boolean): void {
    if (this.dirs.has(src)) {
      if (!recursive) {
        throw new CliError(`cp: -r not specified; omitting directory '${src}'`);
      }
      this.mkdir(dst, true);
      const prefix = src + "/";
      for (const key of this.dirs) {
        if (key.startsWith(prefix)) {
          const target = dst + "/" + key.slice(prefix.length);
          this.dirs.add(target);
          this.perms.set(target, this.getPerm(key));
        }
      }
      for (const [key, content] of this.files) {
        if (key.startsWith(prefix)) {
          const target = dst + "/" + key.slice(prefix.length);
          this.files.set(target, content);
          this.perms.set(target, this.getPerm(key));
        }
      }
    } else if (this.files.has(src)) {
      this.ensureAncestors(dst);
      this.files.set(dst, this.files.get(src)!);
      this.perms.set(dst, this.getPerm(src));
    } else {
      throw new CliError(`cp: cannot stat '${src}': No such file or directory`);
    }
  }

  /** If `dst` names an existing directory, returns the path `dst/basename(src)`; otherwise returns `dst` unchanged. */
  destinationFor(src: string, dst: string): string {
    if (this.dirs.has(dst)) return (dst === "/" ? "" : dst) + "/" + this.basename(src);
    return dst;
  }
}

/** Expands `$NAME`/`${NAME}` via `lookup`, except while inside single quotes
 * (matching real bash — single quotes suppress all expansion). An unset
 * variable expands to the empty string. */
function tokenize(line: string, lookup: (name: string) => string): string[] {
  const tokens: string[] = [];
  let cur = "";
  let inSingle = false;
  let inDouble = false;
  let hasCur = false;
  const push = () => {
    if (hasCur) tokens.push(cur);
    cur = "";
    hasCur = false;
  };
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inSingle) {
      if (ch === "'") inSingle = false;
      else {
        cur += ch;
        hasCur = true;
      }
      continue;
    }
    if (inDouble) {
      if (ch === '"') {
        inDouble = false;
        continue;
      }
      if (ch === "$") {
        const match = /^\$\{([A-Za-z_][A-Za-z0-9_]*)\}|^\$([A-Za-z_][A-Za-z0-9_]*)/.exec(line.slice(i));
        if (match) {
          cur += lookup(match[1] ?? match[2]);
          hasCur = true;
          i += match[0].length - 1;
          continue;
        }
      }
      cur += ch;
      hasCur = true;
      continue;
    }
    if (ch === "'") {
      inSingle = true;
      hasCur = true;
      continue;
    }
    if (ch === '"') {
      inDouble = true;
      hasCur = true;
      continue;
    }
    if (ch === " " || ch === "\t") {
      push();
      continue;
    }
    if (ch === ">") {
      push();
      if (line[i + 1] === ">") {
        tokens.push(">>");
        i++;
      } else {
        tokens.push(">");
      }
      continue;
    }
    if (ch === "$") {
      const match = /^\$\{([A-Za-z_][A-Za-z0-9_]*)\}|^\$([A-Za-z_][A-Za-z0-9_]*)/.exec(line.slice(i));
      if (match) {
        cur += lookup(match[1] ?? match[2]);
        hasCur = true;
        i += match[0].length - 1;
        continue;
      }
    }
    cur += ch;
    hasCur = true;
  }
  push();
  return tokens;
}

/** Splits file content into lines the way real coreutils tools see them: a
 * trailing newline terminates the last line rather than starting a new
 * (empty) one. `"a\nb\n"` -> `["a","b"]`, matching `"a\nb"` -> `["a","b"]` —
 * NOT the raw `String.split("\n")` result of `["a","b",""]`, which would
 * silently introduce a bogus trailing empty line into every command's
 * output for any file written via `echo > file` (which always ends in
 * `\n`). Affects every line-oriented command (grep/sort/uniq/sed/awk/
 * head/tail) — `wc -l` counts `\n` characters directly instead and doesn't
 * use this helper. */
function linesOf(content: string): string[] {
  if (content === "") return [];
  const lines = content.split("\n");
  if (lines[lines.length - 1] === "") lines.pop();
  return lines;
}

interface ParsedFlags {
  flags: Set<string>;
  positional: string[];
}

/** Splits argv into short-flag characters (e.g. "-la" -> {l,a}) and positional args. Stops treating "-" prefixed tokens as flags after the first non-flag token, matching typical coreutils argument order (flags before positionals). */
function parseFlags(args: string[]): ParsedFlags {
  const flags = new Set<string>();
  const positional: string[] = [];
  for (const arg of args) {
    if (arg.startsWith("-") && arg.length > 1 && positional.length === 0) {
      for (const ch of arg.slice(1)) flags.add(ch);
    } else {
      positional.push(arg);
    }
  }
  return { flags, positional };
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function globToRegExp(glob: string): RegExp {
  const pattern = glob.split("*").map(escapeRegExp).join(".*");
  return new RegExp(`^${pattern}$`);
}

type CommandHandler = (vfs: Vfs, state: ShellState, args: string[], stdin: string | null) => string;

interface ShellState {
  cwd: string;
  vars: Map<string, string>;
}

const PERM_CHARS: Record<string, string> = {
  "0": "---",
  "1": "--x",
  "2": "-w-",
  "3": "-wx",
  "4": "r--",
  "5": "r-x",
  "6": "rw-",
  "7": "rwx",
};

function formatPerm(mode: string): string {
  return mode
    .split("")
    .map((d) => PERM_CHARS[d] ?? "---")
    .join("");
}

const COMMANDS: Record<string, CommandHandler> = {
  pwd: (_vfs, state) => state.cwd,

  cd: (vfs, state, args) => {
    const target = args[0] ?? HOME;
    const path = vfs.resolve(state.cwd, target);
    if (!vfs.exists(path)) return `bash: cd: ${target}: No such file or directory`;
    if (!vfs.isDir(path)) return `bash: cd: ${target}: Not a directory`;
    state.cwd = path;
    return "";
  },

  ls: (vfs, state, args) => {
    const { flags, positional } = parseFlags(args);
    const showAll = flags.has("a");
    const long = flags.has("l");
    const targetArg = positional[0];
    const target = targetArg ? vfs.resolve(state.cwd, targetArg) : state.cwd;
    if (!vfs.exists(target)) return `ls: cannot access '${targetArg}': No such file or directory`;
    if (!vfs.isDir(target)) return targetArg ?? target;
    let entries = vfs.listDir(target);
    if (!showAll) entries = entries.filter((e) => !e.name.startsWith("."));
    entries.sort((a, b) => a.name.localeCompare(b.name));
    if (entries.length === 0) return "";
    if (long) {
      return entries
        .map((e) => {
          const childPath = (target === "/" ? "" : target) + "/" + e.name;
          return `${e.isDir ? "d" : "-"}${formatPerm(vfs.getPerm(childPath))}  ${e.name}${e.isDir ? "/" : ""}`;
        })
        .join("\n");
    }
    return entries.map((e) => (e.isDir ? `${e.name}/` : e.name)).join("  ");
  },

  mkdir: (vfs, state, args) => {
    const { flags, positional } = parseFlags(args);
    const parents = flags.has("p");
    const errors: string[] = [];
    for (const arg of positional) {
      const path = vfs.resolve(state.cwd, arg);
      try {
        vfs.mkdir(path, parents);
      } catch (err) {
        if (err instanceof CliError) errors.push(err.message);
        else throw err;
      }
    }
    return errors.join("\n");
  },

  touch: (vfs, state, args) => {
    const errors: string[] = [];
    for (const arg of args) {
      const path = vfs.resolve(state.cwd, arg);
      try {
        vfs.touch(path);
      } catch (err) {
        if (err instanceof CliError) errors.push(err.message);
        else throw err;
      }
    }
    return errors.join("\n");
  },

  cat: (vfs, state, args, stdin) => {
    if (args.length === 0) return stdin ?? "";
    const parts: string[] = [];
    for (const arg of args) {
      const path = vfs.resolve(state.cwd, arg);
      if (!vfs.exists(path)) parts.push(`cat: ${arg}: No such file or directory`);
      else if (vfs.isDir(path)) parts.push(`cat: ${arg}: Is a directory`);
      else parts.push(vfs.readFile(path));
    }
    return parts.join("\n");
  },

  echo: (_vfs, _state, args) => args.join(" "),

  rm: (vfs, state, args) => {
    const { flags, positional } = parseFlags(args);
    const recursive = flags.has("r") || flags.has("R");
    const force = flags.has("f");
    const errors: string[] = [];
    for (const arg of positional) {
      const path = vfs.resolve(state.cwd, arg);
      if (!vfs.exists(path)) {
        if (!force) errors.push(`rm: cannot remove '${arg}': No such file or directory`);
        continue;
      }
      if (vfs.isDir(path) && !recursive) {
        errors.push(`rm: cannot remove '${arg}': Is a directory`);
        continue;
      }
      vfs.remove(path);
    }
    return errors.join("\n");
  },

  cp: (vfs, state, args) => {
    const { flags, positional } = parseFlags(args);
    const recursive = flags.has("r") || flags.has("R");
    const [srcArg, dstArg] = positional;
    if (!srcArg || !dstArg) return "usage: cp [-r] source dest";
    const src = vfs.resolve(state.cwd, srcArg);
    const dst = vfs.destinationFor(src, vfs.resolve(state.cwd, dstArg));
    try {
      vfs.copyInto(src, dst, recursive);
      return "";
    } catch (err) {
      if (err instanceof CliError) return err.message;
      throw err;
    }
  },

  mv: (vfs, state, args) => {
    const { positional } = parseFlags(args);
    const [srcArg, dstArg] = positional;
    if (!srcArg || !dstArg) return "usage: mv source dest";
    const src = vfs.resolve(state.cwd, srcArg);
    if (!vfs.exists(src)) return `mv: cannot stat '${srcArg}': No such file or directory`;
    const dst = vfs.destinationFor(src, vfs.resolve(state.cwd, dstArg));
    try {
      vfs.copyInto(src, dst, true);
      vfs.remove(src);
      return "";
    } catch (err) {
      if (err instanceof CliError) return err.message;
      throw err;
    }
  },

  grep: (vfs, state, args, stdin) => {
    const { flags, positional } = parseFlags(args);
    const showLineNumbers = flags.has("n");
    const [pattern, fileArg] = positional;
    if (!pattern) return "usage: grep [-n] pattern [file]";
    let content: string;
    if (fileArg) {
      const path = vfs.resolve(state.cwd, fileArg);
      if (!vfs.exists(path)) return `grep: ${fileArg}: No such file or directory`;
      if (vfs.isDir(path)) return `grep: ${fileArg}: Is a directory`;
      content = vfs.readFile(path);
    } else if (stdin !== null) {
      content = stdin;
    } else {
      return "usage: grep [-n] pattern file";
    }
    let re: RegExp;
    try {
      re = new RegExp(pattern);
    } catch {
      re = new RegExp(escapeRegExp(pattern));
    }
    const lines = linesOf(content);
    const matches = lines
      .map((line, i) => ({ line, num: i + 1 }))
      .filter((entry) => re.test(entry.line));
    return matches.map((m) => (showLineNumbers ? `${m.num}:${m.line}` : m.line)).join("\n");
  },

  find: (vfs, state, args) => {
    const positional: string[] = [];
    let namePattern: string | null = null;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "-name") {
        namePattern = args[i + 1];
        i++;
      } else {
        positional.push(args[i]);
      }
    }
    const startArg = positional[0] ?? ".";
    const start = vfs.resolve(state.cwd, startArg);
    if (!vfs.exists(start)) return `find: '${startArg}': No such file or directory`;
    let paths = vfs.walk(start);
    if (namePattern) {
      const re = globToRegExp(namePattern);
      paths = paths.filter((p) => re.test(p.slice(p.lastIndexOf("/") + 1)));
    }
    return [...paths].sort().join("\n");
  },

  wc: (vfs, state, args, stdin) => {
    const { flags, positional } = parseFlags(args);
    const fileArg = positional[0];
    let content: string;
    if (fileArg) {
      const path = vfs.resolve(state.cwd, fileArg);
      if (!vfs.exists(path)) return `wc: ${fileArg}: No such file or directory`;
      if (vfs.isDir(path)) return `wc: ${fileArg}: Is a directory`;
      content = vfs.readFile(path);
    } else if (stdin !== null) {
      content = stdin;
    } else {
      return "usage: wc [-lwc] file";
    }
    const lineCount = (content.match(/\n/g) ?? []).length;
    const wordCount = content.trim() === "" ? 0 : content.trim().split(/\s+/).length;
    const charCount = content.length;
    const only = flags.has("l") || flags.has("w") || flags.has("c") ? flags : null;
    const parts: string[] = [];
    if (only) {
      if (only.has("l")) parts.push(String(lineCount));
      if (only.has("w")) parts.push(String(wordCount));
      if (only.has("c")) parts.push(String(charCount));
    } else {
      parts.push(String(lineCount), String(wordCount), String(charCount));
    }
    if (fileArg) parts.push(fileArg);
    return parts.join(" ");
  },

  head: (vfs, state, args, stdin) => headOrTail(vfs, state, args, stdin, "head"),
  tail: (vfs, state, args, stdin) => headOrTail(vfs, state, args, stdin, "tail"),

  chmod: (vfs, state, args) => {
    const [mode, ...paths] = args;
    if (!mode || paths.length === 0) return "usage: chmod MODE file...";
    const errors: string[] = [];
    for (const p of paths) {
      const path = vfs.resolve(state.cwd, p);
      if (!vfs.exists(path)) {
        errors.push(`chmod: cannot access '${p}': No such file or directory`);
        continue;
      }
      if (/^[0-7]{3}$/.test(mode)) {
        vfs.setPerm(path, mode);
      } else if (mode === "+x" || mode === "-x") {
        const digits = vfs
          .getPerm(path)
          .split("")
          .map((d) => String(mode === "+x" ? (Number(d) | 1) : Number(d) & 6));
        vfs.setPerm(path, digits.join(""));
      } else {
        errors.push(`chmod: invalid mode: '${mode}'`);
      }
    }
    return errors.join("\n");
  },

  export: (_vfs, state, args) => {
    for (const arg of args) {
      const idx = arg.indexOf("=");
      if (idx > 0) state.vars.set(arg.slice(0, idx), arg.slice(idx + 1));
    }
    return "";
  },

  sort: (vfs, state, args, stdin) => {
    const { flags, positional } = parseFlags(args);
    const numeric = flags.has("n");
    const reverse = flags.has("r");
    const fileArg = positional[0];
    let content: string;
    if (fileArg) {
      const path = vfs.resolve(state.cwd, fileArg);
      if (!vfs.exists(path)) return `sort: cannot read: ${fileArg}: No such file or directory`;
      content = vfs.readFile(path);
    } else if (stdin !== null) {
      content = stdin;
    } else {
      return "usage: sort [-n] [-r] [file]";
    }
    const lines = linesOf(content);
    lines.sort((a, b) => (numeric ? Number(a) - Number(b) : a.localeCompare(b)));
    if (reverse) lines.reverse();
    return lines.join("\n");
  },

  uniq: (vfs, state, args, stdin) => {
    const { flags, positional } = parseFlags(args);
    const showCount = flags.has("c");
    const fileArg = positional[0];
    let content: string;
    if (fileArg) {
      const path = vfs.resolve(state.cwd, fileArg);
      if (!vfs.exists(path)) return `uniq: cannot read: ${fileArg}: No such file or directory`;
      content = vfs.readFile(path);
    } else if (stdin !== null) {
      content = stdin;
    } else {
      return "usage: uniq [-c] [file]";
    }
    const lines = linesOf(content);
    const out: { line: string; count: number }[] = [];
    for (const line of lines) {
      const last = out[out.length - 1];
      if (last && last.line === line) last.count++;
      else out.push({ line, count: 1 });
    }
    return out.map((e) => (showCount ? `${e.count} ${e.line}` : e.line)).join("\n");
  },

  /** Supports only the single most common sed idiom, `s/pattern/replacement/[g]` — a
   * deliberate, documented subset (see the file-level docstring), not full sed. */
  sed: (vfs, state, args, stdin) => {
    const [script, fileArg] = args;
    const match = script ? /^s\/(.*)\/(.*)\/(g?)$/.exec(script) : null;
    if (!match) {
      return `sed: unsupported script (only 's/pattern/replacement/[g]' is supported): ${script ?? ""}`;
    }
    const [, pattern, replacement, gFlag] = match;
    let content: string;
    if (fileArg) {
      const path = vfs.resolve(state.cwd, fileArg);
      if (!vfs.exists(path)) return `sed: can't read ${fileArg}: No such file or directory`;
      content = vfs.readFile(path);
    } else if (stdin !== null) {
      content = stdin;
    } else {
      return "usage: sed 's/pattern/replacement/[g]' [file]";
    }
    let re: RegExp;
    try {
      re = new RegExp(pattern, gFlag ? "g" : "");
    } catch {
      re = new RegExp(escapeRegExp(pattern), gFlag ? "g" : "");
    }
    const safeReplacement = replacement.replace(/\$/g, "$$$$");
    const lines = linesOf(content);
    return lines.map((line) => line.replace(re, safeReplacement)).join("\n");
  },

  /** Supports only the single most common awk idiom, `{print $N}` (1-indexed,
   * whitespace-separated field) — a deliberate, documented subset. */
  awk: (vfs, state, args, stdin) => {
    const [script, fileArg] = args;
    const match = script ? /^\{print \$(\d+)\}$/.exec(script) : null;
    if (!match) {
      return `awk: unsupported script (only '{print $N}' is supported): ${script ?? ""}`;
    }
    const field = Number(match[1]);
    let content: string;
    if (fileArg) {
      const path = vfs.resolve(state.cwd, fileArg);
      if (!vfs.exists(path)) return `awk: can't open file ${fileArg}`;
      content = vfs.readFile(path);
    } else if (stdin !== null) {
      content = stdin;
    } else {
      return "usage: awk '{print $N}' [file]";
    }
    const lines = linesOf(content);
    return lines
      .map((line) => {
        const fields = line.trim() === "" ? [] : line.trim().split(/\s+/);
        return fields[field - 1] ?? "";
      })
      .join("\n");
  },
};

function headOrTail(
  vfs: Vfs,
  state: ShellState,
  args: string[],
  stdin: string | null,
  which: "head" | "tail"
): string {
  let n = 10;
  const positional: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "-n") {
      n = Number(args[i + 1]);
      i++;
    } else if (/^-n\d+$/.test(args[i])) {
      n = Number(args[i].slice(2));
    } else {
      positional.push(args[i]);
    }
  }
  const fileArg = positional[0];
  let content: string;
  if (fileArg) {
    const path = vfs.resolve(state.cwd, fileArg);
    if (!vfs.exists(path)) return `${which}: ${fileArg}: No such file or directory`;
    if (vfs.isDir(path)) return `${which}: error reading '${fileArg}': Is a directory`;
    content = vfs.readFile(path);
  } else if (stdin !== null) {
    content = stdin;
  } else {
    return `usage: ${which} [-n N] file`;
  }
  const lines = linesOf(content);
  return (which === "head" ? lines.slice(0, n) : lines.slice(-n)).join("\n");
}

/** Splits a raw line into pipeline stages on top-level `|` (not inside quotes). */
function splitPipeline(line: string): string[] {
  const segments: string[] = [];
  let cur = "";
  let inSingle = false;
  let inDouble = false;
  for (const ch of line) {
    if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === '"' && !inSingle) inDouble = !inDouble;
    if (ch === "|" && !inSingle && !inDouble) {
      segments.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  segments.push(cur);
  return segments.map((s) => s.trim()).filter((s) => s.length > 0);
}

function lookupVar(state: ShellState, name: string): string {
  if (name === "HOME") return HOME;
  if (name === "PWD") return state.cwd;
  return state.vars.get(name) ?? "";
}

/** Runs a single pipeline stage (no `|` in it): tokenizes with variable
 * expansion, handles a bare `NAME=value` assignment, dispatches to a
 * command, and applies `>`/`>>` redirection if present. */
function runStage(vfs: Vfs, state: ShellState, rawSegment: string, stdin: string | null): string {
  const tokens = tokenize(rawSegment, (name) => lookupVar(state, name));
  if (tokens.length === 0) return "";

  let redirect: { append: boolean; target: string } | null = null;
  const argTokens: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] === ">" || tokens[i] === ">>") {
      const target = tokens[i + 1];
      if (!target) return "bash: syntax error near unexpected token `newline'";
      redirect = { append: tokens[i] === ">>", target };
      i++;
      continue;
    }
    argTokens.push(tokens[i]);
  }

  const [cmd, ...args] = argTokens;
  if (!cmd) return "";

  if (args.length === 0 && /^[A-Za-z_][A-Za-z0-9_]*=/.test(cmd)) {
    const idx = cmd.indexOf("=");
    state.vars.set(cmd.slice(0, idx), cmd.slice(idx + 1));
    return "";
  }

  const handler = COMMANDS[cmd];
  if (!handler) return `bash: ${cmd}: command not found`;

  try {
    const output = handler(vfs, state, args, stdin);
    if (redirect) {
      const path = vfs.resolve(state.cwd, redirect.target);
      let existing = "";
      if (redirect.append) {
        try {
          existing = vfs.readFile(path);
        } catch {
          existing = "";
        }
      }
      const sep = existing && !existing.endsWith("\n") ? "\n" : "";
      const next = existing + sep + output + "\n";
      vfs.writeFile(path, next);
      return "";
    }
    return output;
  } catch (err) {
    if (err instanceof CliError) return err.message;
    throw err;
  }
}

/** Runs a full line, threading each pipeline stage's output into the next
 * stage's stdin (e.g. `cat f.txt | grep foo | wc -l`). */
function runLine(vfs: Vfs, state: ShellState, rawLine: string): string {
  const stages = splitPipeline(rawLine);
  let output = "";
  let stdin: string | null = null;
  for (const stage of stages) {
    output = runStage(vfs, state, stage, stdin);
    stdin = output;
  }
  return output;
}

function splitLines(code: string): string[] {
  return code.split("\n").map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith("#"));
}

export class CliProvider implements SandboxProvider {
  language = "bash" as const;

  async ready() {
    // Pure in-memory simulator — nothing to load.
  }

  async run(code: string, opts?: RunOptions): Promise<RunResult> {
    const started = performance.now();
    try {
      const vfs = new Vfs();
      vfs.ensureHome();
      for (const [path, content] of Object.entries(opts?.initialFiles ?? {})) {
        vfs.seedFile(path, content);
      }
      const state: ShellState = { cwd: HOME, vars: new Map() };

      const scriptOutputs: string[] = [];
      for (const line of splitLines(code)) {
        const out = runLine(vfs, state, line);
        if (out) scriptOutputs.push(out);
      }

      let value: string | undefined;
      if (opts?.evalExpressions?.length) {
        const values: string[] = [];
        for (const expr of opts.evalExpressions) {
          try {
            values.push(runLine(vfs, state, expr));
          } catch (err) {
            values.push(`__ERROR__: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
        value = values.join("\n---\n");
      }

      return {
        stdout: scriptOutputs.join("\n"),
        stderr: "",
        value,
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

let singleton: CliProvider | null = null;
export function getCliProvider(): CliProvider {
  if (!singleton) singleton = new CliProvider();
  return singleton;
}

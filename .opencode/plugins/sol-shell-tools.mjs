import { mkdtemp, readFile, readdir, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { tool } from "@opencode-ai/plugin";

const KNOWN_REPOS = [
  "alvorada",
  "cruzeiro",
  "operators-private",
  "opencode-plugins-private",
  "cruzeiro-ai-shared-private",
];

const COMMON_REPO_ROOTS = [
  "C:\\laragon\\www",
  path.join(os.homedir(), "code"),
  path.join(os.homedir(), "repos"),
  path.join(os.homedir(), "projects"),
  path.join(os.homedir(), "src"),
];

const SHELL_PREFERENCE = ["bash", "pwsh", "powershell"];

function psQuote(value) {
  return `'${String(value ?? "").replace(/'/g, "''")}'`;
}

function shQuote(value) {
  return `'${String(value ?? "").replace(/'/g, `'"'"'`)}'`;
}

function cleanLines(raw) {
  return String(raw || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

async function readTextIfExists(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

async function pathExists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function listSubdirs(root) {
  try {
    const entries = await readdir(root, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(root, entry.name));
  } catch {
    return [];
  }
}

async function findRepoCandidates(query) {
  const lowerQuery = String(query || "").trim().toLowerCase();
  if (!lowerQuery) {
    return [];
  }

  const exactMatches = [];
  const fuzzyMatches = [];

  for (const root of COMMON_REPO_ROOTS) {
    if (!(await pathExists(root))) {
      continue;
    }
    const subdirs = await listSubdirs(root);
    for (const subdir of subdirs) {
      const name = path.basename(subdir).toLowerCase();
      if (name === lowerQuery) {
        exactMatches.push(subdir);
        continue;
      }
      if (name.includes(lowerQuery)) {
        fuzzyMatches.push(subdir);
      }
    }
  }

  return [...new Set([...exactMatches, ...fuzzyMatches])];
}

async function runCommand(cmd, options = {}) {
  const proc = Bun.spawn({
    cmd,
    cwd: options.cwd,
    stdin: options.stdin ?? "ignore",
    stdout: options.stdout ?? "pipe",
    stderr: options.stderr ?? "pipe",
    env: options.env,
  });

  const stdoutPromise = proc.stdout
    ? new Response(proc.stdout).text().catch(() => "")
    : Promise.resolve("");
  const stderrPromise = proc.stderr
    ? new Response(proc.stderr).text().catch(() => "")
    : Promise.resolve("");
  const [stdout, stderr, exitCode] = await Promise.all([
    stdoutPromise,
    stderrPromise,
    proc.exited,
  ]);

  return { stdout, stderr, exitCode };
}

function detectPreferredShell() {
  for (const shell of SHELL_PREFERENCE) {
    if (Bun.which(shell)) {
      return shell;
    }
  }
  throw new Error("No supported shell found. Install bash, pwsh, or powershell.");
}

function shellCommand(shell, script) {
  if (shell === "bash") {
    return ["bash", "-lc", script];
  }
  if (shell === "pwsh") {
    return ["pwsh", "-NoProfile", "-Command", script];
  }
  return ["powershell", "-NoProfile", "-Command", script];
}

function buildZPickScript(shell, outFile, query) {
  if (shell === "bash") {
    const queryArg = query ? ` ${shQuote(query)}` : "";
    return `zoxide query --interactive --all${queryArg} > ${shQuote(outFile)}`;
  }
  const zQuery = query ? ` ${psQuote(query)}` : "";
  return `& zoxide query --interactive --all${zQuery} | Set-Content -LiteralPath ${psQuote(outFile)}`;
}

function buildPathPickScript(shell, fdArgs, root, outFile) {
  if (shell === "bash") {
    const fdArgString = fdArgs.map(shQuote).join(" ");
    return [
      `picked=$(fd ${fdArgString} ${shQuote(root)} | fzf --height 40% --layout reverse --border --prompt 'pick> ')`,
      "status=$?",
      "if [ $status -gt 1 ]; then exit $status; fi",
      `if [ -n \"$picked\" ]; then printf '%s\n' \"$picked\" > ${shQuote(outFile)}; fi`,
    ].join("; ");
  }

  const fdArgString = fdArgs.map(psQuote).join(" ");
  return [
    `$items = & fd ${fdArgString} ${psQuote(root)}`,
    "if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }",
    "$picked = $items | & fzf --height ~40% --layout reverse --border --prompt 'pick> '",
    "if ($LASTEXITCODE -gt 1) { exit $LASTEXITCODE }",
    `if ($picked) { Set-Content -LiteralPath ${psQuote(outFile)} -Value $picked }`,
  ].join("; ");
}

async function runInteractiveShell(script, options = {}) {
  const shell = options.shell || detectPreferredShell();
  const result = await runCommand(shellCommand(shell, script), {
    cwd: options.cwd,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  return { ...result, shell };
}

async function resolveQueryPaths(query, { list = false, all = true } = {}) {
  const command = ["zoxide", "query"];
  if (all) {
    command.push("--all");
  }
  if (list) {
    command.push("--list");
  }
  command.push(query);

  const result = await runCommand(command, { cwd: directory });
  const zoxideMatches = result.exitCode === 0 ? cleanLines(result.stdout) : [];
  const fallbackMatches = await findRepoCandidates(query);
  const matches = [...new Set([...zoxideMatches, ...fallbackMatches])];

  return {
    matches,
    error: result.exitCode === 0 || matches.length > 0
      ? null
      : (result.stderr.trim() || "not found"),
    source: {
      zoxide: zoxideMatches,
      fallback: fallbackMatches,
    },
  };
}

function looksLikePathQuery(value) {
  const text = String(value || "").trim();
  if (!text) {
    return false;
  }
  return /^[a-zA-Z]:[\\/]/.test(text) || text.startsWith(".") || text.startsWith("~") || /[\\/]/.test(text);
}

async function resolveNavigationPath(target, { base = directory, mustExist = true } = {}) {
  if (!target) {
    return path.resolve(base);
  }

  const raw = String(target).trim();
  const expanded = raw.startsWith("~") ? path.join(os.homedir(), raw.slice(1)) : raw;

  if (looksLikePathQuery(expanded)) {
    const literal = path.isAbsolute(expanded) ? path.normalize(expanded) : path.resolve(base, expanded);
    if (!mustExist || await pathExists(literal)) {
      return literal;
    }
  }

  const resolved = await resolveQueryPaths(raw, { all: true });
  if (resolved.matches.length > 0) {
    return resolved.matches[0];
  }

  const fallback = path.isAbsolute(expanded) ? path.normalize(expanded) : path.resolve(base, expanded);
  if (!mustExist || await pathExists(fallback)) {
    return fallback;
  }

  throw new Error(resolved.error || `No matching path found for: ${raw}`);
}

async function withTempDir(prefix, fn) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), prefix));
  try {
    return await fn(tempDir);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function buildFdArgs({ mode, hidden, query }) {
  const args = ["--absolute-path"];
  if (hidden) {
    args.push("--hidden", "--follow");
  }
  if (mode === "file") {
    args.push("--type", "file");
  } else if (mode === "dir") {
    args.push("--type", "directory");
  }
  args.push(query || ".");
  return args;
}

export async function SolShellToolsPlugin({ directory }) {
  return {
    tool: {
      sol_shell_z_query: tool({
        description: "Resolve a zoxide path by nickname or query",
        args: {
          query: tool.schema.string().min(1).describe("zoxide query string"),
          list: tool.schema.boolean().default(false).describe("List all matching directories instead of selecting the top result"),
          all: tool.schema.boolean().default(true).describe("Include unavailable directories when listing results"),
        },
        async execute(args) {
          const resolved = await resolveQueryPaths(args.query, { list: args.list, all: args.all });
          if (resolved.matches.length === 0) {
            throw new Error(resolved.error || "No matching paths found");
          }
          return JSON.stringify({
            query: args.query,
            list: args.list,
            matches: resolved.matches,
            path: args.list ? null : (resolved.matches[0] || null),
          }, null, 2);
        },
      }),

      sol_shell_repo_map: tool({
        description: "Resolve the main known repo aliases through zoxide",
        args: {},
        async execute() {
          const repos = [];
          for (const alias of KNOWN_REPOS) {
            const resolved = await resolveQueryPaths(alias, { all: true });
            repos.push({
              alias,
              path: resolved.matches[0] || null,
              error: resolved.error,
            });
          }
          return JSON.stringify({ repos }, null, 2);
        },
      }),

      sol_shell_z_pick: tool({
        description: "Interactively choose a zoxide path",
        args: {
          query: tool.schema.string().optional().describe("Optional initial zoxide query"),
        },
        async execute(args) {
          return withTempDir("sol-shell-tools-zpick-", async (tempDir) => {
            const outFile = path.join(tempDir, "selected.txt");
            const shell = detectPreferredShell();
            const script = buildZPickScript(shell, outFile, args.query);
            const result = await runInteractiveShell(script, {
              cwd: directory,
              shell,
            });
            const selected = cleanLines(await readTextIfExists(outFile))[0] || null;
            return JSON.stringify({
              query: args.query || null,
              shell: result.shell,
              path: selected,
              cancelled: !selected,
              exitCode: result.exitCode,
            }, null, 2);
          });
        },
      }),

      sol_shell_path_pick: tool({
        description: "Choose a file or directory with fd and fzf",
        args: {
          root: tool.schema.string().optional().describe("Root directory or zoxide query for the picker. Defaults to the current OpenCode directory"),
          mode: tool.schema.enum(["file", "dir", "any"]).default("any").describe("What kind of path to select"),
          query: tool.schema.string().optional().describe("Initial search query or fd pattern"),
          hidden: tool.schema.boolean().default(true).describe("Include hidden files and directories"),
        },
        async execute(args) {
          return withTempDir("sol-shell-tools-pathpick-", async (tempDir) => {
            const root = await resolveNavigationPath(args.root, { base: directory, mustExist: true });
            const outFile = path.join(tempDir, "selected.txt");
            const fdArgs = buildFdArgs({ mode: args.mode, hidden: args.hidden, query: args.query });
            const shell = detectPreferredShell();
            const script = buildPathPickScript(shell, fdArgs, root, outFile);
            const result = await runInteractiveShell(script, {
              cwd: root,
              shell,
            });
            const selected = cleanLines(await readTextIfExists(outFile))[0] || null;
            return JSON.stringify({
              root,
              mode: args.mode,
              shell: result.shell,
              path: selected,
              cancelled: !selected,
              exitCode: result.exitCode,
            }, null, 2);
          });
        },
      }),

      sol_shell_yazi_pick: tool({
        description: "Browse and choose files or directories with yazi",
        args: {
          root: tool.schema.string().optional().describe("Root directory or zoxide query to open in yazi. Defaults to the current OpenCode directory"),
        },
        async execute(args) {
          return withTempDir("sol-shell-tools-yazi-", async (tempDir) => {
            const root = await resolveNavigationPath(args.root, { base: directory, mustExist: true });
            const chooserFile = path.join(tempDir, "chooser.txt");
            const cwdFile = path.join(tempDir, "cwd.txt");
            const result = await runCommand([
              "yazi",
              root,
              `--chooser-file=${chooserFile}`,
              `--cwd-file=${cwdFile}`,
            ], {
              cwd: root,
              stdin: "inherit",
              stdout: "inherit",
              stderr: "inherit",
            });
            const selected = cleanLines(await readTextIfExists(chooserFile));
            const cwd = cleanLines(await readTextIfExists(cwdFile))[0] || root;
            return JSON.stringify({
              root,
              cwd,
              selected,
              cancelled: selected.length === 0,
              exitCode: result.exitCode,
            }, null, 2);
          });
        },
      }),

      sol_shell_ls_pretty: tool({
        description: "List a directory with lsd formatting",
        args: {
          path: tool.schema.string().optional().describe("Path or zoxide query to list. Defaults to the current OpenCode directory"),
          all: tool.schema.boolean().default(true).describe("Include hidden entries"),
        },
        async execute(args) {
          const target = await resolveNavigationPath(args.path, { base: directory, mustExist: true });
          const command = ["lsd", "--group-dirs", "first", "--date", "relative"];
          if (args.all) {
            command.push("-la");
          }
          command.push(target);
          const result = await runCommand(command, { cwd: target });
          if (result.exitCode !== 0) {
            throw new Error(result.stderr.trim() || `lsd failed with exit code ${result.exitCode}`);
          }
          return JSON.stringify({
            path: target,
            listing: result.stdout,
          }, null, 2);
        },
      }),
    },
  };
}

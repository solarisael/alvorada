import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tool } from "@opencode-ai/plugin";

const CRUZEIRO_REPO_DEFS = [
  {
    id: "frontend",
    relPath: "frontend",
    keywords: ["frontend", "react", "vite"],
  },
  { id: "backend", relPath: "backend", keywords: ["backend", "php", "api"] },
  {
    id: "ai-shared",
    relPath: "ai-shared",
    keywords: ["shared", "orchestrator", "opencode"],
  },
  {
    id: "infrastructure",
    relPath: "infrastructure",
    keywords: ["infrastructure", "deploy", "podman", "runtime"],
  },
];
const SOUND_EXTENSIONS = new Set([".mp3", ".wav"]);
const BRANCH_PART_DELIMITER = "--";
const DEFAULT_RUNTIME_SUBPATH = path.join(
  ".opencode",
  "runtime",
  "sol-orchestrator",
);
const ADAPTER_CONFIG_BASENAME = "sol-orchestrator.json";
const INSTALL_PLUGIN_ALLOWLIST = [
  "notification-sounds.ts",
  "sol-anthropic-bypass.mjs",
  "sol-orchestrator.mjs",
];
const COMMAND_TEMPLATE_SUBDIR = path.join("instructions", "commands");
const PROJECT_COMMAND_TEMPLATE_FILES = [
  "LAZY.md",
  "sol-plugins.md",
  "orchestrator-install.md",
  "install-sol-runtime.md",
  "orchestrator.md",
  "orchestrator-duel.md",
  "orchestrator-status.md",
  "delegate.md",
  "duel.md",
];
const MODEL_LIBRARY = {
  anthropic: {
    primary: ["claude-opus-4-6", "claude-sonnet-4-6"],
    extended: [],
  },
  openai: {
    primary: ["gpt-5.4", "gpt-5-codex", "gpt-5.3-codex-spark"],
    extended: ["gpt-5.4-mini"],
  },
};
const MODEL_PROFILES = {
  "gpt-5.4": {
    providerID: "openai",
    label: "GPT-5.4",
    temperament: "independent",
    strengths: ["broad implementation", "complex bugs", "long agent runs"],
    risks: ["overreach", "missed nuance", "gratuitous refactors"],
    bestFor: ["default builder", "backend work", "general coding"],
  },
  "gpt-5-codex": {
    providerID: "openai",
    label: "GPT-5-Codex",
    temperament: "surgical",
    strengths: ["contained edits", "agentic coding loops", "codemods"],
    risks: ["narrower taste", "less broad judgment"],
    bestFor: ["focused code worker", "patch lane", "mechanical implementation"],
  },
  "gpt-5.3-codex-spark": {
    providerID: "openai",
    label: "GPT-5.3-Codex-Spark",
    temperament: "rapid",
    strengths: ["speed", "drafting", "quick scouting"],
    risks: ["shallower judgment", "not ideal for final review"],
    bestFor: ["fast scout", "cheap first pass", "quick experiments"],
  },
  "claude-sonnet-4-6": {
    providerID: "anthropic",
    label: "Claude Sonnet 4.6",
    temperament: "warm-balanced",
    strengths: ["review", "context reading", "collaborative iteration"],
    risks: ["overthinking", "verbosity", "tool drift"],
    bestFor: ["reviewer", "polisher", "co-builder"],
  },
  "claude-opus-4-6": {
    providerID: "anthropic",
    label: "Claude Opus 4.6",
    temperament: "deep",
    strengths: ["architecture", "hard debugging", "high-stakes reasoning"],
    risks: ["cost", "latency", "too much depth for routine work"],
    bestFor: ["hard-problem lane", "adjudication", "deep review"],
  },
};
const ORCHESTRATOR_PRESETS = {
  default: {
    id: "default",
    rationale: "default independent builder with balanced reviewer",
    lanes: [
      { providerID: "openai", modelID: "gpt-5.4", role: "implementer" },
      {
        providerID: "anthropic",
        modelID: "claude-sonnet-4-6",
        role: "reviewer",
      },
    ],
  },
  fast: {
    id: "fast",
    rationale: "speed-first scouting and draft pass",
    lanes: [
      { providerID: "openai", modelID: "gpt-5.3-codex-spark", role: "scout" },
      {
        providerID: "anthropic",
        modelID: "claude-sonnet-4-6",
        role: "reviewer",
      },
    ],
  },
  codemod: {
    id: "codemod",
    rationale: "contained code manipulation with balanced review",
    lanes: [
      { providerID: "openai", modelID: "gpt-5-codex", role: "implementer" },
      {
        providerID: "anthropic",
        modelID: "claude-sonnet-4-6",
        role: "reviewer",
      },
    ],
  },
  deep: {
    id: "deep",
    rationale: "high-stakes debugging or architecture work",
    lanes: [
      {
        providerID: "anthropic",
        modelID: "claude-opus-4-6",
        role: "architect",
      },
      { providerID: "openai", modelID: "gpt-5.4", role: "implementer" },
    ],
  },
  review: {
    id: "review",
    rationale: "collaborative review and refinement with bounded execution",
    lanes: [
      {
        providerID: "anthropic",
        modelID: "claude-sonnet-4-6",
        role: "reviewer",
      },
      { providerID: "openai", modelID: "gpt-5.4", role: "implementer" },
    ],
  },
  duel: {
    id: "duel",
    rationale: "default side-by-side frontier comparison",
    lanes: [
      { providerID: "openai", modelID: "gpt-5.4", role: "implementer" },
      {
        providerID: "anthropic",
        modelID: "claude-sonnet-4-6",
        role: "implementer",
      },
    ],
  },
};
const DEFAULT_LANES = [
  {
    providerID: "openai",
    modelID: MODEL_LIBRARY.openai.primary[0],
    role: "implementer",
  },
  {
    providerID: "anthropic",
    modelID: MODEL_LIBRARY.anthropic.primary[1],
    role: "reviewer",
  },
];
const RESERVED_BRANCHES = new Set([
  "main",
  "master",
  "test",
  "prod",
  "production",
]);

function slugifySegment(value, fallback = "task") {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return normalized || fallback;
}

function unique(items) {
  return [...new Set(items)];
}

function nowStamp() {
  return new Date().toISOString();
}

function pluginSourceRoot() {
  const pluginFile = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(pluginFile), "..");
}

function createJobId(taskSlug) {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14);
  const random = Math.random().toString(36).slice(2, 8);
  return `${stamp}-${taskSlug}-${random}`;
}

function abbreviate(text, max = 280) {
  const clean = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  if (clean.length <= max) {
    return clean;
  }
  return `${clean.slice(0, max - 3)}...`;
}

async function pathExists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function findAncestorWithRelativePath(start, relativePath) {
  if (!start) {
    return null;
  }

  let current = path.resolve(start);
  for (;;) {
    const candidate = path.join(current, relativePath);
    if (await pathExists(candidate)) {
      return candidate;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

async function readJson(target, fallback = null) {
  try {
    const raw = await readFile(target, "utf8");
    return parseJsonLoose(raw);
  } catch {
    return fallback;
  }
}

function parseJsonLoose(raw) {
  const source = String(raw || "").replace(/^\uFEFF/, "");
  const withoutBlockComments = source.replace(/\/\*[\s\S]*?\*\//g, "");
  const withoutLineComments = withoutBlockComments.replace(
    /(^|[^:\\])\/\/.*$/gm,
    "$1",
  );
  const withoutTrailingCommas = withoutLineComments.replace(
    /,(\s*[}\]])/g,
    "$1",
  );
  return JSON.parse(withoutTrailingCommas);
}

async function writeJson(target, value) {
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function getGitRoot($, directory) {
  const result = await $`git -C ${directory} rev-parse --show-toplevel`
    .nothrow()
    .quiet();
  if (result.exitCode !== 0) {
    return null;
  }
  return result.text().trim() || null;
}

async function getGitBranch($, directory) {
  const result = await $`git -C ${directory} branch --show-current`
    .nothrow()
    .quiet();
  if (result.exitCode !== 0) {
    return "";
  }
  return result.text().trim();
}

async function inferOperator($, directory) {
  const envOperator = process.env.OPENCODE_OPERATOR || process.env.OPERATOR;
  if (envOperator) {
    return slugifySegment(envOperator, "operator");
  }

  const branch = await getGitBranch($, directory);
  if (!branch) {
    return null;
  }

  const normalizedBranch = String(branch || "").trim();
  if (!normalizedBranch) {
    return null;
  }

  const legacyParts = normalizedBranch.split("/").filter(Boolean);
  if (legacyParts[0] === "task" && legacyParts[1]) {
    return slugifySegment(legacyParts[1], "operator");
  }

  const [first] = normalizedBranch.split(BRANCH_PART_DELIMITER);
  if (RESERVED_BRANCHES.has(first)) {
    return null;
  }
  return slugifySegment(first, "operator");
}

function createLaneSlug(lane, index) {
  const modelSlug = slugifySegment(
    lane.modelID || lane.providerID || `lane-${index + 1}`,
    `lane-${index + 1}`,
  );
  return `${modelSlug}-l${index + 1}`;
}

async function findCruzeiroRoot(...candidates) {
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    let current = path.resolve(candidate);
    for (;;) {
      const marker = path.join(current, "AGENTS.md");
      const frontend = path.join(current, "frontend");
      const backend = path.join(current, "backend");
      const shared = path.join(current, "ai-shared");
      if (
        (await pathExists(marker)) &&
        (await pathExists(frontend)) &&
        (await pathExists(backend)) &&
        (await pathExists(shared))
      ) {
        return current;
      }

      const parent = path.dirname(current);
      if (parent === current) {
        break;
      }
      current = parent;
    }
  }

  return null;
}

function buildRepoDirectoryMap(repoDefs) {
  return Object.fromEntries(repoDefs.map((repo) => [repo.id, repo.directory]));
}

function normalizeRepoDefinitions(root, repoDefs) {
  const normalized = [];
  for (const repo of repoDefs || []) {
    const id = slugifySegment(
      repo.id || repo.name || repo.relPath || repo.path,
      "repo",
    );
    const relPath = repo.relPath || repo.path || repo.id || ".";
    normalized.push({
      id,
      relPath,
      directory: path.resolve(root, relPath),
      keywords: Array.isArray(repo.keywords)
        ? repo.keywords.map((item) => slugifySegment(item, "keyword"))
        : [],
    });
  }
  return normalized;
}

function createCruzeiroAdapter(root) {
  const repoDefs = normalizeRepoDefinitions(root, CRUZEIRO_REPO_DEFS);
  return {
    id: "cruzeiro",
    label: "Cruzeiro",
    kind: "project",
    root,
    runtimeDir: path.join(
      root,
      "ai-shared",
      ".opencode",
      "runtime",
      "sol-orchestrator",
    ),
    repoDefs,
    repoDirs: buildRepoDirectoryMap(repoDefs),
    notes: ["Cruzeiro adapter detected from workspace markers."],
  };
}

function createGenericAdapter(root) {
  const repoDefs = normalizeRepoDefinitions(root, [
    { id: path.basename(root) || "workspace", path: "." },
  ]);
  return {
    id: "generic",
    label: "Generic",
    kind: "generic",
    root,
    runtimeDir: path.join(root, DEFAULT_RUNTIME_SUBPATH),
    repoDefs,
    repoDirs: buildRepoDirectoryMap(repoDefs),
    notes: [
      "New project detected. Running in generic single-repo mode.",
      `Add .opencode/${ADAPTER_CONFIG_BASENAME} to customize repo routing and runtime paths.`,
    ],
  };
}

function createConfigAdapter(root, config) {
  const repoDefs = normalizeRepoDefinitions(
    root,
    Array.isArray(config?.repos) && config.repos.length
      ? config.repos
      : [{ id: path.basename(root), path: "." }],
  );
  return {
    id: slugifySegment(
      config?.id || config?.projectName || path.basename(root),
      "project",
    ),
    label: String(config?.projectName || path.basename(root) || "Project"),
    kind: "configured",
    root,
    runtimeDir: path.resolve(
      root,
      config?.runtimeDir || DEFAULT_RUNTIME_SUBPATH,
    ),
    repoDefs,
    repoDirs: buildRepoDirectoryMap(repoDefs),
    configPath: path.join(root, ".opencode", ADAPTER_CONFIG_BASENAME),
    notes: [
      `.opencode/${ADAPTER_CONFIG_BASENAME} loaded for project-specific routing.`,
    ],
  };
}

function buildProjectConfigTemplate({ root, projectName, adapter }) {
  if (adapter?.id === "cruzeiro") {
    return {
      projectName: "cruzeiro",
      runtimeDir: "ai-shared/.opencode/runtime/sol-orchestrator",
      repos: CRUZEIRO_REPO_DEFS.map((repo) => ({
        id: repo.id,
        path: repo.relPath,
        keywords: repo.keywords,
      })),
    };
  }

  const resolvedName =
    String(projectName || path.basename(root) || "project").trim() || "project";
  return {
    projectName: resolvedName,
    runtimeDir: DEFAULT_RUNTIME_SUBPATH.replace(/\\/g, "/"),
    repos: [
      {
        id: slugifySegment(resolvedName, "workspace"),
        path: ".",
        keywords: [],
      },
    ],
  };
}

async function findAdapterConfigRoot(...candidates) {
  for (const candidate of candidates) {
    const matched = await findAncestorWithRelativePath(
      candidate,
      path.join(".opencode", ADAPTER_CONFIG_BASENAME),
    );
    if (matched) {
      return path.dirname(path.dirname(matched));
    }
  }
  return null;
}

async function resolveAdapter({ $, directory, worktree }) {
  const configRoot = await findAdapterConfigRoot(
    directory,
    worktree,
    path.dirname(directory),
  );
  if (configRoot) {
    const configPath = path.join(
      configRoot,
      ".opencode",
      ADAPTER_CONFIG_BASENAME,
    );
    const config = await readJson(configPath, null);
    if (config) {
      return createConfigAdapter(configRoot, config);
    }
  }

  const cruzeiroRoot = await findCruzeiroRoot(
    directory,
    worktree,
    path.dirname(directory),
  );
  if (cruzeiroRoot) {
    return createCruzeiroAdapter(cruzeiroRoot);
  }

  const gitRoot = await getGitRoot($, directory);
  return createGenericAdapter(gitRoot || directory);
}

function inferRepos({ requestedRepos, task, directory, root, repoDefs }) {
  const repos = [];
  const repoIDs = repoDefs.map((repo) => repo.id);

  if (requestedRepos?.length) {
    for (const item of requestedRepos) {
      if (repoIDs.includes(item)) {
        repos.push(item);
      }
    }
  }

  const relative = root ? path.relative(root, directory) : "";
  const topLevel = relative.split(path.sep)[0];
  for (const repo of repoDefs) {
    const relTop = String(repo.relPath || "").split(/[\\/]/)[0];
    if (relative === repo.relPath || (relTop && topLevel === relTop)) {
      repos.push(repo.id);
    }
  }

  const lowerTask = task.toLowerCase();
  for (const repo of repoDefs) {
    if (repo.keywords.some((keyword) => lowerTask.includes(keyword))) {
      repos.push(repo.id);
    }
  }

  const uniqueRepos = unique(repos).filter((item) => repoIDs.includes(item));
  if (uniqueRepos.length) {
    return uniqueRepos;
  }

  return [repoDefs[0]?.id || "workspace"];
}

function chooseTopology({ goal, repos, write, lanes }) {
  if (goal === "competition") {
    return "isolate";
  }

  if (goal === "review") {
    return "relay";
  }

  if (repos.length > 1) {
    return "relay";
  }

  if (write && lanes.length > 1) {
    return "isolate";
  }

  return "single";
}

function getLaneDefaults(rawLanes) {
  const lanes = rawLanes?.length ? rawLanes : DEFAULT_LANES;
  return lanes.map((lane, index) => {
    const modelSlug = slugifySegment(
      lane.modelID || lane.providerID || `lane-${index + 1}`,
      `lane-${index + 1}`,
    );
    return {
      providerID: lane.providerID,
      modelID: lane.modelID,
      role: lane.role || (index === 0 ? "implementer" : "reviewer"),
      modelSlug,
      laneID: `${modelSlug}-${index + 1}`,
    };
  });
}

function inferTaskSignals(task) {
  const lowerTask = task.toLowerCase();
  return {
    wantsFast: /(fast|quick|rapid|scout|draft|rough|prototype)/.test(lowerTask),
    wantsReview: /(review|polish|refine|ux|copy|tone|cleanup|inspect)/.test(
      lowerTask,
    ),
    wantsDeep:
      /(architect|architecture|debug|root cause|investigate|hard|complex|deep|trace|adjudicate)/.test(
        lowerTask,
      ),
    wantsCodemod:
      /(codemod|rename|mechanical|bulk edit|sweep|migration|refactor)/.test(
        lowerTask,
      ),
    wantsCompetition:
      /(duel|compare|competition|side by side|versus|vs\b)/.test(lowerTask),
  };
}

function selectPreset({ goal, repos, task, write, explicitLanes }) {
  if (explicitLanes?.length) {
    return {
      id: "manual",
      rationale: "explicit lanes provided by operator",
      lanes: explicitLanes,
    };
  }

  const signals = inferTaskSignals(task);
  if (goal === "competition" || signals.wantsCompetition) {
    return ORCHESTRATOR_PRESETS.duel;
  }
  if (goal === "review") {
    return ORCHESTRATOR_PRESETS.review;
  }
  if (signals.wantsDeep || (repos.length > 1 && write)) {
    return ORCHESTRATOR_PRESETS.deep;
  }
  if (signals.wantsCodemod) {
    return ORCHESTRATOR_PRESETS.codemod;
  }
  if (signals.wantsFast && !write) {
    return ORCHESTRATOR_PRESETS.fast;
  }
  if (signals.wantsReview || repos.length > 1) {
    return ORCHESTRATOR_PRESETS.review;
  }
  return ORCHESTRATOR_PRESETS.default;
}

function decorateLane(lane, index) {
  const profile = MODEL_PROFILES[lane.modelID] || {};
  const modelSlug = slugifySegment(
    lane.modelID || lane.providerID || `lane-${index + 1}`,
    `lane-${index + 1}`,
  );
  const laneSlug = createLaneSlug(lane, index);
  return {
    providerID: lane.providerID,
    modelID: lane.modelID,
    role: lane.role || (index === 0 ? "implementer" : "reviewer"),
    modelSlug,
    laneID: `${modelSlug}-${index + 1}`,
    laneSlug,
    temperament: profile.temperament || "unknown",
    strengths: profile.strengths || [],
    risks: profile.risks || [],
    bestFor: profile.bestFor || [],
  };
}

function buildLaneBranch(operator, taskSlug, laneSlug) {
  return [operator, taskSlug, laneSlug].join(BRANCH_PART_DELIMITER);
}

function getWorktreeSegments(branch) {
  const normalizedBranch = String(branch || "").trim();
  if (!normalizedBranch) {
    return ["lane"];
  }

  const legacyParts = normalizedBranch.split("/").filter(Boolean);
  if (legacyParts[0] === "task" && legacyParts.length >= 4) {
    return legacyParts.slice(1);
  }

  return normalizedBranch.split(BRANCH_PART_DELIMITER).filter(Boolean);
}

function buildPrompt({ task, lane, topology, repos, branch, operator, write }) {
  const repoList = repos.join(", ");
  const sentences = [
    `You are lane ${lane.laneID}.`,
    `Operator prefix: ${operator}.`,
    `Assigned role: ${lane.role}.`,
    `Topology: ${topology}.`,
    `Target repos: ${repoList}.`,
    `Write mode: ${write ? "enabled" : "disabled"}.`,
  ];

  if (branch) {
    sentences.push(`Assigned branch: ${branch}.`);
  }

  if (lane.temperament) {
    sentences.push(`Model temperament: ${lane.temperament}.`);
  }
  if (lane.strengths?.length) {
    sentences.push(`Known strengths: ${lane.strengths.join(", ")}.`);
  }
  if (lane.risks?.length) {
    sentences.push(`Failure risks to avoid: ${lane.risks.join(", ")}.`);
  }

  if (topology !== "relay") {
    sentences.push(
      "Do not converse with sibling lanes unless the orchestrator relays a structured blocker.",
    );
  } else {
    sentences.push(
      "Work independently and emit crisp artifacts suitable for orchestrator relay.",
    );
  }

  sentences.push(`Task: ${task}`);

  return sentences.join("\n");
}

async function ensureWorktree({ $, root, repo, repoDir, branch }) {
  const worktreeDir = path.join(
    root,
    ".opencode-worktrees",
    repo,
    ...getWorktreeSegments(branch),
  );

  if (await pathExists(worktreeDir)) {
    throw new Error(`Worktree path already exists: ${worktreeDir}`);
  }

  await mkdir(path.dirname(worktreeDir), { recursive: true });
  const result =
    await $`git -C ${repoDir} worktree add ${worktreeDir} -b ${branch} HEAD`
      .nothrow()
      .quiet();
  if (result.exitCode !== 0) {
    await rm(worktreeDir, { recursive: true, force: true });
    throw new Error(
      result.text().trim() || `Failed to create worktree for ${branch}`,
    );
  }

  return worktreeDir;
}

async function createSession(client, directory, title) {
  const created = await client.session.create({ directory, title });
  if (created.error || !created.data?.id) {
    throw new Error(`Failed to create session for ${directory}`);
  }
  return created.data;
}

async function promptSession(client, lane, prompt, asyncMode = true) {
  const payload = {
    sessionID: lane.sessionID,
    directory: lane.directory,
    model: {
      providerID: lane.providerID,
      modelID: lane.modelID,
    },
    parts: [
      {
        type: "text",
        text: prompt,
      },
    ],
  };

  if (asyncMode) {
    const result = await client.session.promptAsync(payload);
    if (result.error) {
      throw new Error(`Failed to start async prompt for ${lane.sessionID}`);
    }
    return;
  }

  const result = await client.session.prompt(payload);
  if (result.error) {
    throw new Error(`Failed to send prompt for ${lane.sessionID}`);
  }
}

function extractLastAssistantText(messages) {
  if (!Array.isArray(messages)) {
    return "";
  }

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    const parts = Array.isArray(message?.parts) ? message.parts : [];
    const texts = parts
      .filter((part) => part?.type === "text" && typeof part.text === "string")
      .map((part) => part.text.trim())
      .filter(Boolean);

    if (texts.length) {
      return texts.join("\n\n");
    }
  }

  return "";
}

async function readGitStatus($, directory) {
  const result = await $`git -C ${directory} status --short`.nothrow().quiet();
  if (result.exitCode !== 0) {
    return "";
  }
  return result.text().trim();
}

async function collectSoundFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return entries
    .filter(
      (entry) =>
        entry.isFile() &&
        SOUND_EXTENSIONS.has(path.extname(entry.name).toLowerCase()),
    )
    .map((entry) => entry.name)
    .sort();
}

async function ensureDirectory(target) {
  await mkdir(target, { recursive: true });
  return target;
}

async function readText(target, fallback = "") {
  try {
    return await readFile(target, "utf8");
  } catch {
    return fallback;
  }
}

async function upsertPluginConfig(configPath, pluginUris) {
  const current = (await readJson(configPath, {})) || {};
  const existing = Array.isArray(current.plugin) ? current.plugin : [];
  const nextPlugin = [...existing];

  for (const uri of pluginUris) {
    if (!nextPlugin.includes(uri)) {
      nextPlugin.push(uri);
    }
  }

  current.plugin = nextPlugin;
  await writeJson(configPath, current);
  return current.plugin;
}

async function scaffoldProjectCommandFiles({
  pluginRoot,
  targetRoot,
  dryRun,
  overwrite,
}) {
  const sourceCommandsDir = path.join(pluginRoot, COMMAND_TEMPLATE_SUBDIR);
  const targetCommandsDir = path.join(targetRoot, ".opencode", "commands");
  const files = [];

  for (const file of PROJECT_COMMAND_TEMPLATE_FILES) {
    const source = path.join(sourceCommandsDir, file);
    if (!(await pathExists(source))) {
      continue;
    }

    const target = path.join(targetCommandsDir, file);
    const existed = await pathExists(target);
    const shouldWrite = overwrite || !existed;

    if (shouldWrite) {
      const content = await readText(source, "");
      if (!dryRun) {
        await ensureDirectory(path.dirname(target));
        await writeFile(target, content, "utf8");
      }
    }

    files.push({
      file,
      path: target,
      existed,
      overwritten: Boolean(existed && overwrite),
      created: Boolean(!existed),
      written: shouldWrite,
    });
  }

  return {
    sourceDir: sourceCommandsDir,
    targetDir: targetCommandsDir,
    overwritten: Boolean(overwrite),
    files,
  };
}

export async function SolOrchestratorPlugin({
  client,
  directory,
  worktree,
  $,
  serverUrl,
}) {
  const adapter = await resolveAdapter({ $, directory, worktree });
  const pluginRoot = pluginSourceRoot();

  return {
    tool: {
      sol_orchestrator_dispatch: tool({
        description:
          "Dispatch isolated or relayed worker lanes for repository tasks",
        args: {
          task: tool.schema
            .string()
            .min(1)
            .describe("Task packet to send to worker lanes"),
          taskSlug: tool.schema
            .string()
            .optional()
            .describe("Optional task slug override"),
          goal: tool.schema
            .enum(["auto", "parallel", "competition", "review"])
            .default("auto")
            .describe("Dispatch goal"),
          repos: tool.schema
            .array(tool.schema.string())
            .optional()
            .describe("Optional explicit repo targets"),
          write: tool.schema
            .boolean()
            .default(false)
            .describe("Allow write-capable lane setup"),
          asyncMode: tool.schema
            .boolean()
            .default(true)
            .describe("Send worker prompts asynchronously"),
          lanes: tool.schema
            .array(
              tool.schema.object({
                providerID: tool.schema.string(),
                modelID: tool.schema.string(),
                role: tool.schema.string().optional(),
              }),
            )
            .optional()
            .describe("Optional lane model definitions"),
        },
        async execute(args, context) {
          const operator = await inferOperator($, directory);
          if (!operator) {
            if (adapter.kind === "generic") {
              throw new Error(
                "New project detected, but the operator could not be inferred from the current branch. Set OPENCODE_OPERATOR or switch to an operator branch like `sol`, then re-run orchestrator. Add .opencode/sol-orchestrator.json if you also want project-aware repo routing.",
              );
            }
            throw new Error(
              "Could not infer operator from environment or current git branch",
            );
          }

          const taskSlug = slugifySegment(args.taskSlug || args.task, "task");
          const repos = inferRepos({
            requestedRepos: args.repos,
            task: args.task,
            directory,
            root: adapter.root,
            repoDefs: adapter.repoDefs,
          });
          const preset = selectPreset({
            goal: args.goal,
            repos,
            task: args.task,
            write: args.write,
            explicitLanes: args.lanes,
          });
          const lanes =
            preset.id === "manual"
              ? getLaneDefaults(preset.lanes).map((lane, index) =>
                  decorateLane(lane, index),
                )
              : preset.lanes.map((lane, index) => decorateLane(lane, index));
          const topology = chooseTopology({
            goal: args.goal,
            repos,
            write: args.write,
            lanes,
          });
          const effectiveGoal =
            args.goal === "auto"
              ? topology === "relay"
                ? "review"
                : "parallel"
              : args.goal;
          const jobID = createJobId(taskSlug);
          const runtimeDir = adapter.runtimeDir;
          const jobPath = path.join(runtimeDir, `${jobID}.json`);
          const laneRecords = [];

          for (let index = 0; index < lanes.length; index += 1) {
            const lane = lanes[index];
            const repo = repos[Math.min(index, repos.length - 1)] || repos[0];
            const repoDir = adapter.repoDirs[repo] || adapter.root;
            const branch = args.write
              ? buildLaneBranch(operator, taskSlug, lane.laneSlug)
              : null;
            const laneDirectory =
              topology === "isolate" && args.write
                ? await ensureWorktree({
                    $,
                    root: adapter.root,
                    repo,
                    repoDir,
                    branch,
                  })
                : repoDir;
            const title = `[sol-orchestrator] ${taskSlug} :: ${lane.modelID}`;
            const session = await createSession(client, laneDirectory, title);
            const prompt = buildPrompt({
              task: args.task,
              lane,
              topology,
              repos: [repo],
              branch,
              operator,
              write: args.write,
            });

            await promptSession(
              client,
              {
                ...lane,
                sessionID: session.id,
                directory: laneDirectory,
              },
              prompt,
              args.asyncMode,
            );

            laneRecords.push({
              laneID: lane.laneID,
              providerID: lane.providerID,
              modelID: lane.modelID,
              role: lane.role,
              temperament: lane.temperament,
              strengths: lane.strengths,
              risks: lane.risks,
              repo,
              branch,
              directory: laneDirectory,
              sessionID: session.id,
              prompt,
            });
          }

          const jobRecord = {
            id: jobID,
            createdAt: nowStamp(),
            operator,
            adapter: {
              id: adapter.id,
              label: adapter.label,
              kind: adapter.kind,
              root: adapter.root,
              configPath: adapter.configPath || null,
              notes: adapter.notes || [],
            },
            task: args.task,
            taskSlug,
            goal: effectiveGoal,
            topology,
            preset: {
              id: preset.id,
              rationale: preset.rationale,
            },
            repos,
            write: args.write,
            asyncMode: args.asyncMode,
            source: {
              directory,
              worktree,
              sessionID: context.sessionID,
              messageID: context.messageID,
              serverUrl: serverUrl.toString(),
            },
            lanes: laneRecords,
          };

          await writeJson(jobPath, jobRecord);

          return JSON.stringify(
            {
              jobID,
              jobPath,
              operator,
              adapter: jobRecord.adapter,
              goal: effectiveGoal,
              topology,
              preset: jobRecord.preset,
              lanes: laneRecords.map((lane) => ({
                laneID: lane.laneID,
                providerID: lane.providerID,
                modelID: lane.modelID,
                role: lane.role,
                temperament: lane.temperament,
                repo: lane.repo,
                branch: lane.branch,
                directory: lane.directory,
                sessionID: lane.sessionID,
              })),
              operatorPrompt:
                adapter.kind === "generic"
                  ? "New project detected. sol-orchestrator is running in generic single-repo mode. If you want project-aware routing, add .opencode/sol-orchestrator.json and tell me the repo map you want."
                  : null,
            },
            null,
            2,
          );
        },
      }),
      sol_orchestrator_status: tool({
        description: "Inspect a dispatched sol-orchestrator job",
        args: {
          jobID: tool.schema
            .string()
            .min(1)
            .describe("Job identifier returned by sol_orchestrator_dispatch"),
        },
        async execute(args) {
          const jobPath = path.join(adapter.runtimeDir, `${args.jobID}.json`);
          const job = await readJson(jobPath, null);
          if (!job) {
            throw new Error(`Job not found: ${args.jobID}`);
          }

          const lanes = [];
          for (const lane of job.lanes || []) {
            const messagesResult = await client.session.messages({
              sessionID: lane.sessionID,
              directory: lane.directory,
              limit: 12,
            });
            const assistantText = messagesResult.error
              ? ""
              : extractLastAssistantText(messagesResult.data);
            const gitStatus = await readGitStatus($, lane.directory);
            lanes.push({
              laneID: lane.laneID,
              sessionID: lane.sessionID,
              modelID: lane.modelID,
              role: lane.role,
              temperament: lane.temperament,
              repo: lane.repo,
              branch: lane.branch,
              directory: lane.directory,
              lastAssistantText: abbreviate(assistantText, 360),
              gitStatus,
            });
          }

          return JSON.stringify(
            {
              jobID: job.id,
              createdAt: job.createdAt,
              adapter: job.adapter || {
                id: adapter.id,
                label: adapter.label,
                kind: adapter.kind,
                root: adapter.root,
              },
              topology: job.topology,
              goal: job.goal,
              preset: job.preset,
              task: job.task,
              lanes,
            },
            null,
            2,
          );
        },
      }),
      sol_runtime_install: tool({
        description:
          "Install shared sol plugins and sound assets into the local OpenCode runtime",
        args: {
          plugins: tool.schema
            .boolean()
            .default(true)
            .describe(
              "Copy shared sol plugins into the user OpenCode plugin directory",
            ),
          sounds: tool.schema
            .boolean()
            .default(true)
            .describe(
              "Copy shared sound assets into the user OpenCode sounds directory",
            ),
          projectConfig: tool.schema
            .boolean()
            .default(false)
            .describe(
              "Scaffold .opencode/sol-orchestrator.json for the current project when missing",
            ),
          projectCommands: tool.schema
            .boolean()
            .optional()
            .describe(
              "Scaffold minimal .opencode/commands files for orchestrator setup; defaults to true when projectConfig is enabled",
            ),
          overwriteProjectConfig: tool.schema
            .boolean()
            .default(false)
            .describe(
              "Overwrite an existing .opencode/sol-orchestrator.json when scaffolding",
            ),
          overwriteProjectCommands: tool.schema
            .boolean()
            .default(false)
            .describe("Overwrite existing scaffolded .opencode/commands files"),
          projectName: tool.schema
            .string()
            .optional()
            .describe("Optional project name to use in the scaffolded config"),
          dryRun: tool.schema
            .boolean()
            .default(false)
            .describe("Report actions without writing files"),
        },
        async execute(args) {
          const home = os.homedir();
          const sourcePluginsDir = path.join(pluginRoot, "plugins");
          const sourceSoundsDir = path.join(pluginRoot, "sounds");
          const targetPluginsDir = path.join(
            home,
            ".config",
            "opencode",
            "plugins",
          );
          const targetSoundsDir = path.join(
            home,
            ".config",
            "opencode",
            "sounds",
          );
          const configPath = path.join(
            home,
            ".config",
            "opencode",
            "opencode.json",
          );
          const copiedPlugins = [];
          const copiedSounds = [];
          const pluginUris = [];
          let projectConfig = null;
          let projectCommands = null;

          if (args.plugins) {
            const pluginFiles = [];
            for (const file of INSTALL_PLUGIN_ALLOWLIST) {
              if (await pathExists(path.join(sourcePluginsDir, file))) {
                pluginFiles.push(file);
              }
            }
            if (!args.dryRun) {
              await ensureDirectory(targetPluginsDir);
            }

            for (const file of pluginFiles) {
              const source = path.join(sourcePluginsDir, file);
              const target = path.join(targetPluginsDir, file);
              if (!args.dryRun) {
                await copyFile(source, target);
              }
              copiedPlugins.push(target);
              pluginUris.push(`file:///${target.replace(/\\/g, "/")}`);
            }
          }

          if (args.sounds) {
            const soundFiles = await collectSoundFiles(sourceSoundsDir);
            if (!args.dryRun) {
              await ensureDirectory(targetSoundsDir);
            }

            for (const file of soundFiles) {
              const source = path.join(sourceSoundsDir, file);
              const target = path.join(targetSoundsDir, file);
              if (!args.dryRun) {
                await copyFile(source, target);
              }
              copiedSounds.push(target);
            }
          }

          let configuredPlugins = null;
          if (pluginUris.length) {
            if (!args.dryRun) {
              configuredPlugins = await upsertPluginConfig(
                configPath,
                pluginUris,
              );
            } else {
              const current = (await readJson(configPath, {})) || {};
              configuredPlugins = unique([
                ...(Array.isArray(current.plugin) ? current.plugin : []),
                ...pluginUris,
              ]);
            }
          }

          if (args.projectConfig) {
            const targetRoot = adapter.root;
            const targetProjectConfigPath = path.join(
              targetRoot,
              ".opencode",
              ADAPTER_CONFIG_BASENAME,
            );
            const exists = await pathExists(targetProjectConfigPath);
            const shouldWrite = args.overwriteProjectConfig || !exists;
            const nextConfig = buildProjectConfigTemplate({
              root: targetRoot,
              projectName: args.projectName,
              adapter,
            });

            if (shouldWrite && !args.dryRun) {
              await writeJson(targetProjectConfigPath, nextConfig);
            }

            projectConfig = {
              path: targetProjectConfigPath,
              existed: exists,
              overwritten: Boolean(exists && args.overwriteProjectConfig),
              created: Boolean(!exists),
              written: shouldWrite,
              projectName: nextConfig.projectName,
              template: nextConfig,
            };
          }

          const wantsProjectCommands =
            args.projectCommands ?? args.projectConfig;
          if (wantsProjectCommands) {
            projectCommands = await scaffoldProjectCommandFiles({
              pluginRoot,
              targetRoot: adapter.root,
              dryRun: args.dryRun,
              overwrite: args.overwriteProjectCommands,
            });
          }

          return JSON.stringify(
            {
              dryRun: args.dryRun,
              copiedPlugins,
              copiedSounds,
              configuredPlugins,
              projectConfig,
              projectCommands,
              sourcePluginsDir,
              sourceSoundsDir,
              configPath,
            },
            null,
            2,
          );
        },
      }),
    },
  };
}

export default SolOrchestratorPlugin;

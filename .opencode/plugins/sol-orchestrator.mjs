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

function normalizeReturnChain(input) {
  if (!input) {
    return [];
  }

  if (Array.isArray(input)) {
    return input.map((item) => String(item || "").trim()).filter(Boolean);
  }

  const text = String(input || "").trim();
  return text ? [text] : [];
}

function sanitizeLaneTask(task, returnChain) {
  let cleaned = String(task || "").trim();
  const normalizedChain = normalizeReturnChain(returnChain);

  for (const item of normalizedChain) {
    if (!item) {
      continue;
    }
    cleaned = cleaned.replace(item, "").trim();
  }

  cleaned = cleaned
    .replace(/\buse return chain\s*:/i, "")
    .replace(/\breturn chain\s*:/i, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  return cleaned || String(task || "").trim();
}

function extractLaneTaskSegments(task) {
  const source = String(task || "");
  const pattern = /lane\s+(\d+)\b\s*[:\-)]?/gi;
  const matches = [...source.matchAll(pattern)];
  if (!matches.length) {
    return {};
  }

  const segments = {};
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const laneNumber = Number(match[1]);
    const start = match.index;
    const end =
      index + 1 < matches.length ? matches[index + 1].index : source.length;
    const slice = source.slice(start, end).trim();
    if (laneNumber && slice) {
      segments[laneNumber] = slice;
    }
  }

  return segments;
}

function cleanLaneAssignmentText(text) {
  const source = String(text || "").trim();
  if (!source) {
    return "";
  }

  const orchestrationMarker =
    /(?:\n\s*|\s+)(use repo|use write|use executionmode|use two |use return chain)\b/i;
  const matched = source.match(orchestrationMarker);
  const trimmed =
    matched?.index != null ? source.slice(0, matched.index) : source;
  return trimmed.replace(/\n{3,}/g, "\n\n").trim();
}

function selectLaneTask(task, returnChain, laneIndex) {
  const cleanedTask = sanitizeLaneTask(task, returnChain);
  const segments = extractLaneTaskSegments(cleanedTask);
  return cleanLaneAssignmentText(segments[laneIndex + 1] || cleanedTask);
}

function buildResultMap(lanes) {
  const entries = [];
  for (const lane of lanes || []) {
    const value = String(lane.resultText || lane.resultPreview || "").trim();
    if (!value) {
      continue;
    }

    if (lane.resultKey) {
      entries.push([lane.resultKey, value]);
    }
    if (lane.laneID) {
      entries.push([lane.laneID, value]);
    }
    if (lane.role) {
      entries.push([lane.role, value]);
    }
  }

  return Object.fromEntries(entries);
}

function resolveResultTokens(text, resultMap) {
  return String(text || "").replace(/\$RESULT\[([^\]]+)\]/g, (_match, key) => {
    const lookup = slugifySegment(key, key);
    return resultMap[lookup] || resultMap[key] || `[Result '${key}' not found]`;
  });
}

function parseProposedFiles(text, rootDirectory) {
  const source = String(text || "");
  const pattern =
    /`([^`]+)`\s*\r?\n```(?:[a-z0-9_-]+)?\r?\n([\s\S]*?)\r?\n```/gi;
  const proposals = [];

  for (const match of source.matchAll(pattern)) {
    const rawPath = match[1].trim();
    const content = match[2];
    const normalized = rawPath.replace(/\\/g, "/");
    const rootNormalized = rootDirectory.replace(/\\/g, "/").replace(/\/$/, "");
    let relativePath = null;

    if (normalized.startsWith(rootNormalized + "/")) {
      relativePath = normalized.slice(rootNormalized.length + 1);
    } else if (!path.isAbsolute(rawPath)) {
      relativePath = rawPath;
    }

    if (!relativePath) {
      continue;
    }

    const safeRelative = relativePath.replace(/^\.\//, "").replace(/\\/g, "/");
    if (safeRelative.startsWith("../") || safeRelative.includes("/../")) {
      continue;
    }

    proposals.push({
      file: safeRelative,
      content,
    });
  }

  return proposals;
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

  if (write && lanes.length > 1) {
    return "isolate";
  }

  if (goal === "review") {
    return "relay";
  }

  if (repos.length > 1) {
    return "relay";
  }

  return "single";
}

function chooseExecutionMode({ executionMode, topology, write, lanes }) {
  if (executionMode && executionMode !== "auto") {
    return executionMode;
  }

  if (write) {
    return "hybrid";
  }

  if (lanes.length > 1) {
    return "hybrid";
  }

  return "subtask";
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
      as: lane.as,
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
    as: lane.as,
    modelSlug,
    laneID: `${modelSlug}-${index + 1}`,
    laneSlug,
    resultKey: slugifySegment(
      lane.as || `${modelSlug}-${index + 1}`,
      `lane-${index + 1}`,
    ),
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

function buildPrompt({
  task,
  lane,
  topology,
  repos,
  branch,
  operator,
  write,
  laneAssignment,
}) {
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

  if (laneAssignment) {
    sentences.push(
      `Your lane-specific assignment is: ${laneAssignment}`,
      "Answer only your own lane-specific assignment. Do not solve, summarize, or repeat sibling lane assignments.",
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
  const created = await client.session.create({
    query: { directory },
    body: { title },
  });
  if (created.error || !created.data?.id) {
    const detail = created.error
      ? typeof created.error === "string"
        ? created.error
        : JSON.stringify(created.error)
      : "missing session id";
    throw new Error(`Failed to create session for ${directory}: ${detail}`);
  }
  return created.data;
}

async function promptSession(client, lane, prompt, asyncMode = true) {
  const payload = {
    path: {
      id: lane.sessionID,
    },
    query: {
      directory: lane.directory,
    },
    body: {
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
    },
  };

  if (asyncMode) {
    const result = await client.session.promptAsync(payload);
    if (result.error) {
      const detail =
        typeof result.error === "string"
          ? result.error
          : JSON.stringify(result.error);
      throw new Error(
        `Failed to start async prompt for ${lane.sessionID}: ${detail}`,
      );
    }
    return;
  }

  const result = await client.session.prompt(payload);
  if (result.error) {
    const detail =
      typeof result.error === "string"
        ? result.error
        : JSON.stringify(result.error);
    throw new Error(`Failed to send prompt for ${lane.sessionID}: ${detail}`);
  }
}

async function listChildSessions(
  client,
  parentSessionID,
  directory,
  serverUrl,
) {
  if (serverUrl) {
    try {
      const url = new URL(`/session/${parentSessionID}/children`, serverUrl);
      url.searchParams.set("directory", directory);
      const response = await fetch(url);
      if (response.ok) {
        const payload = await response.json();
        if (Array.isArray(payload?.data)) {
          return payload.data;
        }
        if (Array.isArray(payload)) {
          return payload;
        }
      }
    } catch {
      // fall through to SDK path
    }
  }

  const result = await client.session.children({
    sessionID: parentSessionID,
    directory,
  });

  if (result.error || !Array.isArray(result.data)) {
    return [];
  }

  return result.data;
}

function pickLaneAgent(role) {
  return role === "reviewer" ? "explore" : "general";
}

function buildLaneSubtask({
  task,
  lane,
  topology,
  repo,
  branch,
  operator,
  write,
  laneAssignment,
}) {
  const prompt = buildPrompt({
    task: `${task}\nRuntime note: this lane is running as a native managed subagent under a lane-local parent session. Do not hand work back to the parent; complete the lane task inside the subagent and keep the output crisp for orchestrator synthesis.`,
    lane,
    topology,
    repos: [repo],
    branch,
    operator,
    write,
    laneAssignment,
  });
  const agent = pickLaneAgent(lane.role);
  return {
    description: `[${lane.laneID}] ${lane.role} :: ${repo}`,
    prompt,
    agent,
    providerID: lane.providerID,
    modelID: lane.modelID,
    command: "orchestrator-inline-lane",
  };
}

function buildLaneParentInstruction({
  task,
  lane,
  topology,
  repo,
  branch,
  operator,
  write,
  laneAssignment,
}) {
  const agent = pickLaneAgent(lane.role);
  const lanePrompt = buildPrompt({
    task,
    lane,
    topology,
    repos: [repo],
    branch,
    operator,
    write,
    laneAssignment,
  });

  return [
    `You must use the ${agent} subagent for this task and must not do it yourself.`,
    `Launch exactly one ${agent} subagent, let it complete the lane work, and then return only the subagent's final useful result in a compact form.`,
    lanePrompt,
  ].join("\n\n");
}

function createLaneParentTitle(taskSlug, lane) {
  return `[sol-orchestrator:${taskSlug}] ${lane.laneID} parent`;
}

async function waitForNewChildSession(
  client,
  parentSessionID,
  directory,
  serverUrl,
  previousChildren,
  matcher,
  attempts = 24,
  delayMs = 500,
) {
  const previousIDs = new Set(previousChildren.map((child) => child.id));

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const children = await listChildSessions(
      client,
      parentSessionID,
      directory,
      serverUrl,
    );
    const created =
      children.find((child) => !previousIDs.has(child.id) && matcher(child)) ||
      children.find((child) => matcher(child));

    if (created) {
      return created;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return null;
}

async function promptInlineSubtask(client, context, directory, subtask) {
  const payload = {
    path: {
      id: context.sessionID,
    },
    query: {
      directory,
    },
    body: {
      noReply: true,
      parts: [
        {
          type: "subtask",
          description: subtask.description,
          prompt: subtask.prompt,
          agent: subtask.agent,
          model: {
            providerID: subtask.providerID,
            modelID: subtask.modelID,
          },
          command: subtask.command,
        },
      ],
    },
  };

  const result = await client.session.prompt(payload);
  if (result.error) {
    const detail =
      typeof result.error === "string"
        ? result.error
        : JSON.stringify(result.error);
    throw new Error(`Failed to launch inline subtask: ${detail}`);
  }

  return result;
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

async function readSessionAssistantText(
  client,
  sessionID,
  directory,
  limit = 12,
) {
  if (!sessionID) {
    return "";
  }

  const messagesResult = await client.session.messages({
    path: { id: sessionID },
    query: {
      directory,
      limit,
    },
  });

  if (messagesResult.error) {
    return "";
  }

  return extractLastAssistantText(messagesResult.data);
}

async function hydrateLaneResults(client, lanes) {
  for (const lane of lanes || []) {
    const targetSessionID =
      lane.resultSessionID || lane.sessionID || lane.parentSessionID || null;
    const targetDirectory = lane.childSessionDirectory || lane.directory;
    const resultText = await readSessionAssistantText(
      client,
      targetSessionID,
      targetDirectory,
      20,
    );

    lane.resultSessionID = targetSessionID;
    lane.resultText = resultText || lane.resultText || "";
    lane.resultPreview = abbreviate(
      lane.resultText || lane.resultPreview || "",
      360,
    );
  }

  return lanes;
}

async function promptTextIntoSession(
  client,
  sessionID,
  directory,
  text,
  asyncMode,
) {
  const payload = {
    path: {
      id: sessionID,
    },
    query: {
      directory,
    },
    body: {
      parts: [
        {
          type: "text",
          text,
        },
      ],
    },
  };

  if (asyncMode) {
    const result = await client.session.promptAsync(payload);
    if (result.error) {
      const detail =
        typeof result.error === "string"
          ? result.error
          : JSON.stringify(result.error);
      throw new Error(
        `Failed to queue continuation for ${sessionID}: ${detail}`,
      );
    }
    return { async: true };
  }

  const result = await client.session.prompt(payload);
  if (result.error) {
    const detail =
      typeof result.error === "string"
        ? result.error
        : JSON.stringify(result.error);
    throw new Error(`Failed to continue session ${sessionID}: ${detail}`);
  }

  return { async: false };
}

async function readGitStatus($, directory) {
  const result = await $`git -C ${directory} status --short`.nothrow().quiet();
  if (result.exitCode !== 0) {
    return "";
  }
  return result.text().trim();
}

async function readChangedFiles($, directory) {
  const result =
    await $`git -C ${directory} status --short --untracked-files=all`
      .nothrow()
      .quiet();
  if (result.exitCode !== 0) {
    return [];
  }
  return unique(
    result
      .text()
      .split(/\r?\n/)
      .map((line) => line.trimEnd())
      .filter(Boolean)
      .map((line) => line.slice(3).trim())
      .filter(Boolean),
  );
}

async function readStatusEntries($, directory) {
  const result =
    await $`git -C ${directory} status --short --untracked-files=all`
      .nothrow()
      .quiet();
  if (result.exitCode !== 0) {
    return [];
  }

  return result
    .text()
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => ({
      status: line.slice(0, 2),
      file: line.slice(3).trim(),
    }))
    .filter((entry) => entry.file);
}

async function readDiffStat($, directory) {
  const result = await $`git -C ${directory} diff --stat --relative HEAD`
    .nothrow()
    .quiet();
  if (result.exitCode !== 0) {
    return "";
  }
  return result.text().trim();
}

async function readDiffPatch($, directory, files = []) {
  const fileArgs = files.filter(Boolean);
  const result = fileArgs.length
    ? await $`git -C ${directory} diff --binary --relative HEAD -- ${fileArgs}`
        .nothrow()
        .quiet()
    : await $`git -C ${directory} diff --binary --relative HEAD`
        .nothrow()
        .quiet();

  if (result.exitCode !== 0) {
    return "";
  }

  return result.text();
}

async function readScopedGitStatus($, directory, files = []) {
  const fileArgs = files.filter(Boolean);
  const result = fileArgs.length
    ? await $`git -C ${directory} status --short -- ${fileArgs}`
        .nothrow()
        .quiet()
    : await $`git -C ${directory} status --short`.nothrow().quiet();
  if (result.exitCode !== 0) {
    return "";
  }
  return result.text().trim();
}

function buildOverlapMap(laneInfos) {
  const owners = new Map();
  const overlaps = new Map();

  for (const lane of laneInfos) {
    for (const file of lane.changedFiles || []) {
      const list = owners.get(file) || [];
      list.push(lane.laneID);
      owners.set(file, list);
    }
  }

  for (const [file, laneIDs] of owners.entries()) {
    if (laneIDs.length > 1) {
      overlaps.set(file, laneIDs);
    }
  }

  return overlaps;
}

async function applyPatchText($, targetDirectory, patchText) {
  if (!patchText.trim()) {
    return;
  }

  const tempPath = path.join(
    os.tmpdir(),
    `sol-orchestrator-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.patch`,
  );

  try {
    await writeFile(tempPath, patchText, "utf8");
    const result =
      await $`git -C ${targetDirectory} apply --3way --whitespace=nowarn ${tempPath}`
        .nothrow()
        .quiet();
    if (result.exitCode !== 0) {
      throw new Error(result.text().trim() || "git apply failed");
    }
  } finally {
    await rm(tempPath, { force: true }).catch(() => {});
  }
}

async function promoteNewFiles(sourceDirectory, targetDirectory, files) {
  for (const file of files) {
    const source = path.join(sourceDirectory, file);
    const target = path.join(targetDirectory, file);
    await ensureDirectory(path.dirname(target));
    await copyFile(source, target);
  }
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
          executionMode: tool.schema
            .enum(["auto", "session", "subtask", "hybrid"])
            .default("auto")
            .describe(
              "Execution backend: auto-select, separate sessions, inline subtasks, or isolated parent sessions plus managed subagents",
            ),
          lanes: tool.schema
            .array(
              tool.schema.object({
                providerID: tool.schema.string(),
                modelID: tool.schema.string(),
                role: tool.schema.string().optional(),
                as: tool.schema.string().optional(),
              }),
            )
            .optional()
            .describe("Optional lane model definitions"),
          returnChain: tool.schema
            .union([
              tool.schema.string(),
              tool.schema.array(tool.schema.string()),
            ])
            .optional()
            .describe(
              "Optional follow-up prompts prepared from lane results using $RESULT[name] tokens",
            ),
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
          const resolvedExecutionMode = chooseExecutionMode({
            executionMode: args.executionMode,
            topology,
            write: args.write,
            lanes,
          });
          const laneTask = sanitizeLaneTask(args.task, args.returnChain);

          if (
            resolvedExecutionMode === "subtask" &&
            args.write &&
            lanes.length > 1
          ) {
            throw new Error(
              "Inline subtask mode does not support multi-lane write runs because native subtasks share the parent workspace. Use `hybrid` or `session` instead.",
            );
          }

          const jobID = createJobId(taskSlug);
          const runtimeDir = adapter.runtimeDir;
          const jobPath = path.join(runtimeDir, `${jobID}.json`);
          const laneRecords = [];

          if (resolvedExecutionMode === "subtask") {
            for (let index = 0; index < lanes.length; index += 1) {
              const lane = lanes[index];
              const laneAssignment = selectLaneTask(
                args.task,
                args.returnChain,
                index,
              );
              const repo = repos[Math.min(index, repos.length - 1)] || repos[0];
              const laneDirectory = adapter.repoDirs[repo] || adapter.root;
              const prompt = buildPrompt({
                task: `${laneTask}\nRuntime note: this lane is running as an inline managed subtask attached to the parent session, not a separate worktree session.`,
                lane,
                topology,
                repos: [repo],
                branch: null,
                operator,
                write: args.write,
                laneAssignment,
              });
              const agent = lane.role === "reviewer" ? "explore" : "general";
              const subtask = {
                description: `[${lane.laneID}] ${lane.role} :: ${repo}`,
                prompt,
                agent,
                providerID: lane.providerID,
                modelID: lane.modelID,
                command: "orchestrator-inline-lane",
              };
              const beforeChildren = await listChildSessions(
                client,
                context.sessionID,
                directory,
                serverUrl,
              );

              await promptInlineSubtask(client, context, directory, subtask);

              const afterChildren = await listChildSessions(
                client,
                context.sessionID,
                directory,
                serverUrl,
              );
              const createdChild =
                (await waitForNewChildSession(
                  client,
                  context.sessionID,
                  directory,
                  serverUrl,
                  afterChildren.length ? afterChildren : beforeChildren,
                  (child) =>
                    child.title ===
                    `${subtask.description} (@${agent} subagent)`,
                )) ||
                afterChildren.find(
                  (child) =>
                    child.title ===
                    `${subtask.description} (@${agent} subagent)`,
                ) ||
                null;

              laneRecords.push({
                laneID: lane.laneID,
                laneAssignment,
                providerID: lane.providerID,
                modelID: lane.modelID,
                role: lane.role,
                resultKey: lane.resultKey,
                laneAssignment: lane.laneAssignment || null,
                temperament: lane.temperament,
                strengths: lane.strengths,
                risks: lane.risks,
                repo,
                branch: null,
                directory: laneDirectory,
                sessionID: createdChild?.id || null,
                executionMode: "subtask",
                agent,
                prompt,
                childSessionDirectory: createdChild?.directory || null,
                childWorkspaceID: createdChild?.workspaceID || null,
              });
            }
          } else if (resolvedExecutionMode === "hybrid") {
            for (let index = 0; index < lanes.length; index += 1) {
              const lane = lanes[index];
              const laneAssignment = selectLaneTask(
                args.task,
                args.returnChain,
                index,
              );
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
              const parentSession = await createSession(
                client,
                laneDirectory,
                createLaneParentTitle(taskSlug, lane),
              );
              const subtask = buildLaneSubtask({
                task: laneTask,
                lane,
                topology,
                repo,
                branch,
                operator,
                write: args.write,
                laneAssignment,
              });
              const parentInstruction = buildLaneParentInstruction({
                task: laneTask,
                lane,
                topology,
                repo,
                branch,
                operator,
                write: args.write,
                laneAssignment,
              });
              const beforeChildren = await listChildSessions(
                client,
                parentSession.id,
                laneDirectory,
                serverUrl,
              );

              await promptSession(
                client,
                {
                  ...lane,
                  sessionID: parentSession.id,
                  directory: laneDirectory,
                },
                parentInstruction,
                false,
              );

              const createdChild = await waitForNewChildSession(
                client,
                parentSession.id,
                laneDirectory,
                serverUrl,
                beforeChildren,
                (child) =>
                  child.title ===
                  `${subtask.description} (@${subtask.agent} subagent)`,
              );
              const parentResult = await readSessionAssistantText(
                client,
                parentSession.id,
                laneDirectory,
                20,
              );

              laneRecords.push({
                laneID: lane.laneID,
                laneAssignment,
                providerID: lane.providerID,
                modelID: lane.modelID,
                role: lane.role,
                resultKey: lane.resultKey,
                temperament: lane.temperament,
                strengths: lane.strengths,
                risks: lane.risks,
                repo,
                branch,
                directory: laneDirectory,
                parentSessionID: parentSession.id,
                parentSessionTitle: createLaneParentTitle(taskSlug, lane),
                sessionID: createdChild?.id || null,
                executionMode: "hybrid",
                agent: subtask.agent,
                prompt: subtask.prompt,
                resultSessionID: parentSession.id,
                resultPreview: abbreviate(parentResult, 360),
                childSessionDirectory: createdChild?.directory || null,
                childWorkspaceID: createdChild?.workspaceID || null,
              });
            }
          } else {
            for (let index = 0; index < lanes.length; index += 1) {
              const lane = lanes[index];
              const laneAssignment = selectLaneTask(
                args.task,
                args.returnChain,
                index,
              );
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
                task: laneTask,
                lane,
                topology,
                repos: [repo],
                branch,
                operator,
                write: args.write,
                laneAssignment,
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
                laneAssignment,
                providerID: lane.providerID,
                modelID: lane.modelID,
                role: lane.role,
                resultKey: lane.resultKey,
                temperament: lane.temperament,
                strengths: lane.strengths,
                risks: lane.risks,
                repo,
                branch,
                directory: laneDirectory,
                sessionID: session.id,
                executionMode: "session",
                prompt,
              });
            }
          }

          await hydrateLaneResults(client, laneRecords);
          const returnChain = normalizeReturnChain(args.returnChain);
          const resultMap = buildResultMap(laneRecords);
          const preparedReturnChain = returnChain.map((item) =>
            resolveResultTokens(item, resultMap),
          );

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
            executionMode: resolvedExecutionMode,
            requestedExecutionMode: args.executionMode,
            returnChain,
            preparedReturnChain,
            resultMap,
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
              executionMode: resolvedExecutionMode,
              requestedExecutionMode: args.executionMode,
              preparedReturnChain,
              resultMap,
              lanes: laneRecords.map((lane) => ({
                laneID: lane.laneID,
                providerID: lane.providerID,
                modelID: lane.modelID,
                role: lane.role,
                resultKey: lane.resultKey,
                temperament: lane.temperament,
                repo: lane.repo,
                branch: lane.branch,
                directory: lane.directory,
                parentSessionID: lane.parentSessionID || null,
                resultSessionID: lane.resultSessionID || null,
                sessionID: lane.sessionID,
                executionMode: lane.executionMode,
                agent: lane.agent || null,
                resultPreview: lane.resultPreview || "",
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
            const gitStatus = await readGitStatus($, lane.directory);
            let lastAssistantText =
              lane.executionMode === "subtask"
                ? "Inline subtask lane attached to source session; inspect the live parent transcript."
                : "";

            if (lane.executionMode === "hybrid") {
              const targetSessionID =
                lane.resultSessionID || lane.sessionID || lane.parentSessionID;
              const targetDirectory =
                lane.childSessionDirectory || lane.directory;
              lastAssistantText =
                (await readSessionAssistantText(
                  client,
                  targetSessionID,
                  targetDirectory,
                  20,
                )) ||
                lane.resultPreview ||
                "";
            } else if (lane.executionMode !== "subtask") {
              lastAssistantText = await readSessionAssistantText(
                client,
                lane.sessionID,
                lane.directory,
                12,
              );
            }

            lanes.push({
              laneID: lane.laneID,
              sessionID: lane.sessionID,
              modelID: lane.modelID,
              role: lane.role,
              resultKey: lane.resultKey || null,
              laneAssignment: lane.laneAssignment || null,
              temperament: lane.temperament,
              repo: lane.repo,
              branch: lane.branch,
              directory: lane.directory,
              parentSessionID: lane.parentSessionID || null,
              resultSessionID: lane.resultSessionID || null,
              executionMode: lane.executionMode || "session",
              agent: lane.agent || null,
              lastAssistantText: abbreviate(lastAssistantText, 360),
              resultPreview: abbreviate(lane.resultPreview || "", 360),
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
              executionMode: job.executionMode || "session",
              requestedExecutionMode: job.requestedExecutionMode || null,
              preparedReturnChain: job.preparedReturnChain || [],
              executedReturnChain: job.executedReturnChain || [],
              resultMap: job.resultMap || {},
              adjudication: job.adjudication || null,
              lanes,
            },
            null,
            2,
          );
        },
      }),
      sol_orchestrator_continue: tool({
        description:
          "Advance a dispatched sol-orchestrator job using its prepared return chain",
        args: {
          jobID: tool.schema
            .string()
            .min(1)
            .describe("Job identifier returned by sol_orchestrator_dispatch"),
          step: tool.schema
            .number()
            .int()
            .min(1)
            .optional()
            .describe(
              "1-based prepared return step to execute; defaults to next pending step",
            ),
          asyncMode: tool.schema
            .boolean()
            .default(false)
            .describe(
              "Queue continuation asynchronously instead of waiting for completion",
            ),
        },
        async execute(args) {
          const jobPath = path.join(adapter.runtimeDir, `${args.jobID}.json`);
          const job = await readJson(jobPath, null);
          if (!job) {
            throw new Error(`Job not found: ${args.jobID}`);
          }

          await hydrateLaneResults(client, job.lanes || []);

          const resultMap = buildResultMap(job.lanes || []);
          const preparedReturnChain = normalizeReturnChain(
            job.returnChain || job.preparedReturnChain,
          ).map((item) => resolveResultTokens(item, resultMap));

          if (!preparedReturnChain.length) {
            throw new Error(`Job ${args.jobID} has no prepared return chain`);
          }

          const alreadyExecuted = Array.isArray(job.executedReturnChain)
            ? job.executedReturnChain
            : [];
          const nextIndex =
            args.step != null ? args.step - 1 : alreadyExecuted.length;

          if (nextIndex < 0 || nextIndex >= preparedReturnChain.length) {
            throw new Error(
              `Requested return step ${args.step || nextIndex + 1} is out of range for job ${args.jobID}`,
            );
          }

          const prompt = preparedReturnChain[nextIndex];
          const targetSessionID = job.source?.sessionID;
          const targetDirectory = job.source?.directory || directory;

          if (!targetSessionID) {
            throw new Error(`Job ${args.jobID} is missing a source session ID`);
          }

          await promptTextIntoSession(
            client,
            targetSessionID,
            targetDirectory,
            prompt,
            args.asyncMode,
          );

          const executionRecord = {
            step: nextIndex + 1,
            prompt,
            executedAt: nowStamp(),
            asyncMode: args.asyncMode,
          };

          const executedReturnChain = [...alreadyExecuted];
          executedReturnChain[nextIndex] = executionRecord;

          job.resultMap = resultMap;
          job.preparedReturnChain = preparedReturnChain;
          job.executedReturnChain = executedReturnChain;
          job.lastContinuedAt = executionRecord.executedAt;

          await writeJson(jobPath, job);

          return JSON.stringify(
            {
              jobID: job.id,
              sourceSessionID: targetSessionID,
              sourceDirectory: targetDirectory,
              executedStep: executionRecord.step,
              prompt,
              asyncMode: args.asyncMode,
              remainingSteps: preparedReturnChain.length - executionRecord.step,
              preparedReturnChain,
            },
            null,
            2,
          );
        },
      }),
      sol_orchestrator_adjudicate: tool({
        description:
          "Compare lane outputs/diffs and optionally promote safe lane changes into the parent repo",
        args: {
          jobID: tool.schema
            .string()
            .min(1)
            .describe("Job identifier returned by sol_orchestrator_dispatch"),
          promote: tool.schema
            .boolean()
            .default(false)
            .describe(
              "Apply safe non-conflicting lane diffs into the parent repo",
            ),
          lanes: tool.schema
            .array(tool.schema.string())
            .optional()
            .describe("Optional lane IDs or result keys to adjudicate"),
        },
        async execute(args) {
          const jobPath = path.join(adapter.runtimeDir, `${args.jobID}.json`);
          const job = await readJson(jobPath, null);
          if (!job) {
            throw new Error(`Job not found: ${args.jobID}`);
          }

          await hydrateLaneResults(client, job.lanes || []);

          const selected = (job.lanes || []).filter((lane) => {
            if (!args.lanes?.length) {
              return true;
            }
            const wanted = new Set(
              args.lanes.map((item) => slugifySegment(item, item)),
            );
            return (
              wanted.has(slugifySegment(lane.laneID, lane.laneID)) ||
              wanted.has(
                slugifySegment(lane.resultKey || "", lane.resultKey || ""),
              )
            );
          });

          if (!selected.length) {
            throw new Error(`No matching lanes found for job ${args.jobID}`);
          }

          const laneInfos = [];
          for (const lane of selected) {
            const changedFiles = await readChangedFiles($, lane.directory);
            const statusEntries = await readStatusEntries($, lane.directory);
            const diffStat = await readDiffStat($, lane.directory);
            const proposedFiles = parseProposedFiles(
              lane.resultText || lane.resultPreview || "",
              lane.directory,
            );
            laneInfos.push({
              laneID: lane.laneID,
              resultKey: lane.resultKey || null,
              branch: lane.branch || null,
              directory: lane.directory,
              changedFiles,
              statusEntries,
              diffStat,
              resultPreview: lane.resultPreview || "",
              proposedFiles,
            });
          }

          const overlapMap = buildOverlapMap(laneInfos);
          const overlaps = [...overlapMap.entries()].map(([file, laneIDs]) => ({
            file,
            laneIDs,
          }));

          const promotion = {
            attempted: args.promote,
            promotedFiles: [],
            skippedFiles: overlaps.map((item) => ({
              file: item.file,
              reason: `overlap:${item.laneIDs.join(",")}`,
            })),
            blockedByParentStatus: [],
          };

          const overlapFiles = new Set(overlaps.map((item) => item.file));

          if (args.promote) {
            for (const lane of laneInfos) {
              const promotableFiles = lane.changedFiles.filter(
                (file) => !overlapFiles.has(file),
              );
              const proposedFiles = (lane.proposedFiles || []).filter(
                (item) => !overlapFiles.has(item.file),
              );

              if (!promotableFiles.length && !proposedFiles.length) {
                continue;
              }

              const parentStatus = promotableFiles.length
                ? await readScopedGitStatus(
                    $,
                    job.source?.directory || directory,
                    promotableFiles,
                  )
                : "";

              if (parentStatus) {
                promotion.blockedByParentStatus.push({
                  laneID: lane.laneID,
                  files: promotableFiles,
                  status: parentStatus,
                });
                if (!proposedFiles.length) {
                  continue;
                }
              }

              const untrackedFiles = (lane.statusEntries || [])
                .filter(
                  (entry) =>
                    entry.status === "??" &&
                    promotableFiles.includes(entry.file),
                )
                .map((entry) => entry.file);
              const trackedFiles = promotableFiles.filter(
                (file) => !untrackedFiles.includes(file),
              );

              const parentDir = job.source?.directory || directory;
              const newFileConflicts = [];
              for (const file of untrackedFiles) {
                if (await pathExists(path.join(parentDir, file))) {
                  newFileConflicts.push(file);
                }
              }

              for (const proposal of proposedFiles) {
                if (await pathExists(path.join(parentDir, proposal.file))) {
                  newFileConflicts.push(proposal.file);
                }
              }

              if (newFileConflicts.length) {
                promotion.blockedByParentStatus.push({
                  laneID: lane.laneID,
                  files: newFileConflicts,
                  status: "target file already exists in parent repo",
                });
              }

              const promotableNewFiles = untrackedFiles.filter(
                (file) => !newFileConflicts.includes(file),
              );
              const promotableProposals = proposedFiles.filter(
                (item) => !newFileConflicts.includes(item.file),
              );
              const patchText = await readDiffPatch(
                $,
                lane.directory,
                trackedFiles,
              );

              if (patchText.trim()) {
                await applyPatchText($, parentDir, patchText);
              }

              if (promotableNewFiles.length) {
                await promoteNewFiles(
                  lane.directory,
                  parentDir,
                  promotableNewFiles,
                );
              }

              for (const proposal of promotableProposals) {
                const target = path.join(parentDir, proposal.file);
                await ensureDirectory(path.dirname(target));
                await writeFile(target, proposal.content, "utf8");
              }

              if (
                !patchText.trim() &&
                !promotableNewFiles.length &&
                !promotableProposals.length
              ) {
                continue;
              }

              promotion.promotedFiles.push({
                laneID: lane.laneID,
                files: [
                  ...trackedFiles,
                  ...promotableNewFiles,
                  ...promotableProposals.map((item) => item.file),
                ],
              });
            }
          }

          job.adjudication = {
            adjudicatedAt: nowStamp(),
            selectedLanes: selected.map((lane) => lane.laneID),
            overlaps,
            laneInfos,
            promotion,
          };

          await writeJson(jobPath, job);

          return JSON.stringify(
            {
              jobID: job.id,
              selectedLanes: selected.map((lane) => lane.laneID),
              overlaps,
              laneInfos,
              promotion,
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

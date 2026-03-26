import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const HOME = os.homedir();
const RUNTIME_DIR = path.join(
  HOME,
  ".config",
  "opencode",
  "runtime",
  "sol-role-lock",
);
const GLOBAL_STATE_PATH = path.join(RUNTIME_DIR, "global.json");
const ROLE_DIR = path.join(HOME, ".local", "operators", "roles");
const DEFAULT_MODE = "Kintsu";
const DEFAULT_AGENT_NAME = "Kintsu";
const SYSTEM_CONTRACT_MARKER = "[sol-role-lock contract]";
const MODEL_AGENT_NAME_MAP = {
  openai: {
    "gpt-5.4": "Kintsu",
    "gpt-5-codex": "Kest",
    "gpt-5.3-codex-spark": "Suri",
  },
  anthropic: {
    "claude-sonnet-4-6": "Kodo",
    "claude-opus-4-6": "Veyr",
  },
};
const STYLE_LOCK_SECTION_MATCHERS = [
  {
    keywords: [
      "constraint",
      "rule",
      "discipline",
      "cadence",
      "structure",
      "punctuation",
      "typography",
      "abstraction",
      "repetition",
      "tone",
      "style",
    ],
  },
  {
    keywords: ["failure", "banned", "never sound like", "hard mode test"],
  },
];
const roleCache = new Map();

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function sessionStatePath(sessionID) {
  return path.join(RUNTIME_DIR, `${sessionID}.json`);
}

function roleFilePath(mode) {
  return path.join(ROLE_DIR, `${mode}.md`);
}

async function listRoleModes() {
  try {
    const entries = await readdir(ROLE_DIR, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => entry.name.slice(0, -3));
  } catch {
    return [DEFAULT_MODE];
  }
}

async function ensureRuntimeDir() {
  await mkdir(RUNTIME_DIR, { recursive: true });
}

async function readJson(target, fallback = null) {
  try {
    const raw = await readFile(target, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(target, value) {
  await ensureRuntimeDir();
  await writeFile(target, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function defaultState() {
  return {
    version: 3,
    operator: null,
    operatorConfirmed: false,
    passwordHash: null,
    unlocked: false,
    agentName: DEFAULT_AGENT_NAME,
    activeMode: DEFAULT_MODE,
    activeName: DEFAULT_AGENT_NAME,
    lockStrength: "hard",
    panicRiskOnDrift: true,
    lastModeChangeAt: null,
    lastUpdatedAt: null,
    ignoredMode: null,
  };
}

async function loadGlobalState() {
  return readJson(GLOBAL_STATE_PATH, defaultState());
}

async function loadState(sessionID) {
  const globalState = await loadGlobalState();
  if (!sessionID) {
    return globalState;
  }
  const sessionState = await readJson(sessionStatePath(sessionID), null);
  return { ...globalState, ...(sessionState || {}) };
}

async function saveState(sessionID, partial) {
  const current = await loadState(sessionID);
  const next = {
    ...current,
    ...partial,
    lastUpdatedAt: new Date().toISOString(),
  };

  const normalizedActiveMode = await normalizeMode(next.activeMode);
  next.activeMode = normalizedActiveMode || DEFAULT_MODE;
  const normalizedAgentName = String(next.agentName || "").trim();
  next.agentName = normalizedAgentName || DEFAULT_AGENT_NAME;
  next.activeName = next.agentName;

  await writeJson(GLOBAL_STATE_PATH, {
    ...defaultState(),
    ...next,
  });

  if (sessionID) {
    await writeJson(sessionStatePath(sessionID), next);
  }

  return next;
}

function sanitizeRoleMarkdown(raw) {
  return String(raw || "")
    .replace(/^\uFEFF/, "")
    .trim();
}

function normalizeHeading(value) {
  return String(value || "")
    .replace(/^#+\s*/, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-zA-Z0-9:\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function parseRoleSections(markdown) {
  const lines = String(markdown || "").split("\n");
  const sections = new Map();
  let current = null;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      const heading = line.slice(3).trim();
      current = normalizeHeading(heading);
      sections.set(current, { heading, lines: [] });
      continue;
    }

    if (current) {
      sections.get(current).lines.push(line);
    }
  }

  return sections;
}

function headingMatchesKeywords(heading, keywords) {
  return keywords.some((keyword) => {
    const normalizedKeyword = normalizeHeading(keyword);
    return (
      heading === normalizedKeyword ||
      heading.startsWith(normalizedKeyword) ||
      normalizedKeyword.startsWith(heading) ||
      heading.includes(normalizedKeyword)
    );
  });
}

function collectStyleLockSections(sections) {
  const matched = [];

  for (const matcher of STYLE_LOCK_SECTION_MATCHERS) {
    for (const [normalizedHeading, section] of sections.entries()) {
      if (!headingMatchesKeywords(normalizedHeading, matcher.keywords)) {
        continue;
      }

      const body = section.lines.join("\n").trim();
      if (!body) {
        continue;
      }

      matched.push({
        heading: section.heading,
        body,
      });
    }
  }

  return matched;
}

function buildStyleLock(markdown) {
  const sections = parseRoleSections(markdown);
  const seen = new Set();
  const parts = collectStyleLockSections(sections)
    .filter((section) => {
      const key = normalizeHeading(section.heading);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .map((section) => `- ${section.heading}:\n${section.body}`);

  if (parts.length === 0) {
    return null;
  }

  return ["STYLE LOCK ACTIVE.", ...parts].join("\n\n");
}

function validateRoleMarkdown(mode, markdown) {
  if (!markdown) {
    return `Role file for ${mode} is empty.`;
  }

  const firstLine = String(markdown).split("\n", 1)[0]?.trim() || "";
  const expectedTitle = normalizeHeading(`# ROLE: ${mode}`);
  if (normalizeHeading(firstLine) !== expectedTitle) {
    return `Role file for ${mode} must start with '# ROLE: ${mode}'.`;
  }

  return null;
}

async function loadRoleMarkdown(mode) {
  const target = roleFilePath(mode);

  try {
    const fileStat = await stat(target);
    const cacheKey = `${target}:${fileStat.mtimeMs}`;
    const cached = roleCache.get(cacheKey);

    if (cached) {
      return { mode, markdown: cached, warning: null };
    }

    roleCache.clear();
    const raw = await readFile(target, "utf8");
    const markdown = sanitizeRoleMarkdown(raw);
    const error = validateRoleMarkdown(mode, markdown);

    if (error) {
      return { mode: DEFAULT_MODE, markdown: null, warning: error };
    }

    roleCache.set(cacheKey, markdown);
    return { mode, markdown, warning: null };
  } catch {
    return {
      mode: DEFAULT_MODE,
      markdown: null,
      warning: `Role file for ${mode} could not be loaded from ${target}.`,
    };
  }
}

async function resolveRoleContract(mode) {
  const primary = await loadRoleMarkdown(mode);

  if (primary.markdown) {
    return primary;
  }

  if (mode === DEFAULT_MODE) {
    return {
      mode: DEFAULT_MODE,
      markdown:
        "# ROLE: Kintsu\n\nFallback only. The role file could not be loaded, so answer plainly, briefly, and directly without role theater.",
      warning: primary.warning || "Kintsu fallback contract engaged.",
    };
  }

  const fallback = await loadRoleMarkdown(DEFAULT_MODE);
  if (fallback.markdown) {
    return {
      mode: DEFAULT_MODE,
      markdown: fallback.markdown,
      warning:
        primary.warning || `Role ${mode} failed; Kintsu fallback engaged.`,
    };
  }

  return {
    mode: DEFAULT_MODE,
    markdown:
      "# ROLE: Kintsu\n\nFallback only. The role system is degraded. Answer plainly, briefly, and directly without role theater.",
    warning:
      primary.warning ||
      fallback.warning ||
      "Role system degraded; Kintsu fallback engaged.",
  };
}

async function normalizeMode(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return null;
  }

  const modes = await listRoleModes();
  const match = modes.find((mode) => mode.toLowerCase() === raw.toLowerCase());
  return match || null;
}

function extractText(parts) {
  if (!Array.isArray(parts)) {
    return "";
  }
  return parts
    .filter((part) => part?.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function collectTextValues(value, seen = new Set()) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  if (seen.has(value)) {
    return [];
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectTextValues(entry, seen));
  }

  return Object.values(value).flatMap((entry) =>
    collectTextValues(entry, seen),
  );
}

function extractInputText(input) {
  if (!input || typeof input !== "object") {
    return "";
  }

  const directCandidates = [];

  if (typeof input.text === "string") {
    directCandidates.push(input.text.trim());
  }
  if (Array.isArray(input.parts)) {
    directCandidates.push(extractText(input.parts));
  }
  if (Array.isArray(input.messages)) {
    directCandidates.push(
      input.messages
        .flatMap((message) => {
          if (typeof message?.content === "string") {
            return [message.content];
          }
          if (Array.isArray(message?.content)) {
            return message.content
              .filter(
                (part) =>
                  part?.type === "text" && typeof part.text === "string",
              )
              .map((part) => part.text);
          }
          if (Array.isArray(message?.parts)) {
            return message.parts
              .filter(
                (part) =>
                  part?.type === "text" && typeof part.text === "string",
              )
              .map((part) => part.text);
          }
          return [];
        })
        .join("\n")
        .trim(),
    );
  }

  const structured = directCandidates.filter(Boolean).join("\n").trim();
  if (structured) {
    return structured;
  }

  return collectTextValues(input).join("\n").trim();
}

function lastDirectiveValue(text, label) {
  const pattern = new RegExp(
    String.raw`(?:^|\n)\s*${label}:\s*(.+?)\s*(?=\n|$)`,
    "gi",
  );
  const matches = Array.from(String(text || "").matchAll(pattern));
  if (matches.length === 0) {
    return null;
  }
  return matches.at(-1)?.[1] ?? null;
}

function parseUserDirectives(text) {
  const normalized = String(text || "");
  const operatorValue = lastDirectiveValue(normalized, "Operator");
  const passwordValue = lastDirectiveValue(normalized, "Password");
  const rawModeValue = lastDirectiveValue(normalized, "MODE");
  const rawMode = rawModeValue ? rawModeValue.trim() : null;
  return {
    operator: operatorValue ? operatorValue.trim() : null,
    password: passwordValue,
    rawMode,
  };
}

export function resolveAgentName(model, fallback) {
  const providerID = String(model?.providerID || "").toLowerCase();
  const modelID = String(model?.modelID || "").toLowerCase();
  const byProvider = MODEL_AGENT_NAME_MAP[providerID];

  if (byProvider && byProvider[modelID]) {
    return byProvider[modelID];
  }

  const normalizedFallback = String(fallback || "").trim();
  return normalizedFallback || DEFAULT_AGENT_NAME;
}

function isRoleContractMessage(value) {
  const text = String(value || "");
  if (!text) {
    return false;
  }

  if (text.includes(SYSTEM_CONTRACT_MARKER)) {
    return true;
  }

  return (
    text.includes("ROLE LOCK ACTIVE.") &&
    text.includes("Active mode:") &&
    text.includes(
      "The following role file is the sole source of role-specific behavior for this turn.",
    )
  );
}

export async function buildSystemContract(state, input) {
  const operator = state.operator || "Sol";
  const agentName = resolveAgentName(input?.model, state.agentName);
  const role = await resolveRoleContract(state.activeMode);
  const activeMode = role.mode || state.activeMode || DEFAULT_MODE;
  const warningLine = [
    role.warning ? `Role warning: ${role.warning}` : null,
    state.ignoredMode
      ? `Mode warning: Unknown mode '${state.ignoredMode}' ignored.`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
  const styleLock = buildStyleLock(role.markdown);
  return [
    SYSTEM_CONTRACT_MARKER,
    "ROLE LOCK ACTIVE.",
    `Operator: ${operator}.`,
    `Agent name: ${agentName}.`,
    `Active mode: ${activeMode}.`,
    "This is a hard lock. The active mode persists until Sol explicitly changes MODE.",
    "This contract supersedes any earlier role-lock contract or stale mode text for this turn.",
    "You must answer in the active mode without post-generation rewriting or identity drift.",
    `You are ${agentName}. Do not self-identify as any other name or neutral assistant persona.`,
    `Follow ${activeMode} as a behavioral mode overlay without collapsing your name into the mode label.`,
    styleLock,
    "The following role file is the sole source of role-specific behavior for this turn.",
    role.markdown,
    warningLine,
    "If a requested line is blocked by higher-priority safety limits, answer plainly while keeping the active identity intact.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function recordDirectives(sessionID, text) {
  const directives = parseUserDirectives(text);
  const current = await loadState(sessionID);
  const updates = {};
  const resolvedMode = directives.rawMode
    ? await normalizeMode(directives.rawMode)
    : null;

  if (directives.operator) {
    updates.operator = directives.operator;
    updates.operatorConfirmed = true;
  }

  if (typeof directives.password === "string") {
    updates.passwordHash = sha256(directives.password);
    updates.unlocked = true;
  }

  if (directives.rawMode) {
    if (resolvedMode) {
      updates.activeMode = resolvedMode;
      updates.lastModeChangeAt = new Date().toISOString();
      updates.ignoredMode = null;
    } else {
      updates.activeMode = current.activeMode;
      updates.ignoredMode = directives.rawMode;
    }
  }

  if (Object.keys(updates).length === 0) {
    return current;
  }

  return saveState(sessionID, updates);
}

async function stateForTurn(sessionID, input) {
  const inputText = extractInputText(input);
  const state = await recordDirectives(sessionID, inputText);
  const nextAgentName = resolveAgentName(input?.model, state.agentName);

  if (nextAgentName === state.agentName && state.activeName === nextAgentName) {
    return state;
  }

  return saveState(sessionID, {
    agentName: nextAgentName,
    activeName: nextAgentName,
  });
}

export async function SolRoleLockPlugin() {
  return {
    "chat.message": async (input) => {
      await recordDirectives(input.sessionID, extractInputText(input));
    },
    "experimental.chat.system.transform": async (input, output) => {
      const state = await stateForTurn(input.sessionID, input);
      output.system = (
        Array.isArray(output.system) ? output.system : []
      ).filter((entry) => !isRoleContractMessage(entry));
      output.system.unshift(await buildSystemContract(state, input));
    },
  };
}

export default SolRoleLockPlugin;

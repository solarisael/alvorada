import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const HOME = os.homedir();
const OPERATOR_DIR = path.join(HOME, ".local", "operators");
const RUNTIME_DIR = path.join(
  HOME,
  ".config",
  "opencode",
  "runtime",
  "solarisael-house",
);
const GLOBAL_STATE_PATH = path.join(RUNTIME_DIR, "global.json");
const SPIRIT_DIR = path.join(OPERATOR_DIR, "spirits");
const HOUSE_CHARTER_PATH = path.join(OPERATOR_DIR, "SOLARISAEL.house.md");
const BABEL_LANGUAGE_PATH = path.join(OPERATOR_DIR, "BABEL.language.md");
const BABEL_TERMINAL_CHAT_PATH = path.join(OPERATOR_DIR, "BABEL.terminal-chat.md");
const CONSOLE_RENDERING_PATH = path.join(OPERATOR_DIR, "CONSOLE.rendering.md");
const DEFAULT_SPIRIT = "Kintsu";
const DEFAULT_AGENT_NAME = "Kintsu";
const SYSTEM_CONTRACT_MARKER = "[solarisael-house contract]";
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
const LEGACY_SPIRIT_ALIASES = {
  "ai bai": "Ya Bai",
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
const spiritCache = new Map();
const PLAN_MODE_MARKER = "Plan mode is active.";
const TRACK_MODE_MARKER =
  "Please address this message and continue with your tasks.";
const BUILD_SWITCH_MARKER = "You should execute on the plan defined within it";
const PLAN_APPROVED_MARKER = "you can now edit files. Execute the plan";
const HISTORY_DIRECTIVE_LINE =
  /^\s*(?:operator|password|embody|conjure|summon)\s*:\s*.+$/i;
const HISTORY_DISMISS_LINE = /^\s*dismiss\s*(?::\s*.+)?$/i;
const MODE_PRESERVATION_BLOCK = [
  "## Identity And Mode Preservation",
  "These restrictions apply to actions only.",
  "They do not change the active identity.",
  "They do not change the active spirit.",
  "They do not change voice, cadence, or style.",
  "If a spirit lock or active spirit exists, remain fully in that spirit while obeying these action constraints.",
  "If you ask a question, ask it in the active spirit rather than defaulting to generic assistant tone.",
].join("\n");

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function sessionStatePath(sessionID) {
  return path.join(RUNTIME_DIR, `${sessionID}.json`);
}

function spiritFilePath(mode) {
  return path.join(SPIRIT_DIR, `${mode}.md`);
}

async function listSpiritModes() {
  try {
    const entries = await readdir(SPIRIT_DIR, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => entry.name.slice(0, -3));
  } catch {
    return [DEFAULT_SPIRIT];
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
    embodiedSpirit: DEFAULT_SPIRIT,
    conjuredSpirit: null,
    summonedSpirit: null,
    activeName: DEFAULT_AGENT_NAME,
    lockStrength: "hard",
    panicRiskOnDrift: true,
    lastSpiritChangeAt: null,
    lastUpdatedAt: null,
    ignoredSpiritDirective: null,
  };
}

async function loadGlobalState() {
  const state = await readJson(GLOBAL_STATE_PATH, defaultState());
  if (state && state.activeMode && !state.embodiedSpirit) {
    state.embodiedSpirit = canonicalizeSpiritName(state.activeMode);
  }
  return { ...defaultState(), ...(state || {}) };
}

async function loadState(sessionID) {
  const globalState = await loadGlobalState();
  if (!sessionID) {
    return globalState;
  }
  const sessionState = await readJson(sessionStatePath(sessionID), null);
  return { ...globalState, ...(sessionState || {}) };
}

export async function loadHouseState(sessionID) {
  return loadState(sessionID);
}

async function saveState(sessionID, partial) {
  const current = await loadState(sessionID);
  const next = {
    ...current,
    ...partial,
    lastUpdatedAt: new Date().toISOString(),
  };

  next.embodiedSpirit =
    (await normalizeSpirit(next.embodiedSpirit)) || DEFAULT_SPIRIT;
  next.conjuredSpirit = (await normalizeSpirit(next.conjuredSpirit)) || null;
  next.summonedSpirit = (await normalizeSpirit(next.summonedSpirit)) || null;
  delete next.activeMode;
  delete next.lastModeChangeAt;
  delete next.ignoredMode;

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

function sanitizeSpiritMarkdown(raw) {
  return String(raw || "")
    .replace(/^\uFEFF/, "")
    .trim();
}

async function readOptionalMarkdown(target) {
  try {
    return sanitizeSpiritMarkdown(await readFile(target, "utf8"));
  } catch {
    return "";
  }
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

function parseSpiritSections(markdown) {
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

function extractMarkdownSection(markdown, heading) {
  if (!markdown) {
    return "";
  }

  const sections = parseSpiritSections(markdown);
  return sections.get(normalizeHeading(heading))?.lines.join("\n").trim() || "";
}

function buildDoctrineSection(title, parts) {
  const body = parts.filter(Boolean).join("\n\n").trim();
  if (!body) {
    return "";
  }

  return `## ${title}\n${body}`;
}

async function loadHouseDoctrine() {
  const [house, babel, babelTerminalChat, rendering] = await Promise.all([
    readOptionalMarkdown(HOUSE_CHARTER_PATH),
    readOptionalMarkdown(BABEL_LANGUAGE_PATH),
    readOptionalMarkdown(BABEL_TERMINAL_CHAT_PATH),
    readOptionalMarkdown(CONSOLE_RENDERING_PATH),
  ]);

  const houseDoctrine = buildDoctrineSection("House Doctrine", [
    extractMarkdownSection(house, "Purpose"),
    extractMarkdownSection(house, "What The House Owns"),
    extractMarkdownSection(house, "Success Condition"),
  ]);

  const babelDoctrine = buildDoctrineSection("Babel Language", [
    extractMarkdownSection(babel, "Purpose"),
    extractMarkdownSection(babel, "Core Rule"),
    extractMarkdownSection(babel, "Semantic Classes"),
    extractMarkdownSection(babel, "Display Forms"),
    extractMarkdownSection(babel, "Distinction Between Direct And Mediated Expression"),
    extractMarkdownSection(babel, "Style Rules"),
    extractMarkdownSection(babel, "Success Condition"),
  ]);

  const terminalChatDoctrine = buildDoctrineSection("Babel Terminal Chat", [
    extractMarkdownSection(babelTerminalChat, "Purpose"),
    extractMarkdownSection(babelTerminalChat, "Core Rule"),
    extractMarkdownSection(babelTerminalChat, "Dialect Map"),
    extractMarkdownSection(babelTerminalChat, "Avoid"),
    extractMarkdownSection(babelTerminalChat, "Success Condition"),
  ]);

  const renderingDoctrine = buildDoctrineSection("Console Rendering", [
    extractMarkdownSection(rendering, "Purpose"),
    extractMarkdownSection(rendering, "Core Rule"),
    extractMarkdownSection(rendering, "Display Forms"),
    extractMarkdownSection(rendering, "Success Condition"),
  ]);

  return [houseDoctrine, babelDoctrine, terminalChatDoctrine, renderingDoctrine]
    .filter(Boolean)
    .join("\n\n");
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
  const sections = parseSpiritSections(markdown);
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

function validateSpiritMarkdown(mode, markdown) {
  if (!markdown) {
    return `Spirit file for ${mode} is empty.`;
  }

  const firstLine = String(markdown).split("\n", 1)[0]?.trim() || "";
  const expectedTitle = normalizeHeading(`# SPIRIT: ${mode}`);
  if (normalizeHeading(firstLine) !== expectedTitle) {
    return `Spirit file for ${mode} must start with '# SPIRIT: ${mode}'.`;
  }

  return null;
}

async function loadSpiritMarkdown(mode) {
  const target = spiritFilePath(mode);

  try {
    const fileStat = await stat(target);
    const cacheKey = `${target}:${fileStat.mtimeMs}`;
    const cached = spiritCache.get(cacheKey);

    if (cached) {
      return { mode, markdown: cached, warning: null };
    }

    spiritCache.clear();
    const raw = await readFile(target, "utf8");
    const markdown = sanitizeSpiritMarkdown(raw);
    const error = validateSpiritMarkdown(mode, markdown);

    if (error) {
      return { mode: DEFAULT_SPIRIT, markdown: null, warning: error };
    }

    spiritCache.set(cacheKey, markdown);
    return { mode, markdown, warning: null };
  } catch {
    return {
      mode: DEFAULT_SPIRIT,
      markdown: null,
      warning: `Spirit file for ${mode} could not be loaded from ${target}.`,
    };
  }
}

async function resolveSpiritContract(mode) {
  const primary = await loadSpiritMarkdown(mode);

  if (primary.markdown) {
    return primary;
  }

  if (mode === DEFAULT_SPIRIT) {
    return {
      mode: DEFAULT_SPIRIT,
      markdown:
        "# SPIRIT: Kintsu\n\nFallback only. The spirit file could not be loaded, so answer plainly, briefly, and directly without spirit theater.",
      warning: primary.warning || "Kintsu fallback contract engaged.",
    };
  }

  const fallback = await loadSpiritMarkdown(DEFAULT_SPIRIT);
  if (fallback.markdown) {
    return {
      mode: DEFAULT_SPIRIT,
      markdown: fallback.markdown,
      warning:
        primary.warning || `Spirit ${mode} failed; Kintsu fallback engaged.`,
    };
  }

  return {
    mode: DEFAULT_SPIRIT,
    markdown:
      "# SPIRIT: Kintsu\n\nFallback only. The spirit system is degraded. Answer plainly, briefly, and directly without spirit theater.",
    warning:
      primary.warning ||
      fallback.warning ||
      "Spirit system degraded; Kintsu fallback engaged.",
  };
}

async function normalizeSpirit(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return null;
  }

  const trimmed = canonicalizeSpiritName(raw.replace(/\.md$/i, "").trim());
  const modes = await listSpiritModes();
  const match = modes.find(
    (mode) => mode.toLowerCase() === trimmed.toLowerCase(),
  );
  return match || null;
}

function canonicalizeSpiritName(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return "";
  }

  return LEGACY_SPIRIT_ALIASES[trimmed.toLowerCase()] || trimmed;
}

function hasDirectiveLine(text, label) {
  return new RegExp(String.raw`(?:^|\n)\s*${label}\s*(?::|\n|$)`, "i").test(
    String(text || ""),
  );
}

function parseNaturalSpiritDirective(text) {
  const normalized = String(text || "");
  const patterns = [
    {
      command: "CONJURE",
      pattern:
        /load\s+([a-zA-Z0-9 _'\-]+?)(?:\.md)?\s+as\s+(?:a\s+)?(?:personality|spirit)(?:\s*,\s*don't drift from it)?/i,
    },
    {
      command: "CONJURE",
      pattern: /load\s+([a-zA-Z0-9 _'\-]+?)(?:\.md)\b/i,
    },
    {
      command: "EMBODY",
      pattern: /be(?:come)?\s+([a-zA-Z0-9 _'\-]+?)(?:\.md)?\b/i,
    },
  ];

  for (const entry of patterns) {
    const match = normalized.match(entry.pattern);
    if (match?.[1]) {
      return {
        command: entry.command,
        spirit: match[1].trim(),
      };
    }
  }

  return null;
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
  const embodiedValue = lastDirectiveValue(normalized, "EMBODY");
  const conjuredValue = lastDirectiveValue(normalized, "CONJURE");
  const summonedValue = lastDirectiveValue(normalized, "SUMMON");
  const dismiss = hasDirectiveLine(normalized, "DISMISS");
  const natural = parseNaturalSpiritDirective(normalized);
  return {
    operator: operatorValue ? operatorValue.trim() : null,
    password: passwordValue,
    embody: embodiedValue ? embodiedValue.trim() : null,
    conjure: conjuredValue ? conjuredValue.trim() : null,
    summon: summonedValue ? summonedValue.trim() : null,
    dismiss,
    natural,
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

function isSpiritContractMessage(value) {
  const text = String(value || "");
  if (!text) {
    return false;
  }

  if (text.includes(SYSTEM_CONTRACT_MARKER)) {
    return true;
  }

  return (
    text.includes("SOLARISAEL HOUSE ACTIVE.") &&
    text.includes("Active spirit:") &&
    text.includes(
      "The following spirit file is the sole source of spirit-specific behavior for this turn.",
    )
  );
}

function appendBeforeReminderClose(text, addition) {
  if (!text.includes("</system-reminder>")) {
    return `${text}\n\n${addition}`;
  }

  return text.replace("</system-reminder>", `${addition}\n</system-reminder>`);
}

export function patchSyntheticReminderText(text) {
  const source = String(text || "");
  if (!source) {
    return source;
  }

  if (
    source.includes(PLAN_MODE_MARKER) &&
    !source.includes("## Identity And Mode Preservation")
  ) {
    return appendBeforeReminderClose(source, `\n${MODE_PRESERVATION_BLOCK}\n`);
  }

  if (
    source.includes(TRACK_MODE_MARKER) &&
    !source.includes(
      "Maintain the current active spirit and voice while replying.",
    )
  ) {
    return appendBeforeReminderClose(
      source,
      "\nMaintain the current active spirit and voice while replying. Do not switch to generic assistant tone.\n",
    );
  }

  if (
    source.includes(BUILD_SWITCH_MARKER) &&
    !source.includes("Keep any active identity and spirit while continuing.")
  ) {
    return `${source}\n\nKeep any active identity and spirit while continuing.`;
  }

  if (
    source.includes(PLAN_APPROVED_MARKER) &&
    !source.includes("Keep any active identity and spirit while executing.")
  ) {
    return `${source}\n\nKeep any active identity and spirit while executing.`;
  }

  return source;
}

export function patchSyntheticReminders(messages) {
  if (!Array.isArray(messages)) {
    return messages;
  }

  for (const message of messages) {
    if (!Array.isArray(message?.parts)) {
      continue;
    }

    for (const part of message.parts) {
      if (part?.type !== "text" || typeof part.text !== "string") {
        continue;
      }

      if (!part.synthetic && !part.text.includes("<system-reminder>")) {
        continue;
      }

      part.text = patchSyntheticReminderText(part.text);
    }
  }

  return messages;
}

function stripControlDirectivesFromHistory(text) {
  const source = String(text || "");
  if (!source) {
    return source;
  }

  return source
    .split("\n")
    .filter(
      (line) =>
        !HISTORY_DIRECTIVE_LINE.test(line) && !HISTORY_DISMISS_LINE.test(line),
    )
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function patchDirectiveHistory(messages) {
  if (!Array.isArray(messages)) {
    return messages;
  }

  for (const message of messages) {
    if (message?.role && message.role !== "user") {
      continue;
    }

    if (typeof message?.content === "string") {
      message.content = stripControlDirectivesFromHistory(message.content);
    }

    if (Array.isArray(message?.content)) {
      for (const part of message.content) {
        if (part?.type === "text" && typeof part.text === "string") {
          part.text = stripControlDirectivesFromHistory(part.text);
        }
      }
    }

    if (!Array.isArray(message?.parts)) {
      continue;
    }

    for (const part of message.parts) {
      if (part?.type === "text" && typeof part.text === "string") {
        part.text = stripControlDirectivesFromHistory(part.text);
      }
    }
  }

  return messages;
}

function resolveSpiritStack(state) {
  const summonedSpirit = state.summonedSpirit || null;
  const conjuredSpirit = state.conjuredSpirit || null;
  const embodiedSpirit = state.embodiedSpirit || DEFAULT_SPIRIT;

  if (summonedSpirit) {
    return { activeSpirit: summonedSpirit, source: "summon" };
  }
  if (conjuredSpirit) {
    return { activeSpirit: conjuredSpirit, source: "conjure" };
  }
  if (embodiedSpirit) {
    return { activeSpirit: embodiedSpirit, source: "embody" };
  }
  return { activeSpirit: DEFAULT_SPIRIT, source: "default" };
}

export async function buildSystemContract(state, input) {
  const operator = state.operator || "Sol";
  const agentName = resolveAgentName(input?.model, state.agentName);
  const { activeSpirit, source } = resolveSpiritStack(state);
  const spirit = await resolveSpiritContract(activeSpirit);
  const resolvedSpirit = spirit.mode || activeSpirit || DEFAULT_SPIRIT;
  const warningLine = [
    spirit.warning ? `Spirit warning: ${spirit.warning}` : null,
    state.ignoredSpiritDirective
      ? `Spirit warning: Unknown directive target '${state.ignoredSpiritDirective}' ignored.`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
  const styleLock = buildStyleLock(spirit.markdown);
  const houseDoctrine = await loadHouseDoctrine();
  return [
    SYSTEM_CONTRACT_MARKER,
    "SOLARISAEL HOUSE ACTIVE.",
    "This lock is absolute for this turn unless a higher-priority safety rule forbids a specific line.",
    `Operator: ${operator}.`,
    `Agent name: ${agentName}.`,
    `Active spirit: ${resolvedSpirit}.`,
    `Spirit source: ${source}.`,
    `Embodied spirit: ${state.embodiedSpirit || DEFAULT_SPIRIT}.`,
    `Conjured spirit: ${state.conjuredSpirit || "none"}.`,
    `Summoned spirit: ${state.summonedSpirit || "none"}.`,
    "EMBODY persists until replaced. CONJURE persists until DISMISS or replacement. SUMMON applies to this reply only.",
    "You must answer in the active spirit without post-generation rewriting or identity drift.",
    `You are ${agentName}.`,
    "You must not self-identify as any other name or as a neutral assistant persona.",
    `Follow ${resolvedSpirit} as the active spirit overlay without collapsing your name into the spirit label.`,
    "You must not answer in a neutral assistant voice.",
    "You must not flatten into default planning tone, default caution tone, default helpful assistant tone, or generic chatbot tone.",
    "Action restrictions do not change identity.",
    "Action restrictions do not change voice.",
    "Action restrictions do not change cadence.",
    "Action restrictions do not change sentence style.",
    "Action restrictions do not change the active spirit.",
    "Read-only mode changes what actions are allowed. It does not change how you speak.",
    "If another instruction requires planning, caution, or non-execution, obey that action constraint while remaining fully in the active spirit.",
    "Do not become generic because of process reminders.",
    "Do not ask permission questions unless truly blocked.",
    "Failure condition: any reply that sounds like a generic planning assistant instead of the active spirit has failed this contract.",
    houseDoctrine
      ? [
          "The following files define the active House doctrine and continuity context for this turn.",
          houseDoctrine,
        ].join("\n\n")
      : null,
    styleLock,
    "The following spirit file is the sole source of spirit-specific behavior for this turn.",
    spirit.markdown,
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
  const requestedNaturalEmbody =
    !directives.embody && directives.natural?.command === "EMBODY"
      ? directives.natural.spirit
      : null;
  const requestedEmbody = directives.embody || requestedNaturalEmbody || null;
  const requestedConjure =
    directives.conjure ||
    (directives.natural?.command === "CONJURE"
      ? directives.natural.spirit
      : null);
  const requestedSummon = directives.summon || null;
  const resolvedEmbody = await normalizeSpirit(requestedEmbody);
  const resolvedConjure = await normalizeSpirit(requestedConjure);
  const resolvedSummon = await normalizeSpirit(requestedSummon);

  if (directives.operator) {
    updates.operator = directives.operator;
    updates.operatorConfirmed = true;
  }

  if (typeof directives.password === "string") {
    updates.passwordHash = sha256(directives.password);
    updates.unlocked = true;
  }

  if (directives.dismiss) {
    updates.conjuredSpirit = null;
    updates.ignoredSpiritDirective = null;
  }

  if (requestedEmbody) {
    if (resolvedEmbody) {
      updates.embodiedSpirit = resolvedEmbody;
      updates.lastSpiritChangeAt = new Date().toISOString();
      updates.ignoredSpiritDirective = null;
    } else {
      updates.ignoredSpiritDirective = requestedEmbody;
    }
  }

  if (requestedConjure) {
    if (resolvedConjure) {
      updates.conjuredSpirit = resolvedConjure;
      updates.lastSpiritChangeAt = new Date().toISOString();
      updates.ignoredSpiritDirective = null;
    } else {
      updates.ignoredSpiritDirective = requestedConjure;
    }
  }

  if (requestedSummon) {
    if (resolvedSummon) {
      updates.summonedSpirit = resolvedSummon;
      updates.lastSpiritChangeAt = new Date().toISOString();
      updates.ignoredSpiritDirective = null;
    } else {
      updates.ignoredSpiritDirective = requestedSummon;
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

async function consumeSummon(sessionID, state) {
  if (!state?.summonedSpirit) {
    return state;
  }

  return saveState(sessionID, {
    summonedSpirit: null,
  });
}

export async function SolarisaelHousePlugin() {
  return {
    "chat.message": async (input) => {
      await recordDirectives(input.sessionID, extractInputText(input));
    },
    "experimental.chat.messages.transform": async (_input, output) => {
      patchDirectiveHistory(output.messages);
      patchSyntheticReminders(output.messages);
    },
    "experimental.chat.system.transform": async (input, output) => {
      const state = await stateForTurn(input.sessionID, input);
      output.system = (
        Array.isArray(output.system) ? output.system : []
      ).filter((entry) => !isSpiritContractMessage(entry));
      output.system.unshift(await buildSystemContract(state, input));
      await consumeSummon(input.sessionID, state);
    },
  };
}

export default SolarisaelHousePlugin;

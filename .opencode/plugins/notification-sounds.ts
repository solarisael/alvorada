import { access } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import type { Plugin } from "@opencode-ai/plugin";

type SoundKey = "start" | "done" | "error" | "input" | "help";
type InterruptMode = "none" | "global" | "perSession";

const SOUND_EXTENSIONS = [".mp3", ".wav"];
const THROTTLE_MS: Record<SoundKey, number> = {
  start: 1200,
  done: 1000,
  error: 1000,
  input: 800,
  help: 800,
};
const DEFAULT_VOLUME = 0.1;
const DEFAULT_INTERRUPT_MODE: InterruptMode = "perSession";
const DEFAULT_MAX_CONCURRENT_SESSIONS = 2;
const GLOBAL_LANE_ID = "__global__";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseNumberEnv(
  name: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return clamp(parsed, min, max);
}

function parseIntegerEnv(
  name: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return clamp(parsed, min, max);
}

function parseInterruptModeEnv(
  name: string,
  fallback: InterruptMode,
): InterruptMode {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  if (raw === "none" || raw === "global" || raw === "perSession") {
    return raw;
  }

  return fallback;
}

const SOUND_VOLUME = parseNumberEnv(
  "OPENCODE_SOUND_VOLUME",
  DEFAULT_VOLUME,
  0,
  1,
);
const INTERRUPT_MODE = parseInterruptModeEnv(
  "OPENCODE_SOUND_INTERRUPT_MODE",
  DEFAULT_INTERRUPT_MODE,
);
const MAX_CONCURRENT_SESSIONS = parseIntegerEnv(
  "OPENCODE_SOUND_MAX_CONCURRENT_SESSIONS",
  DEFAULT_MAX_CONCURRENT_SESSIONS,
  1,
  10,
);

type PlaybackEntry = {
  process: ReturnType<typeof Bun.spawn>;
  token: symbol;
};

export const NotificationSoundsPlugin: Plugin = async ({
  $,
  directory,
  worktree,
}) => {
  const lastPlayedAt = new Map<SoundKey, number>();
  const sessionBusy = new Map<string, boolean>();
  const activePlaybacks = new Map<string, PlaybackEntry>();
  let ffplayAvailable: boolean | null = null;

  function getSessionID(event: {
    properties?: { sessionID?: string };
  }): string | null {
    return event.properties?.sessionID ?? null;
  }

  function getLaneID(sessionID: string | null): string {
    if (INTERRUPT_MODE === "global") {
      return GLOBAL_LANE_ID;
    }

    if (INTERRUPT_MODE === "perSession" && sessionID) {
      return `session:${sessionID}`;
    }

    return GLOBAL_LANE_ID;
  }

  function canPlayInSessionLane(sessionID: string | null): boolean {
    if (INTERRUPT_MODE !== "perSession" || !sessionID) {
      return true;
    }

    const laneID = getLaneID(sessionID);
    if (activePlaybacks.has(laneID)) {
      return true;
    }

    let activeSessionLanes = 0;
    for (const key of activePlaybacks.keys()) {
      if (key.startsWith("session:")) {
        activeSessionLanes += 1;
      }
    }

    return activeSessionLanes < MAX_CONCURRENT_SESSIONS;
  }

  async function fileExists(filePath: string): Promise<boolean> {
    try {
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  function collectSoundDirectories(): string[] {
    const candidates: string[] = [];
    const explicitDir = process.env.OPENCODE_SOUNDS_DIR;

    if (explicitDir) {
      candidates.push(path.resolve(explicitDir));
    }

    candidates.push(path.resolve(directory, ".opencode", "sounds"));

    const siblingSharedDir = path.resolve(
      directory,
      "..",
      "ai-shared",
      ".opencode",
      "sounds",
    );
    candidates.push(siblingSharedDir);

    const siblingSharedFromWorktree = path.resolve(
      worktree,
      "..",
      "ai-shared",
      ".opencode",
      "sounds",
    );
    candidates.push(siblingSharedFromWorktree);

    const globalSoundsDir = path.resolve(
      homedir(),
      ".config",
      "opencode",
      "sounds",
    );
    candidates.push(globalSoundsDir);

    return Array.from(new Set(candidates));
  }

  async function resolveSoundPath(key: SoundKey): Promise<string | null> {
    const directories = collectSoundDirectories();

    for (const dir of directories) {
      for (const extension of SOUND_EXTENSIONS) {
        const candidate = path.join(dir, `${key}${extension}`);
        if (await fileExists(candidate)) {
          return candidate;
        }
      }
    }

    return null;
  }

  function isThrottled(key: SoundKey): boolean {
    const now = Date.now();
    const previous = lastPlayedAt.get(key) ?? 0;
    if (now - previous < THROTTLE_MS[key]) {
      return true;
    }
    lastPlayedAt.set(key, now);
    return false;
  }

  async function ensureFfplayAvailable(): Promise<boolean> {
    if (ffplayAvailable !== null) {
      return ffplayAvailable;
    }

    const probe = await $`ffplay -version`.nothrow().quiet();
    ffplayAvailable = probe.exitCode === 0;
    return ffplayAvailable;
  }

  async function stopLanePlayback(laneID: string): Promise<void> {
    const active = activePlaybacks.get(laneID);
    if (!active) {
      return;
    }

    active.process.kill();
    await active.process.exited.catch(() => undefined);

    const current = activePlaybacks.get(laneID);
    if (current?.token === active.token) {
      activePlaybacks.delete(laneID);
    }
  }

  async function playWithFfplay(
    soundPath: string,
    sessionID: string | null,
  ): Promise<void> {
    if (INTERRUPT_MODE === "none") {
      await Bun.spawn(
        [
          "ffplay",
          "-nodisp",
          "-autoexit",
          "-loglevel",
          "quiet",
          "-af",
          `volume=${SOUND_VOLUME}`,
          soundPath,
        ],
        {
          stdin: "ignore",
          stdout: "ignore",
          stderr: "ignore",
        },
      ).exited;
      return;
    }

    const laneID = getLaneID(sessionID);
    if (!canPlayInSessionLane(sessionID)) {
      return;
    }

    await stopLanePlayback(laneID);

    const process = Bun.spawn(
      [
        "ffplay",
        "-nodisp",
        "-autoexit",
        "-loglevel",
        "quiet",
        "-af",
        `volume=${SOUND_VOLUME}`,
        soundPath,
      ],
      {
        stdin: "ignore",
        stdout: "ignore",
        stderr: "ignore",
      },
    );

    const entry: PlaybackEntry = {
      process,
      token: Symbol(laneID),
    };

    activePlaybacks.set(laneID, entry);

    await process.exited.catch(() => undefined);

    const current = activePlaybacks.get(laneID);
    if (current?.token === entry.token) {
      activePlaybacks.delete(laneID);
    }
  }

  async function playSound(
    key: SoundKey,
    sessionID: string | null,
  ): Promise<void> {
    if (!(await ensureFfplayAvailable())) {
      return;
    }

    if (isThrottled(key)) {
      return;
    }

    const soundPath = await resolveSoundPath(key);
    if (!soundPath) {
      return;
    }

    await playWithFfplay(soundPath, sessionID);
  }

  return {
    event: async ({ event }) => {
      const eventType = (event as { type: string }).type;
      const sessionID = getSessionID(
        event as { properties?: { sessionID?: string } },
      );

      if (eventType === "question.asked") {
        await playSound("input", sessionID);
        return;
      }

      if (eventType === "permission.asked") {
        await playSound("help", sessionID);
        return;
      }

      if (eventType === "session.error") {
        if (sessionID) {
          sessionBusy.delete(sessionID);
        }
        await playSound("error", sessionID);
        return;
      }

      if (eventType === "session.idle") {
        if (sessionID) {
          sessionBusy.delete(sessionID);
        }
        await playSound("done", sessionID);
        return;
      }

      if (eventType !== "session.status") {
        return;
      }

      const properties = (
        event as {
          properties?: { sessionID?: string; status?: { type?: string } };
        }
      ).properties;
      const statusSessionID = properties?.sessionID;
      const statusType = properties?.status?.type;

      if (!statusSessionID || !statusType) {
        return;
      }

      if (statusType === "busy") {
        if (!sessionBusy.get(statusSessionID)) {
          sessionBusy.set(statusSessionID, true);
          await playSound("start", statusSessionID);
        }
        return;
      }

      sessionBusy.delete(statusSessionID);
    },
  };
};

export default NotificationSoundsPlugin;

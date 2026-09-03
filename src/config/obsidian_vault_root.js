import { statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const OBSIDIAN_ROOT_ENV = "SOLARISAEL_OBSIDIAN_ROOT";
export const DEFAULT_OBSIDIAN_VAULT_ROOT = "C:/Solarisael/Obsidian/obsidian";
export const LOCAL_CONTENT_ROOT = fileURLToPath(
  new URL("../../content/", import.meta.url),
);

const WINDOWS_ABSOLUTE_PATH = /^[A-Za-z]:[\\/]/;

const is_absolute_path = (path_value) =>
  path.isAbsolute(path_value) || WINDOWS_ABSOLUTE_PATH.test(path_value);

const is_directory = (path_value) => {
  try {
    return statSync(path_value).isDirectory();
  } catch {
    return false;
  }
};

const normalize_root = (path_value) => path.normalize(path_value);

/**
 * The content tools share this resolver. The checked-in copy keeps them usable
 * when the external vault is unavailable.
 */
export const resolve_obsidian_vault_root = ({
  env = process.env,
  platform = process.platform,
  default_root = DEFAULT_OBSIDIAN_VAULT_ROOT,
  local_root = LOCAL_CONTENT_ROOT,
} = {}) => {
  const configured_root = String(env?.[OBSIDIAN_ROOT_ENV] ?? "").trim();

  if (configured_root) {
    if (!is_absolute_path(configured_root)) {
      throw new Error(
        `[solarisael] ${OBSIDIAN_ROOT_ENV} must be an absolute directory path; received ${configured_root}`,
      );
    }

    if (!is_directory(configured_root)) {
      throw new Error(
        `[solarisael] ${OBSIDIAN_ROOT_ENV} points to a missing directory: ${configured_root}`,
      );
    }

    return normalize_root(configured_root);
  }

  if (platform === "win32" && is_directory(default_root)) {
    return normalize_root(default_root);
  }

  if (!is_directory(local_root)) {
    throw new Error(
      `[solarisael] checked-in content directory is missing: ${local_root}`,
    );
  }

  return normalize_root(local_root);
};

export const OBSIDIAN_VAULT_ROOT = resolve_obsidian_vault_root();

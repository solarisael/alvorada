import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "bun:test";
import {
  DEFAULT_OBSIDIAN_VAULT_ROOT,
  LOCAL_CONTENT_ROOT,
  OBSIDIAN_ROOT_ENV,
  resolve_obsidian_vault_root,
} from "../src/config/obsidian_vault_root.js";

const temporary_roots = [];

const make_temporary_root = () => {
  const root = mkdtempSync(path.join(tmpdir(), "solarisael-vault-root-"));
  temporary_roots.push(root);
  return root;
};

afterEach(() => {
  for (const root of temporary_roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("resolve_obsidian_vault_root", () => {
  test("uses the checked-in root for CI-like platforms without an override", () => {
    const local_root = make_temporary_root();

    expect(
      resolve_obsidian_vault_root({
        env: {},
        platform: "linux",
        local_root,
        default_root: DEFAULT_OBSIDIAN_VAULT_ROOT,
      }),
    ).toBe(path.normalize(local_root));
  });

  test("uses an existing conventional Windows vault when available", () => {
    const default_root = make_temporary_root();
    const local_root = make_temporary_root();

    expect(
      resolve_obsidian_vault_root({
        env: {},
        platform: "win32",
        default_root,
        local_root,
      }),
    ).toBe(path.normalize(default_root));
  });

  test("treats an explicit external vault as authoritative", () => {
    const external_root = make_temporary_root();

    expect(
      resolve_obsidian_vault_root({
        env: { [OBSIDIAN_ROOT_ENV]: external_root },
        platform: "linux",
        local_root: LOCAL_CONTENT_ROOT,
      }),
    ).toBe(path.normalize(external_root));
  });

  test("fails explicitly for a missing explicit vault", () => {
    const missing_root = make_temporary_root();
    rmSync(missing_root, { recursive: true, force: true });

    expect(() =>
      resolve_obsidian_vault_root({
        env: { [OBSIDIAN_ROOT_ENV]: missing_root },
        platform: "linux",
      }),
    ).toThrow(`${OBSIDIAN_ROOT_ENV} points to a missing directory`);
  });
});

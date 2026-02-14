import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { text_fx_effect_class_map } from "../public/js/modules/text_effects.js";

const test_page_paths = [
  resolve("src/pages/codex/labs/test-texts.md"),
  resolve("src/pages/codex/labs/test-overlays.md"),
];

const test_page_source = test_page_paths
  .map((page_path) => readFileSync(page_path, "utf8"))
  .join("\n\n");

const has_effect_marker = (effect_name) => {
  const escaped_effect_name = effect_name.replaceAll("_", "[_]");
  const marker_regex = new RegExp(
    `\\{\\{fx:${escaped_effect_name}(?::|\\||\\}\\})`,
    "i",
  );

  return marker_regex.test(test_page_source);
};

describe("effect sandbox coverage", () => {
  test("every registered effect is present in test pages", () => {
    const registered_effect_names = Object.keys(
      text_fx_effect_class_map,
    ).sort();
    const missing_effect_names = registered_effect_names.filter(
      (effect_name) => !has_effect_marker(effect_name),
    );

    expect(missing_effect_names).toEqual([]);
  });
});

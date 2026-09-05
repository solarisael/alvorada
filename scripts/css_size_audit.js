#!/usr/bin/env bun

import { readFileSync } from "node:fs";

const usage = `Usage:
  bun scripts/css_size_audit.js check [--scope=priority-a|all]
`;

const args = process.argv.slice(2);
const mode = args[0];

if (mode !== "check") {
  console.error(usage);
  process.exit(1);
}

const scope_arg = args.find((value) => value.startsWith("--scope="));
const scope = scope_arg ? scope_arg.slice("--scope=".length) : "priority-a";

const file_scope_map = {
  "priority-a": ["src/styles/components/side_menu.css", "src/styles/index.css"],
};

const files_to_scan =
  scope === "all"
    ? [...new Bun.Glob("src/styles/**/*.css").scanSync({ onlyFiles: true })]
    : file_scope_map[scope];

if (!files_to_scan) {
  console.error(usage);
  process.exit(1);
}

const css_property_px_forbidden_pattern =
  /^\s*(width|height|min-width|min-height|max-width|max-height|inset|top|right|bottom|left|outline-offset)\s*:\s*[^;]*\b\d*\.?\d+px\b/i;

const css_transform_px_forbidden_pattern =
  /^\s*transform\s*:\s*[^;]*(translate|translatex|translatey|translate3d)\([^)]*\b\d*\.?\d+px\b[^)]*\)/i;

const css_variable_px_forbidden_pattern =
  /^\s*--([a-z0-9_-]+)\s*:\s*[^;]*\b\d*\.?\d+px\b/i;

const allowed_variable_name_hints = [
  "blur",
  "shadow",
  "border",
  "stroke",
  "radius",
  "ring",
  "outline",
];

const size_sensitive_variable_hints = [
  "width",
  "height",
  "offset",
  "inset",
  "translate",
  "shift",
  "size",
  "inline",
  "block",
  "lift",
];

const violations = [];

for (const file_path of files_to_scan) {
  const source = readFileSync(file_path, "utf8");

  const source_lines = source.split(/\r?\n/);

  source_lines.forEach((line_value, line_index) => {
    if (
      css_property_px_forbidden_pattern.test(line_value) ||
      css_transform_px_forbidden_pattern.test(line_value)
    ) {
      violations.push({
        file_path,
        line_number: line_index + 1,
        reason: "px used in forbidden size/offset/transform property",
        line_value: line_value.trim(),
      });
      return;
    }

    const variable_match = css_variable_px_forbidden_pattern.exec(line_value);

    if (!variable_match) {
      return;
    }

    const variable_name = variable_match[1].toLowerCase();
    const is_allowed_exception = allowed_variable_name_hints.some((hint) =>
      variable_name.includes(hint),
    );
    const is_size_sensitive = size_sensitive_variable_hints.some((hint) =>
      variable_name.includes(hint),
    );

    if (is_size_sensitive && !is_allowed_exception) {
      violations.push({
        file_path,
        line_number: line_index + 1,
        reason: "px used in size-sensitive custom property",
        line_value: line_value.trim(),
      });
    }
  });
}

if (violations.length === 0) {
  console.log(`[css-size-audit] OK (${scope}): no hard violations found.`);
  process.exit(0);
}

console.error(`[css-size-audit] Found ${violations.length} hard violation(s):`);

for (const violation of violations) {
  console.error(
    `- ${violation.file_path}:${violation.line_number} ${violation.reason}`,
  );
  console.error(`  ${violation.line_value}`);
}

process.exit(1);

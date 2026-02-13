#!/usr/bin/env bun

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const usage = `Usage:
  bun scripts/css_background_stack_audit.js check
`;

const args = process.argv.slice(2);
const mode = args[0];

if (mode !== "check") {
  console.error(usage);
  process.exit(1);
}

const css_file_paths = [];

const collect_css_files = (directory_path) => {
  const entries = readdirSync(directory_path);

  for (const entry_name of entries) {
    const entry_path = join(directory_path, entry_name);
    const entry_stats = statSync(entry_path);

    if (entry_stats.isDirectory()) {
      collect_css_files(entry_path);
      continue;
    }

    if (!entry_name.endsWith(".css")) {
      continue;
    }

    css_file_paths.push(entry_path.replaceAll("\\", "/"));
  }
};

collect_css_files("src/styles");

const declaration_start_pattern =
  /^\s*background(?:-image)?\s*:\s*(?!\s*none\s*;)/i;
const exception_marker = "bg-stack-exception";
const max_layers = 2;

const remove_css_comments = (value) =>
  value.replaceAll(/\/\*[\s\S]*?\*\//g, "");

const count_top_level_layers = (value) => {
  const text = remove_css_comments(value).trim();

  if (text.length === 0) {
    return 0;
  }

  let depth = 0;
  let layer_count = 1;

  for (const character of text) {
    if (character === "(") {
      depth += 1;
      continue;
    }

    if (character === ")") {
      depth = Math.max(0, depth - 1);
      continue;
    }

    if (character === "," && depth === 0) {
      layer_count += 1;
    }
  }

  return layer_count;
};

const declaration_has_exception = (lines, start_index) => {
  const start_window = Math.max(0, start_index - 3);

  for (let index = start_window; index <= start_index; index += 1) {
    if (lines[index]?.includes(exception_marker)) {
      return true;
    }
  }

  return false;
};

const violations = [];

for (const file_path of css_file_paths) {
  const source = readFileSync(file_path, "utf8");
  const source_lines = source.split(/\r?\n/);

  for (let line_index = 0; line_index < source_lines.length; line_index += 1) {
    const line_value = source_lines[line_index];

    if (!declaration_start_pattern.test(line_value)) {
      continue;
    }

    const declaration_lines = [line_value];
    let end_index = line_index;

    while (
      !declaration_lines.at(-1)?.includes(";") &&
      end_index < source_lines.length - 1
    ) {
      end_index += 1;
      declaration_lines.push(source_lines[end_index]);
    }

    const declaration_text = declaration_lines.join(" ");
    const value_start_index = declaration_text.indexOf(":");
    const value_end_index = declaration_text.lastIndexOf(";");

    if (value_start_index === -1 || value_end_index === -1) {
      line_index = end_index;
      continue;
    }

    const raw_value = declaration_text
      .slice(value_start_index + 1, value_end_index)
      .trim();
    const layer_count = count_top_level_layers(raw_value);
    const has_exception = declaration_has_exception(source_lines, line_index);

    if (layer_count > max_layers && !has_exception) {
      violations.push({
        file_path,
        line_number: line_index + 1,
        layer_count,
        value_preview: raw_value.slice(0, 180),
      });
    }

    line_index = end_index;
  }
}

if (violations.length === 0) {
  console.log(
    `[css-bg-stack-audit] OK: no decorative stack above ${max_layers}.`,
  );
  process.exit(0);
}

console.error(
  `[css-bg-stack-audit] Found ${violations.length} stack violation(s) above ${max_layers} layers:`,
);

for (const violation of violations) {
  console.error(
    `- ${violation.file_path}:${violation.line_number} (${violation.layer_count} layers)`,
  );
  console.error(`  ${violation.value_preview}`);
}

console.error(
  "Add an inline marker for justified exceptions: /* bg-stack-exception: <reason> */",
);

process.exit(1);

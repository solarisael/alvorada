#!/usr/bin/env bun

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const usage = `Usage:
  bun scripts/css_ornaments_audit.js check
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

const ornament_url_pattern = /url\((?:["'])?\s*\/ornaments\//i;
const violations = [];

for (const file_path of css_file_paths) {
  const source = readFileSync(file_path, "utf8");
  const source_lines = source.split(/\r?\n/);

  source_lines.forEach((line_value, line_index) => {
    if (!ornament_url_pattern.test(line_value)) {
      return;
    }

    violations.push({
      file_path,
      line_number: line_index + 1,
      line_value: line_value.trim(),
    });
  });
}

if (violations.length === 0) {
  console.log("[css-ornaments-audit] OK: no ornament URLs in CSS.");
  process.exit(0);
}

console.error(
  `[css-ornaments-audit] Found ${violations.length} forbidden ornament URL reference(s):`,
);

for (const violation of violations) {
  console.error(`- ${violation.file_path}:${violation.line_number}`);
  console.error(`  ${violation.line_value}`);
}

process.exit(1);

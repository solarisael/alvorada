#!/usr/bin/env bun

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import {
  parse_tag_identity,
  validate_scene_identity_consistency,
} from "../src/data/rubedo/scene_identity.js";

const usage = `Usage:
  bun scripts/rubedo_scene_identity_audit.js check
`;

const args = process.argv.slice(2);
const mode = args[0];

if (mode !== "check") {
  console.error(usage);
  process.exit(1);
}

const scene_root_directory = "src/data/rubedo/scenes";
const markdown_file_paths = [];

const collect_markdown_files = (directory_path) => {
  const entries = readdirSync(directory_path);

  for (const entry_name of entries) {
    const entry_path = join(directory_path, entry_name);
    const entry_stats = statSync(entry_path);

    if (entry_stats.isDirectory()) {
      collect_markdown_files(entry_path);
      continue;
    }

    if (!entry_name.endsWith(".md")) {
      continue;
    }

    markdown_file_paths.push(entry_path.replaceAll("\\", "/"));
  }
};

const strip_yaml_scalar = (raw_value = "") => {
  const trimmed_value = String(raw_value).trim();

  if (
    (trimmed_value.startsWith('"') && trimmed_value.endsWith('"')) ||
    (trimmed_value.startsWith("'") && trimmed_value.endsWith("'"))
  ) {
    return trimmed_value.slice(1, -1);
  }

  return trimmed_value;
};

const extract_frontmatter = (source_text = "") => {
  const frontmatter_match = source_text.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  if (!frontmatter_match) {
    return null;
  }

  const frontmatter_source = frontmatter_match[1] ?? "";
  const frontmatter_lines = frontmatter_source.split(/\r?\n/);
  const frontmatter = {};

  for (
    let line_index = 0;
    line_index < frontmatter_lines.length;
    line_index += 1
  ) {
    const line_value = frontmatter_lines[line_index] ?? "";
    const key_value_match = line_value.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);

    if (!key_value_match) {
      continue;
    }

    const frontmatter_key = key_value_match[1];
    const frontmatter_value = key_value_match[2] ?? "";

    if (frontmatter_key === "tags") {
      const tags = [];

      for (
        let tag_line_index = line_index + 1;
        tag_line_index < frontmatter_lines.length;
        tag_line_index += 1
      ) {
        const tag_line_value = frontmatter_lines[tag_line_index] ?? "";
        const tag_item_match = tag_line_value.match(/^\s*-\s*(.+)$/);

        if (!tag_item_match) {
          break;
        }

        tags.push(strip_yaml_scalar(tag_item_match[1]));
        line_index = tag_line_index;
      }

      frontmatter.tags = tags;
      continue;
    }

    frontmatter[frontmatter_key] = strip_yaml_scalar(frontmatter_value);
  }

  return frontmatter;
};

collect_markdown_files(scene_root_directory);

const violations = [];

for (const markdown_file_path of markdown_file_paths) {
  const source_text = readFileSync(markdown_file_path, "utf8");
  const frontmatter = extract_frontmatter(source_text);

  if (!frontmatter) {
    violations.push({
      file_path: markdown_file_path,
      reason: "missing frontmatter",
    });
    continue;
  }

  const parsed_tag_identity = parse_tag_identity(frontmatter.tags ?? []);
  const identity_validation = validate_scene_identity_consistency({
    frontmatter,
    parsed_tag_identity,
  });

  if (identity_validation.is_valid) {
    continue;
  }

  const reason_parts = [];

  if (!identity_validation.has_phase_tag) {
    reason_parts.push("missing phase:rubedo");
  }

  if (identity_validation.missing_pairs.length > 0) {
    reason_parts.push(
      `missing pairs: ${identity_validation.missing_pairs
        .map(
          (identity_pair) =>
            `${identity_pair.field_label}<->${identity_pair.tag_key}`,
        )
        .join(", ")}`,
    );
  }

  if (identity_validation.mismatched_pairs.length > 0) {
    reason_parts.push(
      `mismatched pairs: ${identity_validation.mismatched_pairs
        .map(
          (identity_pair) =>
            `${identity_pair.field_label}<->${identity_pair.tag_key}`,
        )
        .join(", ")}`,
    );
  }

  violations.push({
    file_path: markdown_file_path,
    reason: reason_parts.join("; "),
  });
}

if (violations.length === 0) {
  console.log(
    `[rubedo-scene-identity-audit] OK: ${markdown_file_paths.length} scene file(s) valid.`,
  );
  process.exit(0);
}

console.error(
  `[rubedo-scene-identity-audit] Found ${violations.length} invalid scene file(s):`,
);

for (const violation of violations) {
  console.error(`- ${violation.file_path}`);
  console.error(`  ${violation.reason}`);
}

process.exit(1);

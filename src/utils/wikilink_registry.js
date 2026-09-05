import {
  REGISTRY_SOURCES,
  is_wikilink_registry_source,
  walk_markdown_files,
  read_source_file,
} from "./wikilinks/sources.js";
import { SOLARISAEL_BASE_URL } from "./wikilinks/routes.js";
import {
  clamp_excerpt,
  parse_simple_frontmatter,
  titlecase_filename_stem,
} from "./wikilinks/frontmatter.js";
import { build_target } from "./wikilinks/targets.js";
import { register_target, reject_conflicts } from "./wikilinks/registration.js";

const build_registry = () => {
  const state = { map: new Map(), conflicts: [] };
  for (const source of REGISTRY_SOURCES) {
    for (const file_path of walk_markdown_files(source.scan_root)) {
      const file = read_source_file(source, file_path);
      if (!file) continue;
      const record = build_target(source, file);
      if (record) register_target(state, source, record);
    }
  }
  reject_conflicts(state.conflicts);
  return state.map;
};

let cached_registry = null;

const get_wikilink_registry = () => {
  if (cached_registry === null) {
    cached_registry = build_registry();
  }
  return cached_registry;
};

const invalidate_wikilink_registry = () => {
  cached_registry = null;
};

const resolve_wikilink_token = (raw_token) => {
  if (typeof raw_token !== "string") {
    return null;
  }
  // Drop heading anchor and block reference from token before lookup —
  // both forms point at the same file in obsidian, deeper-link semantics
  // can come later.
  const clean_token = raw_token
    .replace(/#.*$/, "")
    .replace(/\^.*$/, "")
    .trim()
    .toLowerCase();
  if (!clean_token) {
    return null;
  }

  return get_wikilink_registry().get(clean_token) ?? null;
};

export {
  SOLARISAEL_BASE_URL,
  build_registry,
  clamp_excerpt,
  get_wikilink_registry,
  invalidate_wikilink_registry,
  is_wikilink_registry_source,
  parse_simple_frontmatter,
  resolve_wikilink_token,
  titlecase_filename_stem,
};

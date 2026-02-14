const text_fx_effect_names = Object.freeze([
  "glow",
  "neon",
  "shadow",
  "chroma",
  "blur",
  "flicker",
  "rainbow",
  "gradient",
  "aura",
  "etch",
  "whisper",
  "sigil_pulse",
  "veil",
  "cadence",
  "cadence_soft",
  "cadence_oracular",
  "cadence_childlike",
  "wiggle",
  "float",
  "shake",
  "glitch",
]);

const text_fx_block_effect_names = Object.freeze([
  "terminal",
  "stat_screen",
  "game_screen",
  "quest_log",
  "skill_popup",
  "inventory",
  "combat_feed",
  "status_effects",
  "system_warning",
  "memory_fragment",
  "admin_trace",
  "party_roster",
  "map_ping",
]);

const text_fx_inline_block_effect_names = Object.freeze(["combat_feed"]);

const text_fx_effect_names_with_blocks = Object.freeze([
  ...text_fx_effect_names,
  ...text_fx_block_effect_names,
]);

const text_fx_alias_map = (() => {
  const alias_map = {};

  for (const effect_name of text_fx_effect_names_with_blocks) {
    alias_map[effect_name] = effect_name;
    alias_map[effect_name.replaceAll("-", "_")] = effect_name;
    alias_map[effect_name.replaceAll("_", "-")] = effect_name;

    alias_map[`fx-${effect_name}`] = effect_name;
    alias_map[`fx_${effect_name}`] = effect_name;
    alias_map[`text_fx_${effect_name}`] = effect_name;

    alias_map[`fx-${effect_name.replaceAll("_", "-")}`] = effect_name;
    alias_map[`fx_${effect_name.replaceAll("-", "_")}`] = effect_name;
    alias_map[`text_fx_${effect_name.replaceAll("-", "_")}`] = effect_name;
  }

  return Object.freeze(alias_map);
})();

const text_fx_intensity_min = 0.2;
const text_fx_intensity_max = 3;

const escape_html = (raw_value) => {
  return String(raw_value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
};

const normalize_text_fx_name = (raw_name) => {
  if (typeof raw_name !== "string") {
    return null;
  }

  const normalized_name = raw_name.trim().toLowerCase();

  if (!normalized_name) {
    return null;
  }

  return text_fx_alias_map[normalized_name] ?? null;
};

const normalize_text_fx_intensity_value = (raw_value) => {
  if (typeof raw_value !== "string") {
    return null;
  }

  const parsed_value = Number.parseFloat(raw_value);

  if (!Number.isFinite(parsed_value)) {
    return null;
  }

  const clamped_value = Math.min(
    text_fx_intensity_max,
    Math.max(text_fx_intensity_min, parsed_value),
  );

  return String(clamped_value);
};

const build_text_fx_data_attributes = ({
  visual_intensity,
  motion_intensity,
}) => {
  const attribute_chunks = [];

  if (visual_intensity != null) {
    attribute_chunks.push(`data-text-fx-intensity="${visual_intensity}"`);
  }

  if (motion_intensity != null) {
    attribute_chunks.push(`data-text-fx-motion="${motion_intensity}"`);
  }

  return attribute_chunks.length ? ` ${attribute_chunks.join(" ")}` : "";
};

const build_text_fx_style_attribute = ({
  visual_intensity,
  motion_intensity,
}) => {
  const style_chunks = [];

  if (visual_intensity != null) {
    style_chunks.push(`--text_fx_marker_intensity:${visual_intensity}`);
  }

  if (motion_intensity != null) {
    style_chunks.push(`--text_fx_marker_motion:${motion_intensity}`);
  }

  if (!style_chunks.length) {
    return "";
  }

  return ` style="${style_chunks.join(";")}"`;
};

const build_block_fx_style_attribute = ({
  visual_intensity,
  motion_intensity,
}) => {
  const style_chunks = [];

  if (visual_intensity != null) {
    style_chunks.push(`--block_fx_marker_intensity:${visual_intensity}`);
  }

  if (motion_intensity != null) {
    style_chunks.push(`--block_fx_marker_motion:${motion_intensity}`);
  }

  if (!style_chunks.length) {
    return "";
  }

  return ` style="${style_chunks.join(";")}"`;
};

const build_text_fx_span_html = (effect_name, text_content, options = {}) => {
  const safe_effect_name = normalize_text_fx_name(effect_name);

  if (!safe_effect_name) {
    return null;
  }

  const data_attributes = build_text_fx_data_attributes(options);
  const style_attribute = build_text_fx_style_attribute(options);

  return `<span class="text_fx text_fx_${safe_effect_name}"${data_attributes}${style_attribute}>${escape_html(text_content)}</span>`;
};

const build_block_fx_open_html = (effect_name, options = {}) => {
  const safe_effect_name = normalize_text_fx_name(effect_name);

  if (
    !safe_effect_name ||
    !text_fx_block_effect_names.includes(safe_effect_name)
  ) {
    return null;
  }

  const data_attributes = build_text_fx_data_attributes(options);
  const style_attribute = build_block_fx_style_attribute(options);

  return `<div class="block_fx block_fx_${safe_effect_name}" data-text-fx="${safe_effect_name}"${data_attributes}${style_attribute}>`;
};

const marker_regex =
  /\{\{fx:([a-z0-9_-]+)(?::([0-9]+(?:\.[0-9]+)?|\.[0-9]+))?(?::([0-9]+(?:\.[0-9]+)?|\.[0-9]+))?\}\}([\s\S]*?)\{\{\/fx\}\}/gi;

const open_marker_only_regex =
  /^\s*\{\{fx:([a-z0-9_-]+)(?::([0-9]+(?:\.[0-9]+)?|\.[0-9]+))?(?::([0-9]+(?:\.[0-9]+)?|\.[0-9]+))?\}\}\s*$/i;
const close_marker_only_regex = /^\s*\{\{\/fx\}\}\s*$/i;

const parse_open_marker_only = (raw_text) => {
  if (typeof raw_text !== "string") {
    return null;
  }

  const match = raw_text.match(open_marker_only_regex);

  if (!match) {
    return null;
  }

  const [, raw_effect_name, raw_visual_intensity, raw_motion_intensity] = match;
  const effect_name = normalize_text_fx_name(raw_effect_name);

  if (!effect_name) {
    return null;
  }

  return {
    effect_name,
    visual_intensity: normalize_text_fx_intensity_value(raw_visual_intensity),
    motion_intensity: normalize_text_fx_intensity_value(raw_motion_intensity),
  };
};

const is_close_marker_only = (raw_text) => {
  if (typeof raw_text !== "string") {
    return false;
  }

  return close_marker_only_regex.test(raw_text);
};

const split_text_fx_markers = (raw_text = "") => {
  const source_text = String(raw_text);
  const output_nodes = [];
  let cursor = 0;

  marker_regex.lastIndex = 0;

  for (const match of source_text.matchAll(marker_regex)) {
    const [
      full_match,
      raw_effect_name,
      raw_visual_intensity,
      raw_motion_intensity,
      effect_inner_text,
    ] = match;
    const match_start = match.index ?? 0;

    if (cursor < match_start) {
      output_nodes.push({
        type: "text",
        value: source_text.slice(cursor, match_start),
      });
    }

    const effect_name = normalize_text_fx_name(raw_effect_name);

    if (!effect_name) {
      output_nodes.push({ type: "text", value: full_match });
      cursor = match_start + full_match.length;
      continue;
    }

    if (
      text_fx_block_effect_names.includes(effect_name) &&
      !text_fx_inline_block_effect_names.includes(effect_name)
    ) {
      output_nodes.push({ type: "text", value: full_match });
      cursor = match_start + full_match.length;
      continue;
    }

    output_nodes.push({
      type: "html",
      value: build_text_fx_span_html(effect_name, effect_inner_text, {
        visual_intensity:
          normalize_text_fx_intensity_value(raw_visual_intensity),
        motion_intensity:
          normalize_text_fx_intensity_value(raw_motion_intensity),
      }),
    });

    cursor = match_start + full_match.length;
  }

  if (cursor < source_text.length) {
    output_nodes.push({
      type: "text",
      value: source_text.slice(cursor),
    });
  }

  return output_nodes;
};

const marker_candidate_from_child = (child_node) => {
  if (child_node?.type === "text" && typeof child_node.value === "string") {
    return {
      text: child_node.value,
      source_kind: "text",
    };
  }

  if (
    child_node?.type === "paragraph" &&
    Array.isArray(child_node.children) &&
    child_node.children.length === 1 &&
    child_node.children[0]?.type === "text" &&
    typeof child_node.children[0]?.value === "string"
  ) {
    return {
      text: child_node.children[0].value,
      source_kind: "paragraph",
    };
  }

  return null;
};

const transform_text_fx_markers_in_tree = (tree_node) => {
  if (!tree_node || !Array.isArray(tree_node.children)) {
    return;
  }

  const next_children = [];

  for (
    let child_index = 0;
    child_index < tree_node.children.length;
    child_index += 1
  ) {
    const child_node = tree_node.children[child_index];
    const marker_candidate = marker_candidate_from_child(child_node);

    if (!marker_candidate) {
      next_children.push(child_node);
      continue;
    }

    const open_marker = parse_open_marker_only(marker_candidate.text);

    if (open_marker) {
      const is_block_effect = text_fx_block_effect_names.includes(
        open_marker.effect_name,
      );

      if (is_block_effect && marker_candidate.source_kind !== "paragraph") {
        next_children.push(child_node);
        continue;
      }

      let close_marker_index = -1;

      for (
        let scan_index = child_index + 1;
        scan_index < tree_node.children.length;
        scan_index += 1
      ) {
        const scan_node = tree_node.children[scan_index];
        const scan_candidate = marker_candidate_from_child(scan_node);

        if (scan_candidate && is_close_marker_only(scan_candidate.text)) {
          close_marker_index = scan_index;
          break;
        }
      }

      if (close_marker_index > child_index) {
        const opening_tag = is_block_effect
          ? build_block_fx_open_html(open_marker.effect_name, {
              visual_intensity: open_marker.visual_intensity,
              motion_intensity: open_marker.motion_intensity,
            })
          : build_text_fx_span_html(open_marker.effect_name, "", {
              visual_intensity: open_marker.visual_intensity,
              motion_intensity: open_marker.motion_intensity,
            });

        if (opening_tag) {
          const open_value = is_block_effect
            ? opening_tag
            : opening_tag.replace("></span>", ">");
          const close_value = is_block_effect ? "</div>" : "</span>";

          next_children.push({
            type: "html",
            value: open_value,
          });

          for (
            let carry_index = child_index + 1;
            carry_index < close_marker_index;
            carry_index += 1
          ) {
            next_children.push(tree_node.children[carry_index]);
          }

          next_children.push({ type: "html", value: close_value });
          child_index = close_marker_index;
          continue;
        }
      }
    }

    if (marker_candidate.source_kind !== "text") {
      next_children.push(child_node);
      continue;
    }

    const transformed_nodes = split_text_fx_markers(marker_candidate.text);

    if (transformed_nodes.length) {
      next_children.push(...transformed_nodes);
      continue;
    }

    next_children.push(child_node);
  }

  tree_node.children = next_children;

  for (const child_node of tree_node.children) {
    transform_text_fx_markers_in_tree(child_node);
  }
};

export {
  build_block_fx_open_html,
  build_text_fx_span_html,
  normalize_text_fx_name,
  split_text_fx_markers,
  text_fx_block_effect_names,
  text_fx_effect_names,
  transform_text_fx_markers_in_tree,
};

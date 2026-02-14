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
const text_fx_inline_block_effect_name_set = new Set(
  text_fx_inline_block_effect_names,
);

const text_fx_stack_blacklist_pairs = Object.freeze([
  Object.freeze(["rainbow", "gradient"]),
  Object.freeze(["shake", "float"]),
]);

const text_fx_effect_names_with_blocks = Object.freeze([
  ...text_fx_effect_names,
  ...text_fx_block_effect_names,
]);

const text_fx_effect_name_set = new Set(text_fx_effect_names);
const text_fx_block_effect_name_set = new Set(text_fx_block_effect_names);

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

const stack_intensity_regex_fragment = "([0-9]+(?:\\.[0-9]+)?|\\.[0-9]+)";
const marker_descriptor_regex = new RegExp(
  `^([a-z0-9_|-]+)(?::${stack_intensity_regex_fragment})?(?::${stack_intensity_regex_fragment})?$`,
  "i",
);

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

const build_blacklist_lookup = () => {
  const lookup = new Map();

  for (const pair of text_fx_stack_blacklist_pairs) {
    const [left_effect, right_effect] = pair;

    if (!lookup.has(left_effect)) {
      lookup.set(left_effect, new Set());
    }

    if (!lookup.has(right_effect)) {
      lookup.set(right_effect, new Set());
    }

    lookup.get(left_effect).add(right_effect);
    lookup.get(right_effect).add(left_effect);
  }

  return lookup;
};

const text_fx_stack_blacklist_lookup = build_blacklist_lookup();

const normalize_effect_stack_for_output = (effect_names) => {
  if (!Array.isArray(effect_names) || !effect_names.length) {
    return [];
  }

  if (!effect_names.includes("combat_feed")) {
    return effect_names;
  }

  return [
    "combat_feed",
    ...effect_names.filter((effect_name) => effect_name !== "combat_feed"),
  ];
};

const parse_marker_effect_descriptor = (raw_descriptor) => {
  if (typeof raw_descriptor !== "string") {
    return null;
  }

  const descriptor_match = raw_descriptor
    .trim()
    .toLowerCase()
    .match(marker_descriptor_regex);

  if (!descriptor_match) {
    return null;
  }

  const [, raw_effect_tokens, raw_visual_intensity, raw_motion_intensity] =
    descriptor_match;
  const effect_tokens = raw_effect_tokens
    .split("|")
    .map((token) => token.trim())
    .filter(Boolean);
  const warning_reasons = [];
  const accepted_effect_names = [];
  const seen_effect_names = new Set();

  for (const effect_token of effect_tokens) {
    const effect_name = normalize_text_fx_name(effect_token);

    if (!effect_name) {
      warning_reasons.push(`unknown token '${effect_token}'`);
      continue;
    }

    if (seen_effect_names.has(effect_name)) {
      warning_reasons.push(`duplicate token '${effect_name}'`);
      continue;
    }

    if (
      effect_tokens.length > 1 &&
      text_fx_block_effect_name_set.has(effect_name)
    ) {
      if (text_fx_inline_block_effect_name_set.has(effect_name)) {
        accepted_effect_names.push(effect_name);
        seen_effect_names.add(effect_name);
        continue;
      }

      warning_reasons.push(
        `block token '${effect_name}' is not allowed in stacks`,
      );
      continue;
    }

    let blocked_by = null;

    for (const accepted_effect_name of accepted_effect_names) {
      if (
        text_fx_stack_blacklist_lookup
          .get(accepted_effect_name)
          ?.has(effect_name)
      ) {
        blocked_by = accepted_effect_name;
        break;
      }
    }

    if (blocked_by) {
      warning_reasons.push(
        `token '${effect_name}' dropped because '${blocked_by}+${effect_name}' is blacklisted`,
      );
      continue;
    }

    accepted_effect_names.push(effect_name);
    seen_effect_names.add(effect_name);
  }

  if (!accepted_effect_names.length) {
    return null;
  }

  return {
    effect_names: normalize_effect_stack_for_output(accepted_effect_names),
    visual_intensity: normalize_text_fx_intensity_value(raw_visual_intensity),
    motion_intensity: normalize_text_fx_intensity_value(raw_motion_intensity),
    warning_reasons,
    raw_descriptor,
  };
};

const emit_sanitization_warning = (
  warning_reasons,
  raw_descriptor,
  effect_names,
  warn,
  warning_cache,
) => {
  if (!warning_reasons.length || typeof warn !== "function") {
    return;
  }

  const cache_key = `${raw_descriptor}|${warning_reasons.join("|")}`;

  if (warning_cache?.has(cache_key)) {
    return;
  }

  warning_cache?.add(cache_key);
  warn(
    `[text_fx] auto-sanitized marker '${raw_descriptor}' -> '${effect_names.join("|")}' (${warning_reasons.join("; ")})`,
  );
};

const is_inline_stack_effect = (effect_name) => {
  return (
    text_fx_effect_name_set.has(effect_name) ||
    text_fx_inline_block_effect_name_set.has(effect_name)
  );
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

const build_text_fx_span_html = (
  effect_name_or_names,
  text_content,
  options = {},
) => {
  const raw_effect_names = Array.isArray(effect_name_or_names)
    ? effect_name_or_names
    : [effect_name_or_names];
  const safe_effect_names = raw_effect_names
    .map((raw_effect_name) => normalize_text_fx_name(raw_effect_name))
    .filter(Boolean);

  if (!safe_effect_names.length) {
    return null;
  }

  const data_attributes = build_text_fx_data_attributes(options);
  const style_attribute = build_text_fx_style_attribute(options);

  const fx_classes = safe_effect_names
    .map((safe_effect_name) => `text_fx_${safe_effect_name}`)
    .join(" ");

  return `<span class="text_fx ${fx_classes}"${data_attributes}${style_attribute}>${escape_html(text_content)}</span>`;
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

const marker_regex = /\{\{fx:([^}]+)\}\}([\s\S]*?)\{\{\/fx\}\}/gi;

const open_marker_only_regex = /^\s*\{\{fx:([^}]+)\}\}\s*$/i;
const close_marker_only_regex = /^\s*\{\{\/fx\}\}\s*$/i;

const parse_open_marker_only = (raw_text) => {
  if (typeof raw_text !== "string") {
    return null;
  }

  const match = raw_text.match(open_marker_only_regex);

  if (!match) {
    return null;
  }

  return parse_marker_effect_descriptor(match[1]);
};

const is_close_marker_only = (raw_text) => {
  if (typeof raw_text !== "string") {
    return false;
  }

  return close_marker_only_regex.test(raw_text);
};

const split_text_fx_markers = (raw_text = "", options = {}) => {
  const source_text = String(raw_text);
  const output_nodes = [];
  let cursor = 0;
  const warning_cache = options.warning_cache;

  marker_regex.lastIndex = 0;

  for (const match of source_text.matchAll(marker_regex)) {
    const [full_match, raw_descriptor, effect_inner_text] = match;
    const match_start = match.index ?? 0;

    if (cursor < match_start) {
      output_nodes.push({
        type: "text",
        value: source_text.slice(cursor, match_start),
      });
    }

    const descriptor = parse_marker_effect_descriptor(raw_descriptor);

    if (!descriptor) {
      output_nodes.push({ type: "text", value: full_match });
      cursor = match_start + full_match.length;
      continue;
    }

    const [first_effect_name] = descriptor.effect_names;
    const is_single_effect = descriptor.effect_names.length === 1;

    if (
      is_single_effect &&
      text_fx_block_effect_names.includes(first_effect_name) &&
      !text_fx_inline_block_effect_names.includes(first_effect_name)
    ) {
      output_nodes.push({ type: "text", value: full_match });
      cursor = match_start + full_match.length;
      continue;
    }

    if (
      !descriptor.effect_names.every((effect_name) =>
        is_inline_stack_effect(effect_name),
      )
    ) {
      output_nodes.push({ type: "text", value: full_match });
      cursor = match_start + full_match.length;
      continue;
    }

    emit_sanitization_warning(
      descriptor.warning_reasons,
      descriptor.raw_descriptor,
      descriptor.effect_names,
      options.warn,
      warning_cache,
    );

    output_nodes.push({
      type: "html",
      value: build_text_fx_span_html(
        descriptor.effect_names,
        effect_inner_text,
        {
          visual_intensity: descriptor.visual_intensity,
          motion_intensity: descriptor.motion_intensity,
        },
      ),
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

const transform_text_fx_markers_in_tree = (tree_node, options = {}) => {
  if (!tree_node || !Array.isArray(tree_node.children)) {
    return;
  }

  const warning_cache =
    options.warning_cache instanceof Set ? options.warning_cache : new Set();
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
      emit_sanitization_warning(
        open_marker.warning_reasons,
        open_marker.raw_descriptor,
        open_marker.effect_names,
        options.warn,
        warning_cache,
      );

      const [first_effect_name] = open_marker.effect_names;
      const is_single_effect = open_marker.effect_names.length === 1;
      const is_block_effect =
        is_single_effect &&
        text_fx_block_effect_names.includes(first_effect_name);

      if (is_block_effect && marker_candidate.source_kind !== "paragraph") {
        next_children.push(child_node);
        continue;
      }

      if (
        !is_block_effect &&
        !open_marker.effect_names.every((effect_name) =>
          is_inline_stack_effect(effect_name),
        )
      ) {
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
          ? build_block_fx_open_html(first_effect_name, {
              visual_intensity: open_marker.visual_intensity,
              motion_intensity: open_marker.motion_intensity,
            })
          : build_text_fx_span_html(open_marker.effect_names, "", {
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

    const transformed_nodes = split_text_fx_markers(marker_candidate.text, {
      warn: options.warn,
      warning_cache,
    });

    if (transformed_nodes.length) {
      next_children.push(...transformed_nodes);
      continue;
    }

    next_children.push(child_node);
  }

  tree_node.children = next_children;

  for (const child_node of tree_node.children) {
    transform_text_fx_markers_in_tree(child_node, {
      ...options,
      warning_cache,
    });
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

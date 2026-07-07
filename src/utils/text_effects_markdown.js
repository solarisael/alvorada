import {
  TEXT_FX_BLOCK_BASE_CLASS,
  TEXT_FX_BLOCK_EFFECT_NAMES,
  TEXT_FX_EFFECT_NAMES,
  TEXT_FX_INLINE_BLOCK_EFFECT_NAMES,
  TEXT_FX_INTENSITY_MAX,
  TEXT_FX_INTENSITY_MIN,
  TEXT_FX_STACK_BLACKLIST_PAIRS,
  TEXT_FX_TEXT_BASE_CLASS,
  TEXT_FX_TEXT_EFFECT_NAMES,
  normalize_text_fx_name,
  text_fx_block_class_for,
  text_fx_text_class_for,
} from "../../public/vendor/fx/js/contract.js";
import { escape_html, marker_candidate_from_child } from "./marker_tree_utils.js";

const text_fx_effect_names = TEXT_FX_TEXT_EFFECT_NAMES;
const text_fx_block_effect_names = TEXT_FX_BLOCK_EFFECT_NAMES;
const text_fx_inline_block_effect_names = TEXT_FX_INLINE_BLOCK_EFFECT_NAMES;
const text_fx_inline_block_effect_name_set = new Set(
  text_fx_inline_block_effect_names,
);

const text_fx_effect_name_set = new Set(text_fx_effect_names);
const text_fx_block_effect_name_set = new Set(text_fx_block_effect_names);
const text_fx_stack_blacklist_pairs = TEXT_FX_STACK_BLACKLIST_PAIRS;
const text_fx_intensity_min = TEXT_FX_INTENSITY_MIN;
const text_fx_intensity_max = TEXT_FX_INTENSITY_MAX;

const stack_intensity_regex_fragment = "([0-9]+(?:\\.[0-9]+)?|\\.[0-9]+)";
const marker_descriptor_regex = new RegExp(
  `^([^:]+)(?::${stack_intensity_regex_fragment})?(?::${stack_intensity_regex_fragment})?$`,
  "i",
);
const marker_effect_token_regex = new RegExp(
  `^([a-z0-9_-]+)(?:=${stack_intensity_regex_fragment}(?:/${stack_intensity_regex_fragment})?)?$`,
  "i",
);


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

const text_fx_effect_attribute_name = (effect_name, channel_name) => {
  const dashed_effect_name = effect_name.replaceAll("_", "-");

  return `data-text-fx-${dashed_effect_name}-${channel_name}`;
};

const text_fx_effect_style_property_name = (effect_name, channel_name) => {
  return `--text_fx_${effect_name}_${channel_name}`;
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

const parse_marker_effect_token = (raw_effect_token) => {
  const token_match = raw_effect_token.match(marker_effect_token_regex);

  if (!token_match) {
    return null;
  }

  const [, raw_effect_name, raw_visual_intensity, raw_motion_intensity] =
    token_match;
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
  const effect_settings = {};
  const seen_effect_names = new Set();

  for (const effect_token of effect_tokens) {
    const parsed_effect_token = parse_marker_effect_token(effect_token);

    if (!parsed_effect_token) {
      warning_reasons.push(`invalid token '${effect_token}'`);
      continue;
    }

    const { effect_name, visual_intensity, motion_intensity } =
      parsed_effect_token;

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

        if (visual_intensity != null || motion_intensity != null) {
          effect_settings[effect_name] = {
            visual_intensity,
            motion_intensity,
          };
        }

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

    if (visual_intensity != null || motion_intensity != null) {
      effect_settings[effect_name] = {
        visual_intensity,
        motion_intensity,
      };
    }
  }

  if (!accepted_effect_names.length) {
    return null;
  }

  return {
    effect_names: normalize_effect_stack_for_output(accepted_effect_names),
    effect_settings,
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
    `[sol__text_fx] auto-sanitized marker '${raw_descriptor}' -> '${effect_names.join("|")}' (${warning_reasons.join("; ")})`,
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
  effect_settings = {},
}) => {
  const attribute_chunks = [];

  if (visual_intensity != null) {
    attribute_chunks.push(`data-text-fx-intensity="${visual_intensity}"`);
  }

  if (motion_intensity != null) {
    attribute_chunks.push(`data-text-fx-motion="${motion_intensity}"`);
  }

  for (const [effect_name, effect_setting] of Object.entries(effect_settings)) {
    if (effect_setting.visual_intensity != null) {
      attribute_chunks.push(
        `${text_fx_effect_attribute_name(effect_name, "intensity")}="${effect_setting.visual_intensity}"`,
      );
    }

    if (effect_setting.motion_intensity != null) {
      attribute_chunks.push(
        `${text_fx_effect_attribute_name(effect_name, "motion")}="${effect_setting.motion_intensity}"`,
      );
    }
  }

  return attribute_chunks.length ? ` ${attribute_chunks.join(" ")}` : "";
};

const build_text_fx_style_attribute = ({
  visual_intensity,
  motion_intensity,
  effect_settings = {},
}) => {
  const style_chunks = [];

  if (visual_intensity != null) {
    style_chunks.push(`--text_fx_marker_intensity:${visual_intensity}`);
  }

  if (motion_intensity != null) {
    style_chunks.push(`--text_fx_marker_motion:${motion_intensity}`);
  }

  for (const [effect_name, effect_setting] of Object.entries(effect_settings)) {
    if (effect_setting.visual_intensity != null) {
      style_chunks.push(
        `${text_fx_effect_style_property_name(effect_name, "intensity")}:${effect_setting.visual_intensity}`,
      );
    }

    if (effect_setting.motion_intensity != null) {
      style_chunks.push(
        `${text_fx_effect_style_property_name(effect_name, "motion")}:${effect_setting.motion_intensity}`,
      );
    }
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
    .map((safe_effect_name) => text_fx_text_class_for(safe_effect_name))
    .join(" ");

  return `<span class="${TEXT_FX_TEXT_BASE_CLASS} ${fx_classes}"${data_attributes}${style_attribute}>${escape_html(text_content)}</span>`;
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

  return `<div class="${TEXT_FX_BLOCK_BASE_CLASS} ${text_fx_block_class_for(safe_effect_name)}" data-text-fx="${safe_effect_name}"${data_attributes}${style_attribute}>`;
};

const marker_boundary_regex = /\{\{fx:([^}]+)\}\}|\{\{\/fx\}\}/gi;

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

const find_next_text_fx_open_marker = (source_text, start_index = 0) => {
  marker_boundary_regex.lastIndex = start_index;

  for (const match of source_text.matchAll(marker_boundary_regex)) {
    if (match[1] !== undefined) {
      return {
        index: match.index ?? 0,
        end_index: (match.index ?? 0) + match[0].length,
        raw_descriptor: match[1],
      };
    }
  }

  return null;
};

const find_matching_text_fx_close_marker = (source_text, start_index = 0) => {
  let depth = 1;
  marker_boundary_regex.lastIndex = start_index;

  for (const match of source_text.matchAll(marker_boundary_regex)) {
    if (match[1] !== undefined) {
      depth += 1;
      continue;
    }

    depth -= 1;

    if (depth === 0) {
      return {
        index: match.index ?? 0,
        end_index: (match.index ?? 0) + match[0].length,
      };
    }
  }

  return null;
};

const text_fx_nodes_to_html = (nodes = []) => {
  return nodes
    .map((node) => {
      if (node.type === "html") {
        return node.value;
      }

      return escape_html(node.value ?? "");
    })
    .join("");
};

const build_text_fx_span_html_from_nodes = (
  descriptor,
  inner_nodes,
) => {
  const opening_html = build_text_fx_span_html(descriptor.effect_names, "", {
    visual_intensity: descriptor.visual_intensity,
    motion_intensity: descriptor.motion_intensity,
    effect_settings: descriptor.effect_settings,
  });

  if (!opening_html) {
    return null;
  }

  return `${opening_html.replace("></span>", ">")}${text_fx_nodes_to_html(
    inner_nodes,
  )}</span>`;
};

const split_text_fx_markers = (raw_text = "", options = {}) => {
  const source_text = String(raw_text);
  const output_nodes = [];
  let cursor = 0;
  const warning_cache = options.warning_cache;

  while (cursor < source_text.length) {
    const open_marker = find_next_text_fx_open_marker(source_text, cursor);

    if (!open_marker) {
      output_nodes.push({
        type: "text",
        value: source_text.slice(cursor),
      });
      break;
    }

    if (cursor < open_marker.index) {
      output_nodes.push({
        type: "text",
        value: source_text.slice(cursor, open_marker.index),
      });
    }

    const close_marker = find_matching_text_fx_close_marker(
      source_text,
      open_marker.end_index,
    );

    if (!close_marker) {
      output_nodes.push({
        type: "text",
        value: source_text.slice(open_marker.index),
      });
      break;
    }

    const full_match = source_text.slice(
      open_marker.index,
      close_marker.end_index,
    );
    const effect_inner_text = source_text.slice(
      open_marker.end_index,
      close_marker.index,
    );
    const descriptor = parse_marker_effect_descriptor(open_marker.raw_descriptor);

    if (!descriptor) {
      output_nodes.push({ type: "text", value: full_match });
      cursor = close_marker.end_index;
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
      cursor = close_marker.end_index;
      continue;
    }

    if (
      !descriptor.effect_names.every((effect_name) =>
        is_inline_stack_effect(effect_name),
      )
    ) {
      output_nodes.push({ type: "text", value: full_match });
      cursor = close_marker.end_index;
      continue;
    }

    emit_sanitization_warning(
      descriptor.warning_reasons,
      descriptor.raw_descriptor,
      descriptor.effect_names,
      options.warn,
      warning_cache,
    );

    const inner_nodes = split_text_fx_markers(effect_inner_text, {
      ...options,
      warning_cache,
    });
    const html_value = build_text_fx_span_html_from_nodes(
      descriptor,
      inner_nodes,
    );

    output_nodes.push({
      type: "html",
      value: html_value ?? full_match,
    });

    cursor = close_marker.end_index;
  }

  return output_nodes;
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
              effect_settings: open_marker.effect_settings,
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

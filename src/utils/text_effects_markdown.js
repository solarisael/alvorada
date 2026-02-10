const text_fx_effect_names = Object.freeze([
  "glow",
  "neon",
  "shadow",
  "chroma",
  "blur",
  "flicker",
  "rainbow",
  "gradient",
  "wiggle",
  "float",
  "shake",
  "glitch",
]);

const text_fx_alias_map = (() => {
  const alias_map = {};

  for (const effect_name of text_fx_effect_names) {
    alias_map[effect_name] = effect_name;
    alias_map[`fx-${effect_name}`] = effect_name;
    alias_map[`fx_${effect_name}`] = effect_name;
    alias_map[`text_fx_${effect_name}`] = effect_name;
  }

  return Object.freeze(alias_map);
})();

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

const build_text_fx_span_html = (effect_name, text_content) => {
  const safe_effect_name = normalize_text_fx_name(effect_name);

  if (!safe_effect_name) {
    return null;
  }

  return `<span class="text_fx text_fx_${safe_effect_name}">${escape_html(text_content)}</span>`;
};

const marker_regex = /\{\{fx:([a-z0-9_-]+)\}\}([\s\S]*?)\{\{\/fx\}\}/gi;

const split_text_fx_markers = (raw_text = "") => {
  const source_text = String(raw_text);
  const output_nodes = [];
  let cursor = 0;

  marker_regex.lastIndex = 0;

  for (const match of source_text.matchAll(marker_regex)) {
    const [full_match, raw_effect_name, effect_inner_text] = match;
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

    output_nodes.push({
      type: "html",
      value: `<span class="text_fx text_fx_${effect_name}">${escape_html(effect_inner_text)}</span>`,
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

const transform_text_fx_markers_in_tree = (tree_node) => {
  if (!tree_node || !Array.isArray(tree_node.children)) {
    return;
  }

  const next_children = [];

  for (const child_node of tree_node.children) {
    if (child_node?.type === "text" && typeof child_node.value === "string") {
      const transformed_nodes = split_text_fx_markers(child_node.value);

      if (transformed_nodes.length) {
        next_children.push(...transformed_nodes);
        continue;
      }
    }

    next_children.push(child_node);
  }

  tree_node.children = next_children;

  for (const child_node of tree_node.children) {
    transform_text_fx_markers_in_tree(child_node);
  }
};

export {
  build_text_fx_span_html,
  normalize_text_fx_name,
  split_text_fx_markers,
  text_fx_effect_names,
  transform_text_fx_markers_in_tree,
};

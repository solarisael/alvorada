import {
  TEXT_FX_BLOCK_BASE_CLASS,
  TEXT_FX_EFFECT_CLASS_MAP,
  TEXT_FX_INTENSITY_MAX,
  TEXT_FX_INTENSITY_MIN,
  TEXT_FX_STACK_BLACKLIST_PAIRS,
  TEXT_FX_TEXT_BASE_CLASS,
  normalize_text_fx_name,
  text_fx_block_class_for,
  text_fx_is_inline_block_effect,
  text_fx_is_text_effect,
  text_fx_text_class_for,
} from "./text_effects_contract.js";

const window_any = /** @type {any} */ (globalThis);

const text_fx_effect_class_map = TEXT_FX_EFFECT_CLASS_MAP;

const combat_token_class_by_name = Object.freeze({
  crit: "sol__combat_token_crit",
  miss: "sol__combat_token_miss",
  buff: "sol__combat_token_buff",
  debuff: "sol__combat_token_debuff",
  block: "sol__combat_token_block",
  dodge: "sol__combat_token_dodge",
  immune: "sol__combat_token_immune",
  resist: "sol__combat_token_resist",
  mega_crit: "sol__combat_token_mega_crit",
  overkill: "sol__combat_token_overkill",
  true_damage: "sol__combat_token_true_damage",
  guard_break: "sol__combat_token_guard_break",
  execute: "sol__combat_token_execute",
});

const combat_token_regex =
  /\[(MEGA_CRIT|TRUE_DAMAGE|GUARD_BREAK|OVERKILL|EXECUTE|CRIT|MISS|BUFF|DEBUFF|BLOCK|DODGE|IMMUNE|RESIST)\]|\b(MEGA_CRIT|TRUE_DAMAGE|GUARD_BREAK|OVERKILL|EXECUTE|CRIT|MISS|BUFF|DEBUFF|BLOCK|DODGE|IMMUNE|RESIST)\b/gi;

const parse_combat_token_segments = (text_value) => {
  const raw_text = String(text_value);
  const segments = [];
  let cursor = 0;

  combat_token_regex.lastIndex = 0;

  for (const token_match of raw_text.matchAll(combat_token_regex)) {
    const full_match = token_match[0];
    const bracketed_match = token_match[1] ?? null;
    const bare_match = token_match[2] ?? null;
    const token_value = bracketed_match ?? bare_match ?? full_match;
    const token_start = token_match.index ?? 0;
    const token_end = token_start + full_match.length;

    if (cursor < token_start) {
      segments.push({
        type: "text",
        value: raw_text.slice(cursor, token_start),
      });
    }

    const token_name = token_value.toLowerCase();
    const token_class = combat_token_class_by_name[token_name] ?? null;

    if (token_class) {
      const token_segment = {
        type: "token",
        value: token_value,
        token_class,
      };

      if (bracketed_match) {
        token_segment.bracketed = true;
      }

      segments.push({
        ...token_segment,
      });
    } else {
      segments.push({ type: "text", value: full_match });
    }

    cursor = token_end;
  }

  if (cursor < raw_text.length) {
    segments.push({ type: "text", value: raw_text.slice(cursor) });
  }

  return segments;
};

const text_fx_intensity_min = TEXT_FX_INTENSITY_MIN;
const text_fx_intensity_max = TEXT_FX_INTENSITY_MAX;
const text_fx_stack_blacklist_pairs = TEXT_FX_STACK_BLACKLIST_PAIRS;

const build_blacklist_lookup = () => {
  const blacklist_lookup = new Map();

  for (const pair of text_fx_stack_blacklist_pairs) {
    const [left_effect, right_effect] = pair;

    if (!blacklist_lookup.has(left_effect)) {
      blacklist_lookup.set(left_effect, new Set());
    }

    if (!blacklist_lookup.has(right_effect)) {
      blacklist_lookup.set(right_effect, new Set());
    }

    blacklist_lookup.get(left_effect).add(right_effect);
    blacklist_lookup.get(right_effect).add(left_effect);
  }

  return blacklist_lookup;
};

const text_fx_stack_blacklist_lookup = build_blacklist_lookup();

const normalize_text_fx_token = (raw_token) => {
  return normalize_text_fx_name(raw_token);
};

const resolve_text_fx_class = (raw_token) => {
  const normalized_effect = normalize_text_fx_token(raw_token);

  if (!normalized_effect) {
    return null;
  }

  return text_fx_effect_class_map[normalized_effect] ?? null;
};

const resolve_text_fx_effects_with_stack_rules = (raw_tokens) => {
  const accepted_effects = [];
  const seen_effects = new Set();

  for (const raw_token of raw_tokens) {
    const normalized_effect = normalize_text_fx_token(raw_token);

    if (!normalized_effect || seen_effects.has(normalized_effect)) {
      continue;
    }

    let is_blocked = false;

    if (text_fx_is_text_effect(normalized_effect)) {
      for (const accepted_effect of accepted_effects) {
        if (
          text_fx_stack_blacklist_lookup
            .get(accepted_effect)
            ?.has(normalized_effect)
        ) {
          is_blocked = true;
          break;
        }
      }
    }

    if (is_blocked) {
      continue;
    }

    accepted_effects.push(normalized_effect);
    seen_effects.add(normalized_effect);
  }

  if (!accepted_effects.includes("combat_feed")) {
    return accepted_effects;
  }

  return [
    "combat_feed",
    ...accepted_effects.filter((effect_name) => effect_name !== "combat_feed"),
  ];
};

const split_text_fx_tokens = (token_string = "") => {
  return token_string
    .split(/[\s,|]+/)
    .map((token) => token.trim())
    .filter(Boolean);
};

const resolve_text_fx_class_for_node = (effect_name, node_value) => {
  if (
    text_fx_is_text_effect(effect_name) ||
    (text_fx_is_inline_block_effect(effect_name) &&
      node_value.classList.contains(TEXT_FX_TEXT_BASE_CLASS))
  ) {
    return text_fx_text_class_for(effect_name);
  }

  return text_fx_block_class_for(effect_name);
};

const parse_text_fx_intensity_value = (raw_value) => {
  if (raw_value == null) {
    return null;
  }

  const parsed_value = Number.parseFloat(String(raw_value));

  if (!Number.isFinite(parsed_value)) {
    return null;
  }

  return Math.min(
    text_fx_intensity_max,
    Math.max(text_fx_intensity_min, parsed_value),
  );
};

const text_fx_effect_attribute_name = (effect_name, channel_name) => {
  const dashed_effect_name = effect_name.replaceAll("_", "-");

  return `data-text-fx-${dashed_effect_name}-${channel_name}`;
};

const text_fx_effect_var_name = (effect_name, channel_name) => {
  return `--text_fx_${effect_name}_${channel_name}`;
};

const collect_text_fx_effects_from_node = (node_value) => {
  if (!(node_value instanceof HTMLElement)) {
    return [];
  }

  const class_tokens = Array.from(node_value.classList);
  const data_tokens = split_text_fx_tokens(node_value.dataset.textFx ?? "");

  return resolve_text_fx_effects_with_stack_rules([
    ...class_tokens,
    ...data_tokens,
  ]);
};

const apply_text_fx_effect_vars = (node_value, effect_names) => {
  for (const effect_name of effect_names) {
    const visual_intensity = parse_text_fx_intensity_value(
      node_value.getAttribute(
        text_fx_effect_attribute_name(effect_name, "intensity"),
      ),
    );
    const motion_intensity = parse_text_fx_intensity_value(
      node_value.getAttribute(text_fx_effect_attribute_name(effect_name, "motion")),
    );
    const visual_var_name = text_fx_effect_var_name(effect_name, "intensity");
    const motion_var_name = text_fx_effect_var_name(effect_name, "motion");

    if (visual_intensity == null) {
      node_value.style.removeProperty(visual_var_name);
    } else {
      node_value.style.setProperty(visual_var_name, String(visual_intensity));
    }

    if (motion_intensity == null) {
      node_value.style.removeProperty(motion_var_name);
    } else {
      node_value.style.setProperty(motion_var_name, String(motion_intensity));
    }
  }
};

const apply_text_fx_intensity_vars = (
  node_value,
  effect_names = collect_text_fx_effects_from_node(node_value),
) => {
  if (!(node_value instanceof HTMLElement)) {
    return;
  }

  const visual_intensity = parse_text_fx_intensity_value(
    node_value.dataset.textFxIntensity,
  );
  const motion_intensity = parse_text_fx_intensity_value(
    node_value.dataset.textFxMotion,
  );

  if (visual_intensity == null) {
    node_value.style.removeProperty("--text_fx_marker_intensity");
    node_value.style.removeProperty("--block_fx_marker_intensity");
  } else {
    node_value.style.setProperty(
      "--text_fx_marker_intensity",
      String(visual_intensity),
    );
    node_value.style.setProperty(
      "--block_fx_marker_intensity",
      String(visual_intensity),
    );
  }

  if (motion_intensity == null) {
    node_value.style.removeProperty("--text_fx_marker_motion");
    node_value.style.removeProperty("--block_fx_marker_motion");
  } else {
    node_value.style.setProperty(
      "--text_fx_marker_motion",
      String(motion_intensity),
    );
    node_value.style.setProperty(
      "--block_fx_marker_motion",
      String(motion_intensity),
    );
  }

  apply_text_fx_effect_vars(node_value, effect_names);
};

const collect_text_fx_classes_from_node = (node_value, resolved_effects = null) => {
  if (!(node_value instanceof HTMLElement)) {
    return [];
  }

  const effect_names =
    resolved_effects ?? collect_text_fx_effects_from_node(node_value);
  const classes_to_apply = new Set();

  for (const effect_name of effect_names) {
    const resolved_class = resolve_text_fx_class_for_node(
      effect_name,
      node_value,
    );

    if (resolved_class) {
      classes_to_apply.add(resolved_class);
    }
  }

  return Array.from(classes_to_apply);
};

const apply_text_fx_classes = (node_value) => {
  if (!(node_value instanceof HTMLElement)) {
    return [];
  }

  const resolved_effects = collect_text_fx_effects_from_node(node_value);
  const effect_classes = collect_text_fx_classes_from_node(
    node_value,
    resolved_effects,
  );

  if (!effect_classes.length) {
    return [];
  }

  const has_text_effect = effect_classes.some((class_name) =>
    class_name.startsWith(`${TEXT_FX_TEXT_BASE_CLASS}_`),
  );
  const has_block_effect = effect_classes.some((class_name) =>
    class_name.startsWith(`${TEXT_FX_BLOCK_BASE_CLASS}_`),
  );

  if (has_text_effect) {
    node_value.classList.add(TEXT_FX_TEXT_BASE_CLASS);
  }

  if (has_block_effect) {
    node_value.classList.add(TEXT_FX_BLOCK_BASE_CLASS);
  }

  for (const class_name of effect_classes) {
    node_value.classList.add(class_name);
  }

  apply_text_fx_intensity_vars(node_value, resolved_effects);

  node_value.dataset.textFxHydrated = "true";

  return effect_classes;
};

const find_text_fx_nodes = (root_node = document) => {
  if (!root_node || typeof root_node.querySelectorAll !== "function") {
    return [];
  }

  return Array.from(
    root_node.querySelectorAll(
      "[data-text-fx], [class*='fx-'], [class*='sol__text_fx'], [class*='sol__block_fx']",
    ),
  );
};

const hydrate_text_effects = (root_node = document) => {
  const text_fx_nodes = find_text_fx_nodes(root_node);

  for (const text_fx_node of text_fx_nodes) {
    apply_text_fx_classes(text_fx_node);
  }

  hydrate_combat_tokens(root_node);
};

const build_combat_token_fragment = (text_value) => {
  const segments = parse_combat_token_segments(text_value);
  const has_tokens = segments.some(
    (segment_value) => segment_value.type === "token",
  );

  if (!has_tokens || typeof document === "undefined") {
    return null;
  }

  const fragment = document.createDocumentFragment();

  segments.forEach((segment_value) => {
    if (segment_value.type === "text") {
      fragment.append(segment_value.value);
      return;
    }

    const token_span = document.createElement("span");
    token_span.className = `sol__combat_token ${segment_value.token_class}`;

    if (segment_value.bracketed) {
      token_span.classList.add("sol__combat_token_bracketed");

      const open_bracket_span = document.createElement("span");
      open_bracket_span.className = "sol__combat_token_bracket";
      open_bracket_span.textContent = "[";

      const label_span = document.createElement("span");
      label_span.className = "sol__combat_token_label";
      label_span.textContent = segment_value.value;

      const close_bracket_span = document.createElement("span");
      close_bracket_span.className = "sol__combat_token_bracket";
      close_bracket_span.textContent = "]";

      token_span.append(open_bracket_span, label_span, close_bracket_span);
      fragment.append(token_span);
      return;
    }

    token_span.textContent = segment_value.value;
    fragment.append(token_span);
  });

  return fragment;
};

const hydrate_combat_tokens = (root_node = document) => {
  if (!root_node || typeof root_node.querySelectorAll !== "function") {
    return;
  }

  const combat_roots = root_node.querySelectorAll(
    ".sol__block_fx_combat_feed, .sol__text_fx_combat_feed",
  );

  combat_roots.forEach((combat_root) => {
    if (!(combat_root instanceof HTMLElement)) {
      return;
    }

    if (combat_root.dataset.combatTokensHydrated === "true") {
      return;
    }

    const text_walker = document.createTreeWalker(
      combat_root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node_value) => {
          const parent_node = node_value.parentElement;

          if (!parent_node) {
            return NodeFilter.FILTER_REJECT;
          }

          if (
            parent_node.closest(".sol__combat_token") ||
            parent_node.closest("script, style")
          ) {
            return NodeFilter.FILTER_REJECT;
          }

          if (!node_value.textContent || !node_value.textContent.trim()) {
            return NodeFilter.FILTER_REJECT;
          }

          return NodeFilter.FILTER_ACCEPT;
        },
      },
    );

    const candidate_text_nodes = [];

    while (text_walker.nextNode()) {
      candidate_text_nodes.push(text_walker.currentNode);
    }

    candidate_text_nodes.forEach((text_node) => {
      const replacement_fragment = build_combat_token_fragment(
        text_node.textContent ?? "",
      );

      if (!replacement_fragment) {
        return;
      }

      text_node.replaceWith(replacement_fragment);
    });

    combat_root.dataset.combatTokensHydrated = "true";
  });
};

if (
  typeof window !== "undefined" &&
  typeof document !== "undefined" &&
  !window_any.__text_fx_dom_ready_bound
) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => hydrate_text_effects());
  } else {
    hydrate_text_effects();
  }

  window_any.__text_fx_dom_ready_bound = true;
}

if (
  typeof window !== "undefined" &&
  typeof document !== "undefined" &&
  !window_any.__text_fx_after_swap_bound
) {
  document.body?.addEventListener("htmx:afterSwap", (event) => {
    const swap_target = event?.detail?.target;

    if (swap_target instanceof HTMLElement) {
      hydrate_text_effects(swap_target);
      return;
    }

    hydrate_text_effects();
  });

  window_any.__text_fx_after_swap_bound = true;
}

export {
  apply_text_fx_classes,
  apply_text_fx_intensity_vars,
  build_combat_token_fragment,
  collect_text_fx_classes_from_node,
  hydrate_combat_tokens,
  hydrate_text_effects,
  normalize_text_fx_token,
  parse_combat_token_segments,
  parse_text_fx_intensity_value,
  resolve_text_fx_class,
  split_text_fx_tokens,
  text_fx_effect_class_map,
};

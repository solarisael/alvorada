const window_any = /** @type {any} */ (globalThis);

const text_fx_effect_class_map = Object.freeze({
  glow: "text_fx_glow",
  neon: "text_fx_neon",
  shadow: "text_fx_shadow",
  chroma: "text_fx_chroma",
  blur: "text_fx_blur",
  flicker: "text_fx_flicker",
  rainbow: "text_fx_rainbow",
  gradient: "text_fx_gradient",
  terminal: "block_fx_terminal",
  stat_screen: "block_fx_stat_screen",
  game_screen: "block_fx_game_screen",
  quest_log: "block_fx_quest_log",
  skill_popup: "block_fx_skill_popup",
  inventory: "block_fx_inventory",
  combat_feed: "block_fx_combat_feed",
  status_effects: "block_fx_status_effects",
  system_warning: "block_fx_system_warning",
  memory_fragment: "block_fx_memory_fragment",
  admin_trace: "block_fx_admin_trace",
  party_roster: "block_fx_party_roster",
  map_ping: "block_fx_map_ping",
  aura: "text_fx_aura",
  etch: "text_fx_etch",
  whisper: "text_fx_whisper",
  sigil_pulse: "text_fx_sigil_pulse",
  veil: "text_fx_veil",
  cadence: "text_fx_cadence",
  cadence_soft: "text_fx_cadence_soft",
  cadence_oracular: "text_fx_cadence_oracular",
  cadence_childlike: "text_fx_cadence_childlike",
  wiggle: "text_fx_wiggle",
  float: "text_fx_float",
  shake: "text_fx_shake",
  glitch: "text_fx_glitch",
});

const combat_token_class_by_name = Object.freeze({
  crit: "combat_token_crit",
  miss: "combat_token_miss",
  buff: "combat_token_buff",
  debuff: "combat_token_debuff",
  block: "combat_token_block",
  dodge: "combat_token_dodge",
  immune: "combat_token_immune",
  resist: "combat_token_resist",
  mega_crit: "combat_token_mega_crit",
  overkill: "combat_token_overkill",
  true_damage: "combat_token_true_damage",
  guard_break: "combat_token_guard_break",
  execute: "combat_token_execute",
});

const combat_token_regex =
  /\b(MEGA_CRIT|TRUE_DAMAGE|GUARD_BREAK|OVERKILL|EXECUTE|CRIT|MISS|BUFF|DEBUFF|BLOCK|DODGE|IMMUNE|RESIST)\b/gi;

const parse_combat_token_segments = (text_value) => {
  const raw_text = String(text_value);
  const segments = [];
  let cursor = 0;

  combat_token_regex.lastIndex = 0;

  for (const token_match of raw_text.matchAll(combat_token_regex)) {
    const full_match = token_match[0];
    const token_start = token_match.index ?? 0;
    const token_end = token_start + full_match.length;

    if (cursor < token_start) {
      segments.push({
        type: "text",
        value: raw_text.slice(cursor, token_start),
      });
    }

    const token_name = full_match.toLowerCase();
    const token_class = combat_token_class_by_name[token_name] ?? null;

    if (token_class) {
      segments.push({
        type: "token",
        value: full_match,
        token_class,
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

const text_fx_intensity_min = 0.2;
const text_fx_intensity_max = 3;

const text_fx_stack_blacklist_pairs = Object.freeze([
  Object.freeze(["rainbow", "gradient"]),
  Object.freeze(["shake", "float"]),
]);

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

const text_fx_alias_map = (() => {
  const alias_map = {};

  for (const effect_name of Object.keys(text_fx_effect_class_map)) {
    const class_name = text_fx_effect_class_map[effect_name];

    alias_map[effect_name] = effect_name;
    alias_map[effect_name.replaceAll("-", "_")] = effect_name;
    alias_map[effect_name.replaceAll("_", "-")] = effect_name;

    alias_map[`fx-${effect_name}`] = effect_name;
    alias_map[`fx_${effect_name}`] = effect_name;

    alias_map[class_name] = effect_name;
  }

  return Object.freeze(alias_map);
})();

const normalize_text_fx_token = (raw_token) => {
  if (typeof raw_token !== "string") {
    return null;
  }

  const normalized_token = raw_token.trim().toLowerCase();

  if (!normalized_token) {
    return null;
  }

  return text_fx_alias_map[normalized_token] ?? null;
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

    const is_text_effect =
      text_fx_effect_class_map[normalized_effect]?.startsWith("text_fx_");

    let is_blocked = false;

    if (is_text_effect) {
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

const apply_text_fx_intensity_vars = (node_value) => {
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
};

const collect_text_fx_classes_from_node = (node_value) => {
  if (!(node_value instanceof HTMLElement)) {
    return [];
  }

  const classes_to_apply = new Set();
  const class_tokens = Array.from(node_value.classList);
  const data_tokens = split_text_fx_tokens(node_value.dataset.textFx ?? "");

  const resolved_effects = resolve_text_fx_effects_with_stack_rules([
    ...class_tokens,
    ...data_tokens,
  ]);

  for (const effect_name of resolved_effects) {
    const resolved_class = resolve_text_fx_class(effect_name);

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

  const effect_classes = collect_text_fx_classes_from_node(node_value);

  if (!effect_classes.length) {
    return [];
  }

  const has_text_effect = effect_classes.some((class_name) =>
    class_name.startsWith("text_fx_"),
  );
  const has_block_effect = effect_classes.some((class_name) =>
    class_name.startsWith("block_fx_"),
  );

  if (has_text_effect) {
    node_value.classList.add("text_fx");
  }

  if (has_block_effect) {
    node_value.classList.add("block_fx");
  }

  for (const class_name of effect_classes) {
    node_value.classList.add(class_name);
  }

  apply_text_fx_intensity_vars(node_value);

  node_value.dataset.textFxHydrated = "true";

  return effect_classes;
};

const find_text_fx_nodes = (root_node = document) => {
  if (!root_node || typeof root_node.querySelectorAll !== "function") {
    return [];
  }

  return Array.from(
    root_node.querySelectorAll(
      "[data-text-fx], [class*='fx-'], [class*='text_fx'], [class*='block_fx']",
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
    token_span.className = `combat_token ${segment_value.token_class}`;
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
    ".block_fx_combat_feed, .text_fx_combat_feed",
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
            parent_node.closest(".combat_token") ||
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

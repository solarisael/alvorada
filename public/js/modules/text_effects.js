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
  wiggle: "text_fx_wiggle",
  float: "text_fx_float",
  shake: "text_fx_shake",
  glitch: "text_fx_glitch",
});

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

const split_text_fx_tokens = (token_string = "") => {
  return token_string
    .split(/[\s,|]+/)
    .map((token) => token.trim())
    .filter(Boolean);
};

const collect_text_fx_classes_from_node = (node_value) => {
  if (!(node_value instanceof HTMLElement)) {
    return [];
  }

  const classes_to_apply = new Set();
  const class_tokens = Array.from(node_value.classList);
  const data_tokens = split_text_fx_tokens(node_value.dataset.textFx ?? "");

  for (const token of [...class_tokens, ...data_tokens]) {
    const resolved_class = resolve_text_fx_class(token);

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

  node_value.classList.add("text_fx");

  for (const class_name of effect_classes) {
    node_value.classList.add(class_name);
  }

  node_value.dataset.textFxHydrated = "true";

  return effect_classes;
};

const find_text_fx_nodes = (root_node = document) => {
  if (!root_node || typeof root_node.querySelectorAll !== "function") {
    return [];
  }

  return Array.from(
    root_node.querySelectorAll(
      "span[data-text-fx], span[class*='fx-'], span[class*='text_fx']",
    ),
  );
};

const hydrate_text_effects = (root_node = document) => {
  const text_fx_nodes = find_text_fx_nodes(root_node);

  for (const text_fx_node of text_fx_nodes) {
    apply_text_fx_classes(text_fx_node);
  }
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
  collect_text_fx_classes_from_node,
  hydrate_text_effects,
  normalize_text_fx_token,
  resolve_text_fx_class,
  split_text_fx_tokens,
  text_fx_effect_class_map,
};

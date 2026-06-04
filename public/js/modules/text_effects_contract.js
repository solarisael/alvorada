const TEXT_FX_TEXT_BASE_CLASS = "sol__text_fx";
const TEXT_FX_BLOCK_BASE_CLASS = "sol__block_fx";

const TEXT_FX_TEXT_EFFECT_NAMES = Object.freeze([
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

const TEXT_FX_BLOCK_EFFECT_NAMES = Object.freeze([
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

const TEXT_FX_INLINE_BLOCK_EFFECT_NAMES = Object.freeze(["combat_feed"]);

const TEXT_FX_STACK_BLACKLIST_PAIRS = Object.freeze([
  Object.freeze(["rainbow", "gradient"]),
  Object.freeze(["shake", "float"]),
]);

const TEXT_FX_INTENSITY_MIN = 0.2;
const TEXT_FX_INTENSITY_MAX = 3;

const TEXT_FX_EFFECT_NAMES = Object.freeze([
  ...TEXT_FX_TEXT_EFFECT_NAMES,
  ...TEXT_FX_BLOCK_EFFECT_NAMES,
]);

const build_effect_class_map = () => {
  const class_map = {};

  for (const effect_name of TEXT_FX_TEXT_EFFECT_NAMES) {
    class_map[effect_name] = `${TEXT_FX_TEXT_BASE_CLASS}_${effect_name}`;
  }

  for (const effect_name of TEXT_FX_BLOCK_EFFECT_NAMES) {
    class_map[effect_name] = `${TEXT_FX_BLOCK_BASE_CLASS}_${effect_name}`;
  }

  return Object.freeze(class_map);
};

const build_effect_kind_map = () => {
  const kind_map = {};

  for (const effect_name of TEXT_FX_TEXT_EFFECT_NAMES) {
    kind_map[effect_name] = "text";
  }

  for (const effect_name of TEXT_FX_BLOCK_EFFECT_NAMES) {
    kind_map[effect_name] = "block";
  }

  return Object.freeze(kind_map);
};

const TEXT_FX_EFFECT_CLASS_MAP = build_effect_class_map();
const TEXT_FX_EFFECT_KIND_MAP = build_effect_kind_map();

const add_aliases = (alias_map, effect_name) => {
  const dash_name = effect_name.replaceAll("_", "-");
  const underscore_name = effect_name.replaceAll("-", "_");
  const class_name = TEXT_FX_EFFECT_CLASS_MAP[effect_name];

  alias_map[effect_name] = effect_name;
  alias_map[dash_name] = effect_name;
  alias_map[underscore_name] = effect_name;
  alias_map[`fx-${dash_name}`] = effect_name;
  alias_map[`fx_${underscore_name}`] = effect_name;
  alias_map[`text_fx_${underscore_name}`] = effect_name;
  alias_map[`block_fx_${underscore_name}`] = effect_name;

  if (class_name) {
    alias_map[class_name] = effect_name;
  }

  if (TEXT_FX_INLINE_BLOCK_EFFECT_NAMES.includes(effect_name)) {
    alias_map[`${TEXT_FX_TEXT_BASE_CLASS}_${effect_name}`] = effect_name;
  }
};

const build_alias_map = () => {
  const alias_map = {};

  for (const effect_name of TEXT_FX_EFFECT_NAMES) {
    add_aliases(alias_map, effect_name);
  }

  return Object.freeze(alias_map);
};

const TEXT_FX_ALIAS_MAP = build_alias_map();

const normalize_text_fx_name = (raw_name) => {
  if (typeof raw_name !== "string") {
    return null;
  }

  const normalized_name = raw_name.trim().toLowerCase();

  if (!normalized_name) {
    return null;
  }

  return TEXT_FX_ALIAS_MAP[normalized_name] ?? null;
};

const text_fx_class_for = (effect_name) => {
  return TEXT_FX_EFFECT_CLASS_MAP[effect_name] ?? null;
};

const text_fx_text_class_for = (effect_name) => {
  return `${TEXT_FX_TEXT_BASE_CLASS}_${effect_name}`;
};

const text_fx_block_class_for = (effect_name) => {
  return `${TEXT_FX_BLOCK_BASE_CLASS}_${effect_name}`;
};

const text_fx_kind_for = (effect_name) => {
  return TEXT_FX_EFFECT_KIND_MAP[effect_name] ?? null;
};

const text_fx_is_text_effect = (effect_name) => {
  return text_fx_kind_for(effect_name) === "text";
};

const text_fx_is_block_effect = (effect_name) => {
  return text_fx_kind_for(effect_name) === "block";
};

const text_fx_is_inline_block_effect = (effect_name) => {
  return TEXT_FX_INLINE_BLOCK_EFFECT_NAMES.includes(effect_name);
};

export {
  TEXT_FX_ALIAS_MAP,
  TEXT_FX_BLOCK_BASE_CLASS,
  TEXT_FX_BLOCK_EFFECT_NAMES,
  TEXT_FX_EFFECT_CLASS_MAP,
  TEXT_FX_EFFECT_KIND_MAP,
  TEXT_FX_EFFECT_NAMES,
  TEXT_FX_INLINE_BLOCK_EFFECT_NAMES,
  TEXT_FX_INTENSITY_MAX,
  TEXT_FX_INTENSITY_MIN,
  TEXT_FX_STACK_BLACKLIST_PAIRS,
  TEXT_FX_TEXT_BASE_CLASS,
  TEXT_FX_TEXT_EFFECT_NAMES,
  normalize_text_fx_name,
  text_fx_class_for,
  text_fx_block_class_for,
  text_fx_is_block_effect,
  text_fx_is_inline_block_effect,
  text_fx_is_text_effect,
  text_fx_kind_for,
  text_fx_text_class_for,
};

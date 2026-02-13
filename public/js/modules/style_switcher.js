const window_any = /** @type {any} */ (globalThis);

const SITE_THEME_COOKIE_NAME = "site_theme";
const SITE_SHELL_COOKIE_NAME = "site_shell";
const SITE_FX_COOKIE_NAME = "site_fx";
const SITE_SWITCHER_COLLAPSED_COOKIE_NAME = "site_switcher_collapsed";

const LEGACY_HOME_THEME_COOKIE_NAME = "home_theme";
const LEGACY_HOME_FX_COOKIE_NAME = "home_fx";

const SITE_THEME_DEFAULT = "cinza";
const SITE_SHELL_DEFAULT = "medium";
const SITE_FX_DEFAULT = "balanced";
const SITE_SWITCHER_COLLAPSED_DEFAULT = true;
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

const site_theme_options = ["cinza"];

const legacy_theme_alias_map = {
  ritual: "cinza",
  vibrant: "cinza",
  gilded_arcana: "cinza",
  arcane: "cinza",
  verdigris: "cinza",
  golden_mystical_tarot: "cinza",
  astrology_themed: "cinza",
  cosmic_themed: "cinza",
  wicca_ornamentation: "cinza",
  gothic_dark_girl: "cinza",
  relic_gothic: "cinza",
  grimdark_tarot: "cinza",
};
const site_shell_options = ["subtle", "medium", "strong"];
const site_fx_options = ["subtle", "balanced", "bold"];

const parse_cookie_map = (cookie_header = "") => {
  const cookie_map = {};

  if (!cookie_header) {
    return cookie_map;
  }

  const cookie_entries = cookie_header.split(";");

  for (const cookie_entry of cookie_entries) {
    const [raw_name, ...raw_value_parts] = cookie_entry.trim().split("=");

    if (!raw_name) {
      continue;
    }

    cookie_map[raw_name] = decodeURIComponent(raw_value_parts.join("="));
  }

  return cookie_map;
};

const read_cookie_value = (cookie_name, cookie_header = null) => {
  const source_cookie_header =
    typeof cookie_header === "string"
      ? cookie_header
      : typeof document !== "undefined"
        ? document.cookie
        : "";
  const cookie_map = parse_cookie_map(source_cookie_header);

  return cookie_map[cookie_name] ?? null;
};

const build_cookie_string = (
  cookie_name,
  cookie_value,
  max_age_seconds = COOKIE_MAX_AGE_SECONDS,
) => {
  return `${cookie_name}=${encodeURIComponent(cookie_value)}; path=/; max-age=${max_age_seconds}; SameSite=Lax`;
};

const write_cookie_value = (cookie_name, cookie_value) => {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = build_cookie_string(cookie_name, cookie_value);
};

const get_safe_option = (candidate_value, allowed_options, fallback_value) => {
  if (allowed_options.includes(candidate_value)) {
    return candidate_value;
  }

  return fallback_value;
};

const has_site_root = (node_value) => {
  return Boolean(
    node_value &&
    node_value.dataset &&
    typeof node_value.setAttribute === "function" &&
    typeof node_value.removeAttribute === "function",
  );
};

const apply_site_style_state = (site_root, theme_name, shell_name, fx_name) => {
  if (!has_site_root(site_root)) {
    return;
  }

  site_root.setAttribute("data-site-theme", theme_name);
  site_root.setAttribute("data-site-shell", shell_name);
  site_root.setAttribute("data-site-fx", fx_name);
};

const sync_switcher_controls = (theme_name, shell_name, fx_name) => {
  const switcher_node = document.querySelector("#style_switcher");

  if (!(switcher_node instanceof HTMLElement)) {
    return;
  }

  const theme_select_node = switcher_node.querySelector("[data-style-theme]");
  const shell_select_node = switcher_node.querySelector("[data-style-shell]");
  const fx_select_node = switcher_node.querySelector("[data-style-fx]");

  if (theme_select_node instanceof HTMLSelectElement) {
    theme_select_node.value = theme_name;
  }

  if (shell_select_node instanceof HTMLSelectElement) {
    shell_select_node.value = shell_name;
  }

  if (fx_select_node instanceof HTMLSelectElement) {
    fx_select_node.value = fx_name;
  }
};

const normalize_legacy_fx_value = (legacy_fx_value) => {
  if (typeof legacy_fx_value !== "string") {
    return null;
  }

  if (!legacy_fx_value.startsWith("home_fx_")) {
    return null;
  }

  return legacy_fx_value.replace("home_fx_", "");
};

const normalize_legacy_theme_value = (legacy_theme_value) => {
  if (typeof legacy_theme_value !== "string") {
    return null;
  }

  if (!legacy_theme_value.startsWith("site_theme_")) {
    return null;
  }

  const normalized_theme = legacy_theme_value.replace("site_theme_", "");

  return legacy_theme_alias_map[normalized_theme] ?? normalized_theme;
};

const normalize_theme_alias_value = (theme_value) => {
  if (typeof theme_value !== "string") {
    return null;
  }

  return legacy_theme_alias_map[theme_value] ?? theme_value;
};

const resolve_saved_style = (cookie_header = null) => {
  const saved_theme_class = get_safe_option(
    normalize_theme_alias_value(
      read_cookie_value(SITE_THEME_COOKIE_NAME, cookie_header),
    ) ??
      normalize_legacy_theme_value(
        read_cookie_value(LEGACY_HOME_THEME_COOKIE_NAME, cookie_header),
      ),
    site_theme_options,
    SITE_THEME_DEFAULT,
  );

  const saved_shell_class = get_safe_option(
    read_cookie_value(SITE_SHELL_COOKIE_NAME, cookie_header),
    site_shell_options,
    SITE_SHELL_DEFAULT,
  );

  const saved_fx_class = get_safe_option(
    read_cookie_value(SITE_FX_COOKIE_NAME, cookie_header) ??
      normalize_legacy_fx_value(
        read_cookie_value(LEGACY_HOME_FX_COOKIE_NAME, cookie_header),
      ),
    site_fx_options,
    SITE_FX_DEFAULT,
  );

  return {
    saved_theme_class,
    saved_shell_class,
    saved_fx_class,
  };
};

const apply_saved_style = () => {
  if (typeof document === "undefined") {
    return;
  }

  const { saved_theme_class, saved_shell_class, saved_fx_class } =
    resolve_saved_style();

  apply_site_style_state(
    document.documentElement,
    saved_theme_class,
    saved_shell_class,
    saved_fx_class,
  );
  sync_switcher_controls(saved_theme_class, saved_shell_class, saved_fx_class);
};

const bind_switcher_controls = () => {
  if (typeof document === "undefined") {
    return;
  }

  const switcher_node = document.querySelector("#style_switcher");

  if (!(switcher_node instanceof HTMLElement)) {
    return;
  }

  if (switcher_node.dataset.styleInit === "true") {
    return;
  }

  switcher_node.dataset.styleInit = "true";

  const theme_select_node = switcher_node.querySelector("[data-style-theme]");
  const shell_select_node = switcher_node.querySelector("[data-style-shell]");
  const fx_select_node = switcher_node.querySelector("[data-style-fx]");
  const toggle_node = switcher_node.querySelector("[data-style-toggle]");

  const set_switcher_collapsed = (is_collapsed) => {
    switcher_node.dataset.styleCollapsed = is_collapsed ? "true" : "false";

    if (toggle_node instanceof HTMLButtonElement) {
      toggle_node.setAttribute(
        "aria-expanded",
        is_collapsed ? "false" : "true",
      );
      toggle_node.textContent = is_collapsed ? "style" : "close";
    }
  };

  const read_collapsed_preference = () => {
    const raw_switcher_state = read_cookie_value(
      SITE_SWITCHER_COLLAPSED_COOKIE_NAME,
    );

    if (raw_switcher_state === "true") {
      return true;
    }

    if (raw_switcher_state === "false") {
      return false;
    }

    return SITE_SWITCHER_COLLAPSED_DEFAULT;
  };

  set_switcher_collapsed(read_collapsed_preference());

  const commit_switcher_state = () => {
    const selected_theme_name = get_safe_option(
      theme_select_node instanceof HTMLSelectElement
        ? theme_select_node.value
        : SITE_THEME_DEFAULT,
      site_theme_options,
      SITE_THEME_DEFAULT,
    );
    const selected_shell_name = get_safe_option(
      shell_select_node instanceof HTMLSelectElement
        ? shell_select_node.value
        : SITE_SHELL_DEFAULT,
      site_shell_options,
      SITE_SHELL_DEFAULT,
    );
    const selected_fx_name = get_safe_option(
      fx_select_node instanceof HTMLSelectElement
        ? fx_select_node.value
        : SITE_FX_DEFAULT,
      site_fx_options,
      SITE_FX_DEFAULT,
    );

    apply_site_style_state(
      document.documentElement,
      selected_theme_name,
      selected_shell_name,
      selected_fx_name,
    );
    write_cookie_value(SITE_THEME_COOKIE_NAME, selected_theme_name);
    write_cookie_value(SITE_SHELL_COOKIE_NAME, selected_shell_name);
    write_cookie_value(SITE_FX_COOKIE_NAME, selected_fx_name);
  };

  if (theme_select_node instanceof HTMLSelectElement) {
    theme_select_node.addEventListener("change", commit_switcher_state);
  }

  if (shell_select_node instanceof HTMLSelectElement) {
    shell_select_node.addEventListener("change", commit_switcher_state);
  }

  if (fx_select_node instanceof HTMLSelectElement) {
    fx_select_node.addEventListener("change", commit_switcher_state);
  }

  if (toggle_node instanceof HTMLButtonElement) {
    toggle_node.addEventListener("click", () => {
      const next_collapsed_state =
        switcher_node.dataset.styleCollapsed !== "true";

      set_switcher_collapsed(next_collapsed_state);
      write_cookie_value(
        SITE_SWITCHER_COLLAPSED_COOKIE_NAME,
        next_collapsed_state ? "true" : "false",
      );
    });
  }
};

const init_style_switcher = () => {
  apply_saved_style();
  bind_switcher_controls();
};

if (
  typeof window !== "undefined" &&
  typeof document !== "undefined" &&
  !window_any.__style_switcher_init_bound
) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init_style_switcher);
  } else {
    init_style_switcher();
  }

  window_any.__style_switcher_init_bound = true;
}

if (
  typeof window !== "undefined" &&
  typeof document !== "undefined" &&
  !window_any.__style_switcher_htmx_after_swap_bound
) {
  document.body?.addEventListener("htmx:afterSwap", () => {
    apply_saved_style();
    bind_switcher_controls();
  });

  window_any.__style_switcher_htmx_after_swap_bound = true;
}

export {
  COOKIE_MAX_AGE_SECONDS,
  LEGACY_HOME_FX_COOKIE_NAME,
  LEGACY_HOME_THEME_COOKIE_NAME,
  SITE_FX_COOKIE_NAME,
  SITE_FX_DEFAULT,
  SITE_SWITCHER_COLLAPSED_COOKIE_NAME,
  SITE_SWITCHER_COLLAPSED_DEFAULT,
  SITE_SHELL_COOKIE_NAME,
  SITE_SHELL_DEFAULT,
  SITE_THEME_COOKIE_NAME,
  SITE_THEME_DEFAULT,
  apply_site_style_state,
  build_cookie_string,
  get_safe_option,
  has_site_root,
  init_style_switcher,
  normalize_legacy_fx_value,
  normalize_legacy_theme_value,
  normalize_theme_alias_value,
  parse_cookie_map,
  read_cookie_value,
  resolve_saved_style,
  legacy_theme_alias_map,
  site_fx_options,
  site_shell_options,
  site_theme_options,
};

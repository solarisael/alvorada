import {
  derive_request_pathname,
  is_route_swap_target,
  is_section_path_active,
  normalize_pathname,
} from "./htmx_route_lifecycle.js";

const window_any = /** @type {any} */ (globalThis);

const SITE_THEME_COOKIE_NAME = "site_theme";
const SITE_SHELL_COOKIE_NAME = "site_shell";
const SITE_FX_COOKIE_NAME = "site_fx";
const SITE_SCALE_COOKIE_NAME = "site_scale";
const SITE_MENU_OPEN_COOKIE_NAME = "site_menu_open";
const SITE_MENU_VIEW_COOKIE_NAME = "site_menu_view";
const USER_TEXT_COOKIE_NAME = "user_text";
const USER_MEASURE_COOKIE_NAME = "user_measure";

const LEGACY_HOME_THEME_COOKIE_NAME = "home_theme";
const LEGACY_HOME_FX_COOKIE_NAME = "home_fx";

const SITE_THEME_DEFAULT = "solarisael";
const SITE_SHELL_DEFAULT = "medium";
const SITE_FX_DEFAULT = "balanced";
const SITE_SCALE_DEFAULT = "100";
const SITE_MENU_OPEN_DEFAULT = false;
const SITE_MENU_VIEW_DEFAULT = "root";
const USER_TEXT_DEFAULT = "normal";
const USER_MEASURE_DEFAULT = "comfort";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

const site_theme_options = ["solarisael"];
const site_shell_options = ["subtle", "medium", "strong"];
const site_fx_options = ["subtle", "balanced", "bold"];
const site_scale_options = ["100", "90", "80"];
const user_text_options = ["compact", "normal", "large"];
const user_measure_options = ["focused", "comfort", "wide"];

let last_applied_route_pathname = null;

/**
 * @param {string | null} [pathname_override=null]
 */
const apply_side_menu_route_state = (pathname_override = null) => {
  const menu_node = document.querySelector("#sol_side_menu");
  if (!(menu_node instanceof HTMLElement)) {
    return;
  }

  const current_pathname = normalize_pathname(
    pathname_override ?? window.location.pathname,
  );
  if (last_applied_route_pathname === current_pathname) {
    return;
  }

  let active_route_node = null;
  let active_route_length = -1;

  for (const route_node of menu_node.querySelectorAll(
    "[data-side-menu-route]",
  )) {
    if (!(route_node instanceof HTMLAnchorElement)) {
      continue;
    }

    const target_pathname = normalize_pathname(
      new URL(route_node.href, window.location.origin).pathname,
    );
    const is_exact_match = current_pathname === target_pathname;
    const is_home_route = route_node.dataset.phase === "home";
    const is_active = is_home_route
      ? is_exact_match
      : is_section_path_active(current_pathname, target_pathname);

    route_node.dataset.routeActive = is_active ? "true" : "false";
    if (is_exact_match) {
      route_node.setAttribute("aria-current", "page");
    } else if (is_active) {
      route_node.setAttribute("aria-current", "location");
    } else {
      route_node.removeAttribute("aria-current");
    }

    if (is_active && target_pathname.length > active_route_length) {
      active_route_node = route_node;
      active_route_length = target_pathname.length;
    }
  }

  const current_place_node = menu_node.querySelector(
    "[data-side-menu-current]",
  );
  const current_place_shell = current_place_node?.closest(
    ".sol__side_menu_current",
  );
  if (current_place_node instanceof HTMLElement) {
    current_place_node.textContent =
      active_route_node?.dataset.navLabel ?? "hearth";
  }
  if (current_place_shell instanceof HTMLElement) {
    current_place_shell.dataset.phase =
      active_route_node?.dataset.phase ?? "home";
  }

  last_applied_route_pathname = current_pathname;
};

const legacy_theme_alias_map = {
  ritual: "solarisael",
  vibrant: "solarisael",
  gilded_arcana: "solarisael",
  arcane: "solarisael",
  verdigris: "solarisael",
  golden_mystical_tarot: "solarisael",
  astrology_themed: "solarisael",
  cosmic_themed: "solarisael",
  wicca_ornamentation: "solarisael",
  gothic_dark_girl: "solarisael",
  relic_gothic: "solarisael",
  grimdark_tarot: "solarisael",
  cinza: "solarisael",
};

const parse_cookie_map = (cookie_header = "") => {
  const cookie_map = {};

  for (const cookie_pair of String(cookie_header).split(";")) {
    const [raw_key, ...raw_value_parts] = cookie_pair.split("=");
    const cookie_key = raw_key?.trim();

    if (!cookie_key) {
      continue;
    }

    cookie_map[cookie_key] = decodeURIComponent(
      raw_value_parts.join("=").trim(),
    );
  }

  return cookie_map;
};

const read_cookie_value = (cookie_name, cookie_header = null) => {
  if (cookie_header === null && typeof document === "undefined") {
    return null;
  }

  const cookie_map = parse_cookie_map(cookie_header ?? document.cookie);
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

const delete_cookie_value = (cookie_name) => {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = build_cookie_string(cookie_name, "", 0);
};

const get_safe_option = (candidate_value, allowed_options, fallback_value) => {
  if (allowed_options.includes(candidate_value)) {
    return candidate_value;
  }

  return fallback_value;
};

const has_site_root = (node_value) => {
  return (
    typeof node_value === "object" &&
    node_value !== null &&
    typeof node_value.setAttribute === "function"
  );
};

const apply_site_style_state = (
  site_root,
  theme_name,
  shell_name,
  fx_name,
  scale_name = SITE_SCALE_DEFAULT,
) => {
  if (!has_site_root(site_root)) {
    return;
  }

  site_root.setAttribute("data-site-theme", theme_name);
  site_root.setAttribute("data-site-shell", shell_name);
  site_root.setAttribute("data-site-fx", fx_name);
  site_root.setAttribute("data-site-scale", scale_name);
};

const apply_user_settings_state = (site_root, text_name, measure_name) => {
  if (!has_site_root(site_root)) {
    return;
  }

  site_root.setAttribute("data-user-text", text_name);
  site_root.setAttribute("data-user-measure", measure_name);
};

const normalize_legacy_fx_value = (legacy_fx_value) => {
  if (typeof legacy_fx_value !== "string") {
    return null;
  }

  return legacy_fx_value.replace(/^home_fx_/, "");
};

const normalize_legacy_theme_value = (legacy_theme_value) => {
  if (typeof legacy_theme_value !== "string") {
    return null;
  }

  const normalized_theme = legacy_theme_value.replace(/^site_theme_/, "");
  return legacy_theme_alias_map[normalized_theme] ?? null;
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
  const saved_scale_class = get_safe_option(
    read_cookie_value(SITE_SCALE_COOKIE_NAME, cookie_header),
    site_scale_options,
    SITE_SCALE_DEFAULT,
  );

  return {
    saved_theme_class,
    saved_shell_class,
    saved_fx_class,
    saved_scale_class,
  };
};

const resolve_saved_user_settings = (cookie_header = null) => {
  const saved_text_class = get_safe_option(
    read_cookie_value(USER_TEXT_COOKIE_NAME, cookie_header),
    user_text_options,
    USER_TEXT_DEFAULT,
  );
  const saved_measure_class = get_safe_option(
    read_cookie_value(USER_MEASURE_COOKIE_NAME, cookie_header),
    user_measure_options,
    USER_MEASURE_DEFAULT,
  );

  return {
    saved_text_class,
    saved_measure_class,
  };
};

const resolve_saved_menu_state = (cookie_header = null) => {
  const raw_open_value = read_cookie_value(
    SITE_MENU_OPEN_COOKIE_NAME,
    cookie_header,
  );
  const saved_menu_open =
    raw_open_value === "true"
      ? true
      : raw_open_value === "false"
        ? false
        : SITE_MENU_OPEN_DEFAULT;
  const saved_menu_view =
    read_cookie_value(SITE_MENU_VIEW_COOKIE_NAME, cookie_header) ??
    SITE_MENU_VIEW_DEFAULT;

  return {
    saved_menu_open,
    saved_menu_view,
  };
};

const set_menu_view_state = (menu_node, requested_view) => {
  if (!(menu_node instanceof HTMLElement)) {
    return SITE_MENU_VIEW_DEFAULT;
  }

  const view_nodes = Array.from(
    menu_node.querySelectorAll("[data-side-menu-view-page]"),
  ).filter((node) => node instanceof HTMLElement);
  const available_views = view_nodes.map(
    (node) => node.dataset.sideMenuViewPage,
  );
  const safe_view = get_safe_option(
    requested_view,
    available_views,
    available_views.includes(SITE_MENU_VIEW_DEFAULT)
      ? SITE_MENU_VIEW_DEFAULT
      : available_views[0],
  );
  const active_index = Math.max(available_views.indexOf(safe_view), 0);

  menu_node.dataset.sideMenuView = safe_view;

  view_nodes.forEach((view_node, index) => {
    const is_active = index === active_index;
    view_node.dataset.viewPosition =
      index < active_index
        ? "before"
        : index > active_index
          ? "after"
          : "active";
    view_node.setAttribute("aria-hidden", is_active ? "false" : "true");
    view_node.inert = !is_active;
  });

  for (const target_node of menu_node.querySelectorAll(
    "[data-side-menu-view-target]",
  )) {
    const is_current_target =
      target_node.dataset.sideMenuViewTarget === safe_view;
    target_node.setAttribute(
      "aria-expanded",
      is_current_target ? "true" : "false",
    );
  }

  return safe_view;
};

const set_menu_state = (menu_node, is_open, view_name) => {
  if (!(menu_node instanceof HTMLElement)) {
    return SITE_MENU_VIEW_DEFAULT;
  }

  const safe_view = set_menu_view_state(menu_node, view_name);
  menu_node.dataset.sideMenuOpen = is_open ? "true" : "false";

  const trigger_node = menu_node.querySelector("[data-side-menu-trigger]");
  const panel_node = menu_node.querySelector("[data-side-menu-panel-shell]");

  if (trigger_node instanceof HTMLButtonElement) {
    trigger_node.setAttribute("aria-expanded", is_open ? "true" : "false");
    trigger_node.setAttribute(
      "aria-label",
      is_open ? "Close Solarisael menu" : "Open Solarisael menu",
    );
  }

  if (panel_node instanceof HTMLElement) {
    panel_node.setAttribute("aria-hidden", is_open ? "false" : "true");
    panel_node.inert = !is_open;
  }

  return safe_view;
};

const sync_side_menu_controls = (
  theme_name,
  shell_name,
  fx_name,
  scale_name,
  text_name,
  measure_name,
  menu_open,
  menu_view,
) => {
  const menu_node = document.querySelector("#sol_side_menu");

  if (!(menu_node instanceof HTMLElement)) {
    return;
  }

  const theme_select_node = menu_node.querySelector(
    "[data-site-theme-control]",
  );
  const shell_select_node = menu_node.querySelector(
    "[data-site-shell-control]",
  );
  const fx_select_node = menu_node.querySelector("[data-site-fx-control]");
  const scale_select_node = menu_node.querySelector(
    "[data-site-scale-control]",
  );
  const text_select_node = menu_node.querySelector("[data-user-text-control]");
  const measure_select_node = menu_node.querySelector(
    "[data-user-measure-control]",
  );

  if (theme_select_node instanceof HTMLSelectElement) {
    theme_select_node.value = theme_name;
  }

  if (shell_select_node instanceof HTMLSelectElement) {
    shell_select_node.value = shell_name;
  }

  if (fx_select_node instanceof HTMLSelectElement) {
    fx_select_node.value = fx_name;
  }

  if (scale_select_node instanceof HTMLSelectElement) {
    scale_select_node.value = scale_name;
  }

  if (text_select_node instanceof HTMLSelectElement) {
    text_select_node.value = text_name;
  }

  if (measure_select_node instanceof HTMLSelectElement) {
    measure_select_node.value = measure_name;
  }

  set_menu_state(menu_node, menu_open, menu_view);
};

const apply_saved_preferences = () => {
  if (typeof document === "undefined") {
    return;
  }

  const {
    saved_theme_class,
    saved_shell_class,
    saved_fx_class,
    saved_scale_class,
  } = resolve_saved_style();
  const { saved_text_class, saved_measure_class } =
    resolve_saved_user_settings();
  const { saved_menu_open, saved_menu_view } = resolve_saved_menu_state();

  apply_site_style_state(
    document.documentElement,
    saved_theme_class,
    saved_shell_class,
    saved_fx_class,
    saved_scale_class,
  );
  apply_user_settings_state(
    document.documentElement,
    saved_text_class,
    saved_measure_class,
  );
  sync_side_menu_controls(
    saved_theme_class,
    saved_shell_class,
    saved_fx_class,
    saved_scale_class,
    saved_text_class,
    saved_measure_class,
    saved_menu_open,
    saved_menu_view,
  );
};

const bind_side_menu_controls = () => {
  if (typeof document === "undefined") {
    return;
  }

  const menu_node = document.querySelector("#sol_side_menu");

  if (!(menu_node instanceof HTMLElement)) {
    return;
  }

  if (menu_node.dataset.sideMenuInit === "true") {
    return;
  }

  menu_node.dataset.sideMenuInit = "true";

  const theme_select_node = menu_node.querySelector(
    "[data-site-theme-control]",
  );
  const shell_select_node = menu_node.querySelector(
    "[data-site-shell-control]",
  );
  const fx_select_node = menu_node.querySelector("[data-site-fx-control]");
  const scale_select_node = menu_node.querySelector(
    "[data-site-scale-control]",
  );
  const text_select_node = menu_node.querySelector("[data-user-text-control]");
  const measure_select_node = menu_node.querySelector(
    "[data-user-measure-control]",
  );
  const close_node = menu_node.querySelector("[data-side-menu-close]");
  const trigger_node = menu_node.querySelector("[data-side-menu-trigger]");
  const reset_node = menu_node.querySelector("[data-side-menu-reset]");

  const commit_site_state = () => {
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
    const selected_scale_name = get_safe_option(
      scale_select_node instanceof HTMLSelectElement
        ? scale_select_node.value
        : SITE_SCALE_DEFAULT,
      site_scale_options,
      SITE_SCALE_DEFAULT,
    );

    apply_site_style_state(
      document.documentElement,
      selected_theme_name,
      selected_shell_name,
      selected_fx_name,
      selected_scale_name,
    );
    write_cookie_value(SITE_THEME_COOKIE_NAME, selected_theme_name);
    write_cookie_value(SITE_SHELL_COOKIE_NAME, selected_shell_name);
    write_cookie_value(SITE_FX_COOKIE_NAME, selected_fx_name);
    write_cookie_value(SITE_SCALE_COOKIE_NAME, selected_scale_name);
  };

  const commit_user_state = () => {
    const selected_text_name = get_safe_option(
      text_select_node instanceof HTMLSelectElement
        ? text_select_node.value
        : USER_TEXT_DEFAULT,
      user_text_options,
      USER_TEXT_DEFAULT,
    );
    const selected_measure_name = get_safe_option(
      measure_select_node instanceof HTMLSelectElement
        ? measure_select_node.value
        : USER_MEASURE_DEFAULT,
      user_measure_options,
      USER_MEASURE_DEFAULT,
    );

    apply_user_settings_state(
      document.documentElement,
      selected_text_name,
      selected_measure_name,
    );
    write_cookie_value(USER_TEXT_COOKIE_NAME, selected_text_name);
    write_cookie_value(USER_MEASURE_COOKIE_NAME, selected_measure_name);
  };

  const commit_menu_state = (is_open, view_name) => {
    const safe_view = set_menu_state(menu_node, is_open, view_name);
    write_cookie_value(SITE_MENU_OPEN_COOKIE_NAME, is_open ? "true" : "false");
    write_cookie_value(SITE_MENU_VIEW_COOKIE_NAME, safe_view);
  };

  const close_menu = () => {
    commit_menu_state(
      false,
      menu_node.dataset.sideMenuView ?? SITE_MENU_VIEW_DEFAULT,
    );
    if (trigger_node instanceof HTMLButtonElement) {
      trigger_node.focus();
    }
  };

  if (trigger_node instanceof HTMLButtonElement) {
    trigger_node.addEventListener("click", () => {
      const next_open_state = menu_node.dataset.sideMenuOpen !== "true";
      commit_menu_state(
        next_open_state,
        menu_node.dataset.sideMenuView ?? SITE_MENU_VIEW_DEFAULT,
      );
      if (next_open_state && close_node instanceof HTMLButtonElement) {
        window.setTimeout(() => {
          if (menu_node.dataset.sideMenuOpen === "true") {
            close_node.focus();
          }
        }, 0);
      }
    });
  }

  for (const target_node of menu_node.querySelectorAll(
    "[data-side-menu-view-target]",
  )) {
    if (!(target_node instanceof HTMLButtonElement)) {
      continue;
    }

    target_node.addEventListener("click", () => {
      const next_view = target_node.dataset.sideMenuViewTarget;
      const safe_view = set_menu_view_state(menu_node, next_view);
      write_cookie_value(SITE_MENU_VIEW_COOKIE_NAME, safe_view);

      const active_view = menu_node.querySelector(
        `[data-side-menu-view-page="${safe_view}"]`,
      );
      const focus_target = active_view?.querySelector(
        "[data-side-menu-view-focus]",
      );
      window.setTimeout(() => {
        if (focus_target instanceof HTMLElement) {
          focus_target.focus();
        }
      }, 0);
    });
  }

  for (const route_node of menu_node.querySelectorAll(
    "[data-side-menu-route]",
  )) {
    if (!(route_node instanceof HTMLAnchorElement)) {
      continue;
    }

    route_node.addEventListener("click", () => {
      commit_menu_state(
        false,
        menu_node.dataset.sideMenuView ?? SITE_MENU_VIEW_DEFAULT,
      );
    });
  }

  if (close_node instanceof HTMLButtonElement) {
    close_node.addEventListener("click", close_menu);
  }

  menu_node.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || menu_node.dataset.sideMenuOpen !== "true") {
      return;
    }

    event.preventDefault();
    if (menu_node.dataset.sideMenuView !== SITE_MENU_VIEW_DEFAULT) {
      const safe_view = set_menu_view_state(menu_node, SITE_MENU_VIEW_DEFAULT);
      write_cookie_value(SITE_MENU_VIEW_COOKIE_NAME, safe_view);
      const focus_target = menu_node.querySelector(
        `[data-side-menu-view-page="${safe_view}"] [data-side-menu-view-focus]`,
      );
      window.setTimeout(() => {
        if (focus_target instanceof HTMLElement) {
          focus_target.focus();
        }
      }, 0);
      return;
    }

    close_menu();
  });

  if (theme_select_node instanceof HTMLSelectElement) {
    theme_select_node.addEventListener("change", commit_site_state);
  }

  if (shell_select_node instanceof HTMLSelectElement) {
    shell_select_node.addEventListener("change", commit_site_state);
  }

  if (fx_select_node instanceof HTMLSelectElement) {
    fx_select_node.addEventListener("change", commit_site_state);
  }

  if (scale_select_node instanceof HTMLSelectElement) {
    scale_select_node.addEventListener("change", commit_site_state);
  }

  if (text_select_node instanceof HTMLSelectElement) {
    text_select_node.addEventListener("change", commit_user_state);
  }

  if (measure_select_node instanceof HTMLSelectElement) {
    measure_select_node.addEventListener("change", commit_user_state);
  }

  if (reset_node instanceof HTMLButtonElement) {
    reset_node.addEventListener("click", () => {
      for (const cookie_name of [
        SITE_THEME_COOKIE_NAME,
        SITE_SHELL_COOKIE_NAME,
        SITE_FX_COOKIE_NAME,
        SITE_SCALE_COOKIE_NAME,
        USER_TEXT_COOKIE_NAME,
        USER_MEASURE_COOKIE_NAME,
      ]) {
        delete_cookie_value(cookie_name);
      }

      apply_site_style_state(
        document.documentElement,
        SITE_THEME_DEFAULT,
        SITE_SHELL_DEFAULT,
        SITE_FX_DEFAULT,
        SITE_SCALE_DEFAULT,
      );
      apply_user_settings_state(
        document.documentElement,
        USER_TEXT_DEFAULT,
        USER_MEASURE_DEFAULT,
      );
      sync_side_menu_controls(
        SITE_THEME_DEFAULT,
        SITE_SHELL_DEFAULT,
        SITE_FX_DEFAULT,
        SITE_SCALE_DEFAULT,
        USER_TEXT_DEFAULT,
        USER_MEASURE_DEFAULT,
        true,
        "settings",
      );
    });
  }
};

const init_side_menu = () => {
  apply_saved_preferences();
  bind_side_menu_controls();
  last_applied_route_pathname = null;
  apply_side_menu_route_state();
};

if (
  typeof window !== "undefined" &&
  typeof document !== "undefined" &&
  !window_any.__side_menu_init_bound
) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init_side_menu);
  } else {
    init_side_menu();
  }

  window_any.__side_menu_init_bound = true;
}

if (
  typeof window !== "undefined" &&
  typeof document !== "undefined" &&
  !window_any.__side_menu_htmx_after_swap_bound
) {
  document.body?.addEventListener("htmx:afterSwap", (event) => {
    apply_saved_preferences();
    bind_side_menu_controls();

    const htmx_event = /** @type {CustomEvent} */ (event);
    if (!is_route_swap_target(htmx_event.detail?.target)) {
      return;
    }

    last_applied_route_pathname = null;
    apply_side_menu_route_state(
      derive_request_pathname(event) ?? window.location.pathname,
    );
  });

  window_any.__side_menu_htmx_after_swap_bound = true;
}

if (typeof window !== "undefined" && !window_any.__side_menu_popstate_bound) {
  window.addEventListener("popstate", () => {
    last_applied_route_pathname = null;
    apply_side_menu_route_state();
  });
  window_any.__side_menu_popstate_bound = true;
}

export {
  COOKIE_MAX_AGE_SECONDS,
  LEGACY_HOME_FX_COOKIE_NAME,
  LEGACY_HOME_THEME_COOKIE_NAME,
  SITE_FX_COOKIE_NAME,
  SITE_FX_DEFAULT,
  SITE_SCALE_COOKIE_NAME,
  SITE_SCALE_DEFAULT,
  SITE_MENU_OPEN_COOKIE_NAME,
  SITE_MENU_OPEN_DEFAULT,
  SITE_MENU_VIEW_COOKIE_NAME,
  SITE_MENU_VIEW_DEFAULT,
  SITE_SHELL_COOKIE_NAME,
  SITE_SHELL_DEFAULT,
  SITE_THEME_COOKIE_NAME,
  SITE_THEME_DEFAULT,
  USER_MEASURE_COOKIE_NAME,
  USER_MEASURE_DEFAULT,
  USER_TEXT_COOKIE_NAME,
  USER_TEXT_DEFAULT,
  apply_site_style_state,
  apply_user_settings_state,
  build_cookie_string,
  get_safe_option,
  has_site_root,
  init_side_menu,
  set_menu_view_state,
  apply_side_menu_route_state,
  legacy_theme_alias_map,
  normalize_legacy_fx_value,
  normalize_legacy_theme_value,
  normalize_theme_alias_value,
  parse_cookie_map,
  read_cookie_value,
  resolve_saved_menu_state,
  resolve_saved_style,
  resolve_saved_user_settings,
  site_fx_options,
  site_scale_options,
  site_shell_options,
  site_theme_options,
  user_measure_options,
  user_text_options,
};

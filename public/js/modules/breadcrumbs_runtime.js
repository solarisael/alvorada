const window_any = /** @type {any} */ (window);
let last_applied_pathname = null;
const phase_color_by_name = {
  home: "var(--site_style_accent)",
  nigredo: "var(--color-nigredo)",
  albedo: "var(--color-albedo)",
  citrinitas: "var(--color-citrinitas)",
  rubedo: "var(--color-rubedo)",
  codex: "var(--color-codex)",
};
const phase_names = new Set(Object.keys(phase_color_by_name));

/**
 * @param {string} pathname_value
 */
const normalize_pathname = (pathname_value) => {
  const trimmed_pathname = pathname_value.replace(/\/+$/, "");

  return trimmed_pathname || "/";
};

const is_route_swap_target = (target_node) =>
  target_node instanceof HTMLElement &&
  (target_node.matches("container") || target_node.id === "content");

/**
 * @param {Event} event
 */
const derive_request_pathname = (event) => {
  const htmx_event = /** @type {CustomEvent} */ (event);
  const detail_any = /** @type {any} */ (htmx_event.detail);
  const raw_request_path =
    detail_any?.pathInfo?.finalRequestPath ??
    detail_any?.requestConfig?.path ??
    detail_any?.path;

  if (typeof raw_request_path === "string") {
    return normalize_pathname(
      new URL(raw_request_path, window.location.origin).pathname,
    );
  }

  const trigger_node = detail_any?.elt;

  if (trigger_node instanceof HTMLAnchorElement) {
    return normalize_pathname(new URL(trigger_node.href).pathname);
  }

  return null;
};

/**
 * @param {string} pathname_value
 */
const apply_constant_crumb_state = (pathname_value) => {
  const breadcrumb_node = document.querySelector("#sol_breadcrumbs");

  if (!(breadcrumb_node instanceof HTMLElement)) {
    return;
  }

  const normalized_pathname = normalize_pathname(pathname_value);

  if (last_applied_pathname === normalized_pathname) {
    return;
  }

  const path_segments =
    normalized_pathname === "/" ? [] : normalized_pathname.slice(1).split("/");
  const active_phase =
    path_segments.find((path_segment) => phase_names.has(path_segment)) ??
    "home";
  const active_theme_color = phase_color_by_name[active_phase];

  breadcrumb_node.dataset.phase = active_phase;
  breadcrumb_node.style.setProperty("--crumb_theme_color", active_theme_color);

  // The current page is the LAST crumb in the trail, by position — the page
  // controls the trail and the leaf is always "where you are." Match by
  // position, not by href prefix: the leaf is often hrefless (a <span>), and
  // prefix-matching mis-lights at 2+ depth. Mirrors breadcrumbs.astro.
  const crumb_item_nodes = /** @type {NodeListOf<HTMLElement>} */ (
    breadcrumb_node.querySelectorAll("ol > li")
  );
  const last_index = crumb_item_nodes.length - 1;

  crumb_item_nodes.forEach((crumb_item_node, crumb_index) => {
    const is_current = crumb_index === last_index;
    crumb_item_node.classList.toggle("sol__is_current", is_current);
    crumb_item_node.classList.toggle("sol__is_parent", !is_current);

    const crumb_label_node = crumb_item_node.querySelector("a, span");
    if (crumb_label_node instanceof HTMLElement) {
      crumb_label_node.classList.toggle("sol__is_current_link", is_current);
    }
  });

  last_applied_pathname = normalized_pathname;
};

apply_constant_crumb_state(window.location.pathname);

if (!window_any.__breadcrumb_htmx_before_request_bound) {
  document.body?.addEventListener("htmx:beforeRequest", (event) => {
    const request_pathname = derive_request_pathname(event);

    if (!request_pathname) {
      return;
    }

    const current_pathname = normalize_pathname(window.location.pathname);

    if (request_pathname === current_pathname) {
      return;
    }

    apply_constant_crumb_state(request_pathname);
  });

  window_any.__breadcrumb_htmx_before_request_bound = true;
}

if (!window_any.__breadcrumb_htmx_after_swap_bound) {
  document.body?.addEventListener("htmx:afterSwap", (event) => {
    const htmx_event = /** @type {CustomEvent} */ (event);
    const swap_target = htmx_event.detail?.target;

    if (!is_route_swap_target(swap_target)) {
      return;
    }

    last_applied_pathname = null;
    apply_constant_crumb_state(derive_request_pathname(event) ?? window.location.pathname);
  });

  window_any.__breadcrumb_htmx_after_swap_bound = true;
}

if (!window_any.__breadcrumb_route_listener_bound) {
  window.addEventListener("popstate", () => {
    apply_constant_crumb_state(window.location.pathname);
  });

  window_any.__breadcrumb_route_listener_bound = true;
}

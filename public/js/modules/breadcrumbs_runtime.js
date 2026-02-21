const window_any = /** @type {any} */ (window);
let last_applied_pathname = null;
const phase_color_by_name = {
  nigredo: "var(--color-nigredo)",
  albedo: "var(--color-albedo)",
  citrinitas: "var(--color-citrinitas)",
  rubedo: "var(--color-rubedo)",
  codex: "var(--color-ctp-lavender)",
};

/**
 * @param {string} pathname_value
 */
const normalize_pathname = (pathname_value) => {
  const trimmed_pathname = pathname_value.replace(/\/+$/, "");

  return trimmed_pathname || "/";
};

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
  const breadcrumb_node = document.querySelector("#breadcrumbers_xd");

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
    path_segments[0] in phase_color_by_name ? path_segments[0] : "nigredo";
  const active_theme_color = phase_color_by_name[active_phase];

  breadcrumb_node.dataset.phase = active_phase;
  breadcrumb_node.style.setProperty("--crumb_theme_color", active_theme_color);

  const crumb_link_nodes = /** @type {NodeListOf<HTMLAnchorElement>} */ (
    breadcrumb_node.querySelectorAll("a[href]")
  );

  let current_link_node = null;
  let current_link_length = -1;

  crumb_link_nodes.forEach((crumb_link_node) => {
    const link_pathname = normalize_pathname(
      new URL(crumb_link_node.href, window.location.origin).pathname,
    );
    const is_exact_match = normalized_pathname === link_pathname;
    const is_parent_match =
      link_pathname !== "/" &&
      normalized_pathname.startsWith(`${link_pathname}/`);
    const is_root_match = link_pathname === "/" && normalized_pathname === "/";

    if (!(is_exact_match || is_parent_match || is_root_match)) {
      return;
    }

    if (link_pathname.length <= current_link_length) {
      return;
    }

    current_link_node = crumb_link_node;
    current_link_length = link_pathname.length;
  });

  crumb_link_nodes.forEach((crumb_link_node) => {
    const crumb_item_node = crumb_link_node.closest("li");

    if (!(crumb_item_node instanceof HTMLElement)) {
      return;
    }

    const is_current = crumb_link_node === current_link_node;
    crumb_item_node.classList.toggle("is-current", is_current);
    crumb_item_node.classList.toggle("is-parent", !is_current);
    crumb_link_node.classList.toggle("is-current-link", is_current);
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

    if (!(swap_target instanceof HTMLElement) || swap_target.id !== "content") {
      return;
    }

    apply_constant_crumb_state(window.location.pathname);
  });

  window_any.__breadcrumb_htmx_after_swap_bound = true;
}

if (!window_any.__breadcrumb_route_listener_bound) {
  window.addEventListener("popstate", () => {
    apply_constant_crumb_state(window.location.pathname);
  });

  window_any.__breadcrumb_route_listener_bound = true;
}

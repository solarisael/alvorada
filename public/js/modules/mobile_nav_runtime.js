const window_any = /** @type {any} */ (window);
let last_applied_pathname = null;

/**
 * @param {string} pathname_value
 */
const normalize_pathname = (pathname_value) => {
  const trimmed_pathname = pathname_value.replace(/\/+$/, "");

  return trimmed_pathname || "/";
};

/**
 * @param {string} current_pathname
 * @param {string} target_pathname
 */
const is_section_path_active = (current_pathname, target_pathname) => {
  if (target_pathname === "/") {
    return current_pathname === "/";
  }

  return (
    current_pathname === target_pathname ||
    current_pathname.startsWith(`${target_pathname}/`)
  );
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
 * @param {string | null} [pathname_override=null]
 */
const apply_mobile_route_active_state = (pathname_override = null) => {
  const nav_node = document.querySelector("#mobile-nav");

  if (!(nav_node instanceof HTMLElement)) {
    return;
  }

  const current_pathname = normalize_pathname(
    pathname_override ?? window.location.pathname,
  );

  if (last_applied_pathname === current_pathname) {
    return;
  }

  const pill_nodes = /** @type {NodeListOf<HTMLAnchorElement>} */ (
    nav_node.querySelectorAll("[data-mobile-nav-pill]")
  );

  pill_nodes.forEach((pill_node) => {
    const target_pathname = normalize_pathname(
      new URL(pill_node.href, window.location.origin).pathname,
    );
    const is_exact_match = current_pathname === target_pathname;
    const is_active = is_section_path_active(current_pathname, target_pathname);

    pill_node.classList.toggle("is-route-active", is_active);

    if (is_exact_match) {
      pill_node.setAttribute("aria-current", "page");
      return;
    }

    pill_node.removeAttribute("aria-current");
  });

  const home_node = nav_node.querySelector("[data-mobile-home]");

  if (home_node instanceof HTMLAnchorElement) {
    const is_home_active = current_pathname === "/";
    home_node.classList.toggle("is-route-active", is_home_active);

    if (is_home_active) {
      home_node.setAttribute("aria-current", "page");
    } else {
      home_node.removeAttribute("aria-current");
    }
  }

  last_applied_pathname = current_pathname;
};

apply_mobile_route_active_state();

if (!window_any.__mobile_nav_route_listener_bound) {
  window.addEventListener("popstate", () => {
    apply_mobile_route_active_state();
  });

  window_any.__mobile_nav_route_listener_bound = true;
}

if (!window_any.__mobile_nav_before_request_bound) {
  document.body?.addEventListener("htmx:beforeRequest", (event) => {
    const request_pathname = derive_request_pathname(event);

    if (!request_pathname) {
      return;
    }

    const current_pathname = normalize_pathname(window.location.pathname);

    if (request_pathname === current_pathname) {
      return;
    }

    apply_mobile_route_active_state(request_pathname);
  });

  window_any.__mobile_nav_before_request_bound = true;
}

if (!window_any.__mobile_nav_after_swap_bound) {
  document.body?.addEventListener("htmx:afterSwap", (event) => {
    const htmx_event = /** @type {CustomEvent} */ (event);
    const swap_target = htmx_event.detail?.target;

    if (!(swap_target instanceof HTMLElement) || swap_target.id !== "content") {
      return;
    }

    apply_mobile_route_active_state();
  });

  window_any.__mobile_nav_after_swap_bound = true;
}

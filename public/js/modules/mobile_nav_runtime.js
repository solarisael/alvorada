import {
  derive_request_pathname,
  is_route_swap_target,
  is_section_path_active,
  normalize_pathname,
} from "./htmx_route_lifecycle.js";

const window_any = /** @type {any} */ (window);
let last_applied_pathname = null;

/**
 * @param {string | null} [pathname_override=null]
 */
const apply_mobile_route_active_state = (pathname_override = null) => {
  const nav_node = document.querySelector("#sol_mobile_nav");

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
    const is_home_shortcut = pill_node.dataset.phase === "home";
    const is_active =
      !is_home_shortcut &&
      is_section_path_active(current_pathname, target_pathname);

    pill_node.classList.toggle("sol__is_route_active", is_active);
    pill_node.classList.toggle("is-route-current", is_exact_match);
    if (is_exact_match) {
      pill_node.setAttribute("aria-current", "page");
    } else {
      pill_node.removeAttribute("aria-current");
    }
  });

  const home_node = nav_node.querySelector("[data-mobile-home]");

  if (home_node instanceof HTMLAnchorElement) {
    const home_target_pathname = normalize_pathname(
      new URL(home_node.href, window.location.origin).pathname,
    );
    const is_home_active = current_pathname === home_target_pathname;
    home_node.classList.toggle("sol__is_route_active", is_home_active);
    home_node.classList.toggle("is-route-current", is_home_active);
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

if (!window_any.__mobile_nav_after_swap_bound) {
  document.body?.addEventListener("htmx:afterSwap", (event) => {
    const htmx_event = /** @type {CustomEvent} */ (event);
    const swap_target = htmx_event.detail?.target;

    if (!is_route_swap_target(swap_target)) {
      return;
    }

    last_applied_pathname = null;
    apply_mobile_route_active_state(
      derive_request_pathname(event) ?? window.location.pathname,
    );
  });

  window_any.__mobile_nav_after_swap_bound = true;
}

import {
  is_section_path_active,
  normalize_pathname,
} from "../htmx_route_lifecycle.js";

let last_applied_route_pathname = null;

export const invalidate_side_menu_route_state = () => {
  last_applied_route_pathname = null;
};

const set_route_current = (route_node, is_exact_match, is_active) => {
  route_node.dataset.routeActive = is_active ? "true" : "false";
  if (is_exact_match) {
    route_node.setAttribute("aria-current", "page");
  } else if (is_active) {
    route_node.setAttribute("aria-current", "location");
  } else {
    route_node.removeAttribute("aria-current");
  }
};

const apply_route_link_state = (route_node, current_pathname) => {
  const target_pathname = normalize_pathname(
    new URL(route_node.href, window.location.origin).pathname,
  );
  const is_exact_match = current_pathname === target_pathname;
  const is_active =
    route_node.dataset.phase === "home"
      ? is_exact_match
      : is_section_path_active(current_pathname, target_pathname);
  set_route_current(route_node, is_exact_match, is_active);
  return is_active ? target_pathname.length : -1;
};

const apply_route_links = (menu_node, current_pathname) => {
  let active_route_node = null;
  let active_route_length = -1;
  for (const route_node of menu_node.querySelectorAll(
    "[data-side-menu-route]",
  )) {
    if (!(route_node instanceof HTMLAnchorElement)) {
      continue;
    }
    const route_length = apply_route_link_state(route_node, current_pathname);
    if (route_length > active_route_length) {
      active_route_node = route_node;
      active_route_length = route_length;
    }
  }
  return active_route_node;
};

const set_current_place_label = (current_place_node, active_route_node) => {
  if (current_place_node instanceof HTMLElement) {
    current_place_node.textContent =
      active_route_node?.dataset.navLabel ?? "hearth";
  }
};

const set_current_place_phase = (current_place_shell, active_route_node) => {
  if (current_place_shell instanceof HTMLElement) {
    current_place_shell.dataset.phase =
      active_route_node?.dataset.phase ?? "home";
  }
};

/** @param {string | null} [pathname_override=null] */
export const apply_side_menu_route_state = (pathname_override = null) => {
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
  const active_route_node = apply_route_links(menu_node, current_pathname);
  const current_place_node = menu_node.querySelector(
    "[data-side-menu-current]",
  );
  const current_place_shell = current_place_node?.closest(
    ".sol__side_menu_current",
  );
  set_current_place_label(current_place_node, active_route_node);
  set_current_place_phase(current_place_shell, active_route_node);
  last_applied_route_pathname = current_pathname;
};

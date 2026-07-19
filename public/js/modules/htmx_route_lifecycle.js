/**
 * Shared HTMX route-lifecycle helpers.
 *
 * The site shell swaps the outer <container> for page navigation, while a few
 * inner flows target #sol_content or deeper fragments. Keep route detection in
 * one place so nav, mobile nav, and breadcrumbs cannot drift apart again.
 */

export const normalize_pathname = (pathname_value) => {
  const trimmed_pathname = String(pathname_value).replace(/\/+$/, "");

  return trimmed_pathname || "/";
};

export const is_route_swap_target = (target_node) =>
  target_node instanceof HTMLElement &&
  target_node.matches("container, #sol_content, #sol_page_shell");

export const derive_request_pathname = (event) => {
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

export const is_section_path_active = (current_pathname, target_pathname) => {
  if (target_pathname === "/") {
    return current_pathname === "/";
  }

  return (
    current_pathname === target_pathname ||
    current_pathname.startsWith(`${target_pathname}/`)
  );
};

/**
 * The htmx preload extension emits htmx:beforeRequest for cache warmups.
 * Preload requests do not swap content, so route-active state must ignore them.
 */
export const is_preload_request = (event) => {
  const detail_any = /** @type {any} */ (
    /** @type {CustomEvent} */ (event).detail
  );

  return detail_any?.requestConfig?.headers?.["HX-Preloaded"] === "true";
};

import { is_route_swap_target } from "./htmx_route_lifecycle.js";

const route_status_selector = "#sol_route_status";
const route_focus_selector = "#sol_page_shell h1, #sol_main_reading_container";

const route_heading_text = (focus_node) => {
  if (!(focus_node instanceof HTMLElement) || !focus_node.matches("h1")) {
    return "page";
  }
  return focus_node.textContent?.trim() || "page";
};

const announce_and_focus_route = () => {
  const focus_node = document.querySelector(route_focus_selector);
  const status_node = document.querySelector(route_status_selector);

  if (focus_node instanceof HTMLElement) {
    focus_node.setAttribute("tabindex", "-1");
    focus_node.focus({ preventScroll: true });
  }

  if (status_node instanceof HTMLElement) {
    status_node.textContent = `Loaded ${route_heading_text(focus_node)}.`;
  }
};

const install_route_accessibility = () => {
  if (globalThis.__solarisael_route_accessibility_installed) {
    return false;
  }

  document.body?.addEventListener("htmx:afterSettle", (event) => {
    const target_node = event.detail?.target ?? event.target;
    if (!is_route_swap_target(target_node)) {
      return;
    }

    requestAnimationFrame(announce_and_focus_route);
  });

  globalThis.__solarisael_route_accessibility_installed = true;
  return true;
};

export { announce_and_focus_route, install_route_accessibility };

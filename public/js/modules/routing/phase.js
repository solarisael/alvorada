import { is_route_swap_target } from "../htmx_route_lifecycle.js";

const sync_route_phase = () => {
  const container = document.querySelector("#sol_page_shell container");
  document.body.dataset.phase = container?.getAttribute("data-phase") || "home";
};

const sync_swapped_phase = (event) => {
  const target = event.detail?.target ?? event.target;
  if (is_route_swap_target(target)) {
    sync_route_phase();
  }
};

const install_route_phase = () => {
  if (globalThis.__solarisael_route_phase_installed) {
    return false;
  }

  sync_route_phase();
  document.body.addEventListener("htmx:afterSwap", sync_swapped_phase);
  document.body.addEventListener("htmx:historyRestore", sync_route_phase);
  window.addEventListener("popstate", () => {
    requestAnimationFrame(sync_route_phase);
  });
  globalThis.__solarisael_route_phase_installed = true;
  return true;
};

export { install_route_phase };

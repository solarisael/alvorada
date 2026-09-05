import { init_rubedo_constellation } from "./rubedo/constellation_runtime.js";

const window_any = /** @type {any} */ (globalThis);

init_rubedo_constellation();

if (!window_any.__rubedo_constellation_after_swap_bound) {
  document.body?.addEventListener("htmx:afterSwap", () => {
    init_rubedo_constellation();
  });
  document.body?.addEventListener("htmx:historyRestore", () => {
    init_rubedo_constellation();
  });

  window_any.__rubedo_constellation_after_swap_bound = true;
}

export { init_rubedo_constellation };

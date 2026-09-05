import {
  materializeRichInlineLineRange,
  prepareRichInline,
  walkRichInlineLineRanges,
} from "@chenglou/pretext/rich-inline";
import { extract_pretext_source } from "./pretext/source.js";
import { layout_shaped_pretext_lines } from "./pretext/shaped_layout.js";
import { render_pretext_lines } from "./pretext/render.js";
export { split_text_for_pretext_items } from "./pretext/source.js";
export { compute_justified_gap_extra } from "./pretext/render.js";

const SOL_PRETEXT_SELECTOR = '[data-sol-pretext="justify"]';
const source_cache = new WeakMap();
const observed_roots = new WeakSet();
let resize_observer = null;

const is_browser = () =>
  typeof document !== "undefined" && typeof window !== "undefined";

export const reset_pretext_source = (root) => {
  source_cache.delete(root);
};

export const layout_pretext_root = (root) => {
  if (!(root instanceof HTMLElement)) {
    return false;
  }

  const width = root.clientWidth;

  if (!Number.isFinite(width) || width <= 0) {
    return false;
  }

  let source = source_cache.get(root);

  if (!source) {
    source = extract_pretext_source(root);
    source_cache.set(root, source);
  }

  if (!source.items.length) {
    return false;
  }

  const prepared = prepareRichInline(source.items);
  const shape = root.dataset.solPretextShape ?? null;
  const lines = shape
    ? layout_shaped_pretext_lines({ prepared, width, shape })
    : (() => {
        const ranges = [];
        walkRichInlineLineRanges(prepared, width, (range) =>
          ranges.push(range),
        );
        return ranges.map((range) =>
          materializeRichInlineLineRange(prepared, range),
        );
      })();

  render_pretext_lines({
    root,
    lines,
    metadata: source.metadata,
    width,
    shape,
  });

  return true;
};

const ensure_resize_observer = () => {
  if (resize_observer || typeof ResizeObserver === "undefined") {
    return resize_observer;
  }

  resize_observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      layout_pretext_root(entry.target);
    }
  });

  return resize_observer;
};

export const hydrate_pretext_justification = (root = document) => {
  if (!root || typeof root.querySelectorAll !== "function") {
    return;
  }

  const roots = Array.from(root.querySelectorAll(SOL_PRETEXT_SELECTOR));

  if (root instanceof HTMLElement && root.matches(SOL_PRETEXT_SELECTOR)) {
    roots.unshift(root);
  }

  const observer = ensure_resize_observer();

  for (const pretext_root of roots) {
    layout_pretext_root(pretext_root);

    if (observer && !observed_roots.has(pretext_root)) {
      observer.observe(pretext_root);
      observed_roots.add(pretext_root);
    }
  }
};

const hydrate_when_ready = (root = document) => {
  const font_ready = document.fonts?.ready ?? Promise.resolve();
  font_ready.then(() => hydrate_pretext_justification(root));
};

if (is_browser()) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => hydrate_when_ready());
  } else {
    hydrate_when_ready();
  }

  document.addEventListener("htmx:afterSwap", (event) => {
    const swap_target = event?.detail?.target;
    hydrate_when_ready(
      swap_target instanceof HTMLElement ? swap_target : document,
    );
  });
}

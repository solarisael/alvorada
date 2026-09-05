import { create_constellation_renderer } from "./constellation_renderers.js";
import { bind_constellation_input_controller } from "./constellation_input_controller.js";
import { build_constellation_payload_from_json } from "./constellation_payload.js";
import {
  claim_constellation,
  retire_disconnected_constellations,
} from "./constellation_lifetime.js";
import {
  create_storage_key,
  create_view_state,
  get_store,
} from "./constellation_viewport.js";

const timeline_cache = {};

const fetch_timeline_book_data = async (book_slug, data_href, signal) => {
  if (timeline_cache[book_slug]) {
    return timeline_cache[book_slug];
  }

  try {
    const response = await fetch(data_href, { signal });

    if (!response.ok) {
      console.warn(
        `[sol__rubedo_constellation] Failed to fetch ${data_href}: ${response.status}`,
      );

      return null;
    }

    const book_data = await response.json();
    signal?.throwIfAborted();
    timeline_cache[book_slug] = book_data;

    return timeline_cache[book_slug];
  } catch (fetch_error) {
    if (signal?.aborted) {
      return null;
    }
    console.warn(
      `[sol__rubedo_constellation] Fetch error for ${data_href}:`,
      fetch_error,
    );

    return null;
  }
};

const base_path_from_data_href = (data_href) => {
  return data_href.replace(/\/rubedo\/data\/[^/]+\.json$/, "");
};

const bind_constellation = async (interactive_section, binding) => {
  const book_slug = interactive_section.dataset.bookSlug ?? "";
  const data_href = interactive_section.dataset.timelineDataHref ?? "";

  if (!book_slug || !data_href) {
    return null;
  }

  const book_data = await fetch_timeline_book_data(
    book_slug,
    data_href,
    binding.signal,
  );

  if (!book_data || !binding.is_active()) {
    return null;
  }

  const base_path = base_path_from_data_href(data_href);
  const payload = build_constellation_payload_from_json(
    book_data,
    base_path,
    null,
  );
  const root_node = interactive_section;
  const canvas = root_node.querySelector("#sol_rubedo_timeline_canvas");

  if (!(canvas instanceof HTMLCanvasElement)) {
    return null;
  }

  const store = get_store();
  const storage_key = create_storage_key(root_node);
  const view_state = {
    ...create_view_state(payload),
    ...(store[storage_key] || {}),
  };
  const renderer = create_constellation_renderer(canvas, payload, view_state);

  if (!renderer) {
    return null;
  }

  binding.set_renderer(renderer);
  return await bind_constellation_input_controller({
    root_node,
    canvas,
    payload,
    renderer,
    view_state,
    store,
    storage_key,
    book_data,
    book_slug,
    base_path,
    signal: binding.signal,
  });
};

const init_constellation = async (interactive_section) => {
  const binding = claim_constellation(interactive_section);
  if (!binding) {
    return;
  }
  let disposer = null;
  try {
    disposer = await bind_constellation(interactive_section, binding);
  } finally {
    if (!disposer) {
      binding.dispose();
    }
  }
};

const init_rubedo_constellation = () => {
  if (typeof document === "undefined") {
    return;
  }
  retire_disconnected_constellations();

  const interactive_sections = document.querySelectorAll(
    "#sol_rubedo_timeline_interactive[data-timeline-data-href]",
  );

  interactive_sections.forEach((section) => {
    init_constellation(section);
  });
};

export {
  base_path_from_data_href,
  fetch_timeline_book_data,
  init_constellation,
  init_rubedo_constellation,
  timeline_cache,
};

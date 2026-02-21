const window_any = /** @type {any} */ (window);

const PANEL_SELECTOR = "#rubedo_timeline_state_panel";
const CONTENT_SELECTOR = "#rubedo_timeline_state_content";
const MAP_SELECTOR = "#rubedo_constellation_map";

const build_fragment_url = ({
  fragment_route_root = "",
  chapter_id = "",
  thread_key = "cinza",
  thread_modifier = "core",
} = {}) => {
  return `${fragment_route_root}/${encodeURIComponent(chapter_id)}/${encodeURIComponent(thread_key)}/${encodeURIComponent(thread_modifier)}`;
};

const read_shell_state = () => {
  const shell_node = document.querySelector("[data-rubedo-timeline-shell]");

  if (!(shell_node instanceof HTMLElement)) {
    return null;
  }

  const fragment_route_root =
    shell_node.dataset.fragmentRouteRoot?.trim() ?? "";
  const default_chapter_id = shell_node.dataset.defaultChapterId?.trim() ?? "";
  const default_thread_key =
    shell_node.dataset.defaultThreadKey?.trim() ?? "cinza";
  const default_thread_modifier =
    shell_node.dataset.defaultThreadModifier?.trim() ?? "core";

  if (!fragment_route_root || !default_chapter_id) {
    return null;
  }

  return {
    fragment_route_root,
    default_chapter_id,
    default_thread_key,
    default_thread_modifier,
  };
};

const resolve_state_from_panel = (shell_state) => {
  const chapter_select = document.querySelector(
    `${CONTENT_SELECTOR} select[data-role="chapter"]`,
  );
  const thread_select = document.querySelector(
    `${CONTENT_SELECTOR} select[data-role="thread_key"]`,
  );
  const modifier_select = document.querySelector(
    `${CONTENT_SELECTOR} select[data-role="thread_modifier"]`,
  );

  const state_marker = document.querySelector(
    `${CONTENT_SELECTOR} [data-current-chapter-id]`,
  );

  const panel_chapter_id =
    state_marker instanceof HTMLElement
      ? (state_marker.dataset.currentChapterId?.trim() ?? "")
      : "";
  const panel_thread_key =
    state_marker instanceof HTMLElement
      ? (state_marker.dataset.currentThreadKey?.trim() ?? "")
      : "";
  const panel_thread_modifier =
    state_marker instanceof HTMLElement
      ? (state_marker.dataset.currentThreadModifier?.trim() ?? "")
      : "";

  return {
    chapter_id:
      (chapter_select instanceof HTMLSelectElement
        ? chapter_select.value
        : panel_chapter_id) || shell_state.default_chapter_id,
    thread_key:
      (thread_select instanceof HTMLSelectElement
        ? thread_select.value
        : panel_thread_key) || shell_state.default_thread_key,
    thread_modifier:
      (modifier_select instanceof HTMLSelectElement
        ? modifier_select.value
        : panel_thread_modifier) || shell_state.default_thread_modifier,
  };
};

const apply_active_map_state = ({ chapter_id = "", thread_key = "cinza" }) => {
  const map_node = document.querySelector(MAP_SELECTOR);

  if (map_node instanceof HTMLElement) {
    map_node.dataset.activeThreadKey = thread_key;
  }

  const map_links = document.querySelectorAll(
    ".rubedo-constellation-node-link[data-chapter-id]",
  );

  map_links.forEach((map_link_node) => {
    if (!(map_link_node instanceof HTMLElement)) {
      return;
    }

    if (map_link_node.dataset.chapterId === chapter_id) {
      map_link_node.classList.add("is-current-node");
      return;
    }

    map_link_node.classList.remove("is-current-node");
  });
};

const sync_map_link_requests = (shell_state, state) => {
  const map_links = document.querySelectorAll(
    ".rubedo-constellation-node-link[data-chapter-id]",
  );

  map_links.forEach((map_link_node) => {
    if (!(map_link_node instanceof Element)) {
      return;
    }

    const chapter_id = map_link_node.dataset.chapterId ?? "";

    if (!chapter_id) {
      return;
    }

    map_link_node.setAttribute(
      "hx-get",
      build_fragment_url({
        fragment_route_root: shell_state.fragment_route_root,
        chapter_id,
        thread_key: state.thread_key,
        thread_modifier: state.thread_modifier,
      }),
    );
    map_link_node.setAttribute("hx-target", CONTENT_SELECTOR);
    map_link_node.setAttribute("hx-swap", "innerHTML");
    map_link_node.setAttribute("hx-push-url", "false");
    map_link_node.setAttribute(
      "hx-select",
      ".rubedo-timeline-state-panel-body",
    );
  });
};

const request_timeline_panel = (shell_state, state) => {
  const htmx_any = window_any.htmx;

  if (!htmx_any || typeof htmx_any.ajax !== "function") {
    return;
  }

  const fragment_url = build_fragment_url({
    fragment_route_root: shell_state.fragment_route_root,
    chapter_id: state.chapter_id,
    thread_key: state.thread_key,
    thread_modifier: state.thread_modifier,
  });

  htmx_any.ajax("GET", fragment_url, {
    source: document.querySelector(PANEL_SELECTOR),
    target: CONTENT_SELECTOR,
    swap: "innerHTML",
    select: ".rubedo-timeline-state-panel-body",
  });

  apply_active_map_state(state);
};

const handle_controls_change = (event) => {
  const changed_node = event.target;

  if (!(changed_node instanceof HTMLSelectElement)) {
    return;
  }

  if (
    !changed_node.closest(`${CONTENT_SELECTOR} [data-rubedo-timeline-controls]`)
  ) {
    return;
  }

  const shell_state = read_shell_state();

  if (!shell_state) {
    return;
  }

  const next_state = resolve_state_from_panel(shell_state);

  if (changed_node.dataset.role === "thread_key") {
    next_state.thread_modifier = shell_state.default_thread_modifier;
  }

  sync_map_link_requests(shell_state, next_state);
  request_timeline_panel(shell_state, next_state);
};

const bootstrap_timeline = () => {
  const shell_state = read_shell_state();

  if (!shell_state) {
    return;
  }

  const current_state = resolve_state_from_panel(shell_state);

  apply_active_map_state(current_state);
  sync_map_link_requests(shell_state, current_state);
};

bootstrap_timeline();

if (!window_any.__rubedo_timeline_controls_bound) {
  document.addEventListener("change", handle_controls_change);
  window_any.__rubedo_timeline_controls_bound = true;
}

if (!window_any.__rubedo_timeline_after_swap_bound) {
  document.body?.addEventListener("htmx:afterSwap", (event) => {
    const htmx_event = /** @type {CustomEvent} */ (event);
    const swap_target = htmx_event.detail?.target;

    if (swap_target instanceof HTMLElement && swap_target.id === "content") {
      bootstrap_timeline();
      return;
    }

    if (
      swap_target instanceof HTMLElement &&
      swap_target.id === "rubedo_timeline_state_content"
    ) {
      const shell_state = read_shell_state();

      if (!shell_state) {
        return;
      }

      const current_state = resolve_state_from_panel(shell_state);

      apply_active_map_state(current_state);
      sync_map_link_requests(shell_state, current_state);
    }
  });

  window_any.__rubedo_timeline_after_swap_bound = true;
}

if (!window_any.__rubedo_timeline_history_guard_bound) {
  document.body?.addEventListener("htmx:beforeRequest", (event) => {
    const htmx_event = /** @type {CustomEvent} */ (event);
    const detail_any = /** @type {any} */ (htmx_event.detail);
    const request_path = detail_any?.requestConfig?.path;

    if (typeof request_path !== "string") {
      return;
    }

    if (!request_path.includes("/timeline/fragment/")) {
      return;
    }

    if (detail_any?.requestConfig) {
      detail_any.requestConfig.pushURL = false;
      detail_any.requestConfig.replaceURL = false;
    }
  });

  document.body?.addEventListener("htmx:beforeHistoryUpdate", (event) => {
    const htmx_event = /** @type {CustomEvent} */ (event);
    const detail_any = /** @type {any} */ (htmx_event.detail);
    const history_path =
      detail_any?.history?.path ??
      detail_any?.path ??
      detail_any?.requestConfig?.path ??
      "";

    if (typeof history_path !== "string") {
      return;
    }

    if (!history_path.includes("/timeline/fragment/")) {
      return;
    }

    htmx_event.preventDefault();
  });

  window_any.__rubedo_timeline_history_guard_bound = true;
}

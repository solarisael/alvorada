export function filter_entries(entries, active_states) {
  if (!active_states || active_states.size === 0) return entries;
  return entries.filter((entry) =>
    entry.states.some((state) => active_states.has(state)),
  );
}

export function entry_matches_states(entry_states, active_states) {
  if (!active_states || active_states.size === 0) return true;
  return entry_states.some((state) => active_states.has(state));
}

export function toggle_container_states(active_states, container_states) {
  let all_active = container_states.length > 0;
  for (const state of container_states) {
    if (!active_states.has(state)) {
      all_active = false;
      break;
    }
  }

  for (const state of container_states) {
    if (all_active) {
      active_states.delete(state);
    } else {
      active_states.add(state);
    }
  }

  return !all_active;
}

export function update_status({
  count_label,
  filter_sum,
  clear_btn,
  active_states,
  visible_count,
  total_count,
}) {
  if (count_label) {
    count_label.textContent =
      active_states.size > 0
        ? `${visible_count} / ${total_count}`
        : `${total_count}`;
  }

  if (filter_sum) {
    if (active_states.size > 0) {
      filter_sum.textContent = `— ${[...active_states].join(", ")}`;
      filter_sum.hidden = false;
    } else {
      filter_sum.textContent = "";
      filter_sum.hidden = true;
    }
  }

  if (clear_btn) clear_btn.hidden = active_states.size === 0;
}

export function create_filter_controls({
  filter_rail,
  filter_toggle,
  clear_btn,
  contract,
  active_states,
  apply_filters,
}) {
  function read_container_states(button) {
    const group = button.closest(contract.filter_group_selector);
    return Array.from(
      group?.querySelectorAll("[data-filter-state]") ?? [],
      (state_button) => state_button.dataset.filterState,
    );
  }

  function container_is_active(button) {
    const states = read_container_states(button);
    return (
      states.length > 0 && states.every((state) => active_states.has(state))
    );
  }

  function sync_filter_controls() {
    if (!filter_rail) return;

    for (const button of filter_rail.querySelectorAll("[data-filter-state]")) {
      const is_active = active_states.has(button.dataset.filterState);
      button.dataset.active = is_active ? "true" : "false";
      button.setAttribute("aria-pressed", is_active ? "true" : "false");
    }

    for (const button of filter_rail.querySelectorAll(
      "[data-filter-container]",
    )) {
      const all_active = container_is_active(button);
      button.dataset.active = all_active ? "true" : "false";
      button.setAttribute("aria-pressed", all_active ? "true" : "false");
    }
  }
  function sync_filter_disclosure() {
    if (!filter_rail || !filter_toggle) return;

    const is_collapsed = filter_rail.dataset.mobileCollapsed !== "false";
    filter_toggle.setAttribute(
      "aria-expanded",
      is_collapsed ? "false" : "true",
    );
    filter_toggle.textContent = is_collapsed ? "show filters" : "hide filters";
  }

  function on_filter_toggle_click() {
    if (!filter_rail) return;

    const is_collapsed = filter_rail.dataset.mobileCollapsed !== "false";
    filter_rail.dataset.mobileCollapsed = is_collapsed ? "false" : "true";
    sync_filter_disclosure();
  }

  function on_filter_click(event) {
    const event_target = event.target;
    const container_button = event_target?.closest?.("[data-filter-container]");
    if (container_button) {
      const container_states = read_container_states(container_button);
      toggle_container_states(active_states, container_states);
      sync_filter_controls();
      apply_filters();
      return;
    }

    const button = event_target?.closest?.("[data-filter-state]");
    if (!button) return;

    const state = button.dataset.filterState;
    if (active_states.has(state)) {
      active_states.delete(state);
    } else {
      active_states.add(state);
    }

    sync_filter_controls();
    apply_filters();
  }

  function on_clear_click() {
    active_states.clear();
    sync_filter_controls();
    apply_filters();
  }

  return {
    sync_filter_controls,
    sync_filter_disclosure,
    bind() {
      filter_rail?.addEventListener("click", on_filter_click);
      clear_btn?.addEventListener("click", on_clear_click);
      filter_toggle?.addEventListener("click", on_filter_toggle_click);
    },
    dispose() {
      filter_rail?.removeEventListener("click", on_filter_click);
      clear_btn?.removeEventListener("click", on_clear_click);
      filter_toggle?.removeEventListener("click", on_filter_toggle_click);
    },
  };
}

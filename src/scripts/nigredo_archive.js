import {
  entry_matches_states,
  filter_entries,
  init_archive,
  toggle_container_states,
} from "./archive_controller.js";

const NIGREDO_ARCHIVE_CONTRACT = Object.freeze({
  phase: "nigredo",
  root_selector: "[data-nigredo-archive]",
  index_id: "sol_nigredo_archive_index",
  bound_property: "__nigredo_archive_bound",
  filter_rail_selector: "[data-nigredo-filter-rail]",
  filter_clear_selector: "[data-nigredo-filter-clear]",
  filter_summary_selector: "[data-nigredo-filter-summary]",
  count_selector: "[data-nigredo-count]",
  scroll_selector: "[data-nigredo-scroll]",
  inner_selector: "[data-nigredo-inner]",
  list_selector: "[data-nigredo-list]",
  measure_list_class: "sol__nigredo_list sol__nigredo_measure_list",
  filter_group_selector: ".sol__nigredo_filter_group",
  entry_template_selector: "[data-nigredo-entry-template]",
  entry_selector: "[data-nigredo-entry]",
  preview_selector: "[data-nigredo-preview]",
  full_selector: "[data-nigredo-full]",
  expand_selector: "[data-nigredo-expand]",
});

export function init_nigredo_archive() {
  return init_archive(NIGREDO_ARCHIVE_CONTRACT);
}

export {
  entry_matches_states,
  filter_entries,
  toggle_container_states,
  NIGREDO_ARCHIVE_CONTRACT,
};

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", init_nigredo_archive, {
    once: true,
  });
  document.addEventListener("htmx:afterSettle", init_nigredo_archive);
}

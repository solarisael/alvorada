import {
  entry_matches_states,
  filter_entries,
  init_archive,
  toggle_container_states,
} from "./archive_controller.js";

const ALBEDO_ARCHIVE_CONTRACT = Object.freeze({
  phase: "albedo",
  root_selector: "[data-albedo-archive]",
  index_id: "sol_albedo_archive_index",
  bound_property: "__albedo_archive_bound",
  filter_rail_selector: "[data-albedo-filter-rail]",
  filter_toggle_selector: "[data-albedo-filter-toggle]",
  filter_clear_selector: "[data-albedo-filter-clear]",
  filter_summary_selector: "[data-albedo-filter-summary]",
  count_selector: "[data-albedo-count]",
  scroll_selector: "[data-albedo-scroll]",
  inner_selector: "[data-albedo-inner]",
  list_selector: "[data-albedo-list]",
  measure_list_class: "sol__albedo_list sol__albedo_measure_list",
  filter_group_selector: ".sol__albedo_filter_group",
  entry_template_selector: "[data-albedo-entry-template]",
  entry_selector: "[data-albedo-entry]",
  preview_selector: "[data-albedo-preview]",
  full_selector: "[data-albedo-full]",
  expand_selector: "[data-albedo-expand]",
});

export function init_albedo_archive() {
  return init_archive(ALBEDO_ARCHIVE_CONTRACT);
}

export {
  entry_matches_states,
  filter_entries,
  toggle_container_states,
  ALBEDO_ARCHIVE_CONTRACT,
};

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", init_albedo_archive, {
    once: true,
  });
  document.addEventListener("htmx:afterSettle", init_albedo_archive);
}

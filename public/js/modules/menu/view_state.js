import { SITE_MENU_VIEW_DEFAULT, get_safe_option } from "./preferences.js";

const set_view_page_state = (view_node, index, active_index) => {
  const is_active = index === active_index;
  view_node.dataset.viewPosition =
    index < active_index ? "before" : index > active_index ? "after" : "active";
  view_node.setAttribute("aria-hidden", is_active ? "false" : "true");
  view_node.inert = !is_active;
};

const set_menu_trigger_state = (trigger_node, is_open) => {
  if (!(trigger_node instanceof HTMLButtonElement)) return;
  trigger_node.setAttribute("aria-expanded", is_open ? "true" : "false");
  trigger_node.setAttribute(
    "aria-label",
    is_open ? "Close Solarisael menu" : "Open Solarisael menu",
  );
};

const set_menu_panel_state = (panel_node, is_open) => {
  if (!(panel_node instanceof HTMLElement)) return;
  panel_node.setAttribute("aria-hidden", is_open ? "false" : "true");
  panel_node.inert = !is_open;
};

const set_select_value = (select_node, value) => {
  if (select_node instanceof HTMLSelectElement) {
    select_node.value = value;
  }
};

const set_menu_view_state = (menu_node, requested_view) => {
  if (!(menu_node instanceof HTMLElement)) {
    return SITE_MENU_VIEW_DEFAULT;
  }

  const view_nodes = Array.from(
    menu_node.querySelectorAll("[data-side-menu-view-page]"),
  ).filter((node) => node instanceof HTMLElement);
  const available_views = view_nodes.map(
    (node) => node.dataset.sideMenuViewPage,
  );
  const safe_view = get_safe_option(
    requested_view,
    available_views,
    available_views.includes(SITE_MENU_VIEW_DEFAULT)
      ? SITE_MENU_VIEW_DEFAULT
      : available_views[0],
  );
  const active_index = Math.max(available_views.indexOf(safe_view), 0);

  menu_node.dataset.sideMenuView = safe_view;

  view_nodes.forEach((view_node, index) => {
    set_view_page_state(view_node, index, active_index);
  });

  for (const target_node of menu_node.querySelectorAll(
    "[data-side-menu-view-target]",
  )) {
    const is_current_target =
      target_node.dataset.sideMenuViewTarget === safe_view;
    target_node.setAttribute(
      "aria-expanded",
      is_current_target ? "true" : "false",
    );
  }

  return safe_view;
};

const set_menu_state = (menu_node, is_open, view_name) => {
  if (!(menu_node instanceof HTMLElement)) {
    return SITE_MENU_VIEW_DEFAULT;
  }

  const safe_view = set_menu_view_state(menu_node, view_name);
  menu_node.dataset.sideMenuOpen = is_open ? "true" : "false";

  const trigger_node = menu_node.querySelector("[data-side-menu-trigger]");
  const panel_node = menu_node.querySelector("[data-side-menu-panel-shell]");

  set_menu_trigger_state(trigger_node, is_open);
  set_menu_panel_state(panel_node, is_open);

  return safe_view;
};

const sync_side_menu_controls = (
  theme_name,
  shell_name,
  fx_name,
  scale_name,
  text_name,
  measure_name,
  menu_open,
  menu_view,
) => {
  const menu_node = document.querySelector("#sol_side_menu");

  if (!(menu_node instanceof HTMLElement)) {
    return;
  }

  const theme_select_node = menu_node.querySelector(
    "[data-site-theme-control]",
  );
  const shell_select_node = menu_node.querySelector(
    "[data-site-shell-control]",
  );
  const fx_select_node = menu_node.querySelector("[data-site-fx-control]");
  const scale_select_node = menu_node.querySelector(
    "[data-site-scale-control]",
  );
  const text_select_node = menu_node.querySelector("[data-user-text-control]");
  const measure_select_node = menu_node.querySelector(
    "[data-user-measure-control]",
  );

  set_select_value(theme_select_node, theme_name);
  set_select_value(shell_select_node, shell_name);
  set_select_value(fx_select_node, fx_name);
  set_select_value(scale_select_node, scale_name);
  set_select_value(text_select_node, text_name);
  set_select_value(measure_select_node, measure_name);

  set_menu_state(menu_node, menu_open, menu_view);
};

export { set_menu_view_state, set_menu_state, sync_side_menu_controls };

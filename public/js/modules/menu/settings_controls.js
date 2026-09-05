import {
  SITE_FX_COOKIE_NAME,
  SITE_FX_DEFAULT,
  SITE_SCALE_COOKIE_NAME,
  SITE_SCALE_DEFAULT,
  SITE_SHELL_COOKIE_NAME,
  SITE_SHELL_DEFAULT,
  SITE_THEME_COOKIE_NAME,
  SITE_THEME_DEFAULT,
  USER_MEASURE_COOKIE_NAME,
  USER_MEASURE_DEFAULT,
  USER_TEXT_COOKIE_NAME,
  USER_TEXT_DEFAULT,
  apply_site_style_state,
  apply_user_settings_state,
  get_safe_option,
  site_fx_options,
  site_scale_options,
  site_shell_options,
  site_theme_options,
  user_measure_options,
  user_text_options,
  write_cookie_value,
  delete_cookie_value,
} from "./preferences.js";
import { sync_side_menu_controls } from "./view_state.js";

const bind_select_change = (select_node, commit_state) => {
  if (select_node instanceof HTMLSelectElement) {
    select_node.addEventListener("change", commit_state);
  }
};

export const bind_settings_controls = (menu_node) => {
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
  const reset_node = menu_node.querySelector("[data-side-menu-reset]");

  const commit_site_state = () => {
    const selected_theme_name = get_safe_option(
      theme_select_node instanceof HTMLSelectElement
        ? theme_select_node.value
        : SITE_THEME_DEFAULT,
      site_theme_options,
      SITE_THEME_DEFAULT,
    );
    const selected_shell_name = get_safe_option(
      shell_select_node instanceof HTMLSelectElement
        ? shell_select_node.value
        : SITE_SHELL_DEFAULT,
      site_shell_options,
      SITE_SHELL_DEFAULT,
    );
    const selected_fx_name = get_safe_option(
      fx_select_node instanceof HTMLSelectElement
        ? fx_select_node.value
        : SITE_FX_DEFAULT,
      site_fx_options,
      SITE_FX_DEFAULT,
    );
    const selected_scale_name = get_safe_option(
      scale_select_node instanceof HTMLSelectElement
        ? scale_select_node.value
        : SITE_SCALE_DEFAULT,
      site_scale_options,
      SITE_SCALE_DEFAULT,
    );

    apply_site_style_state(
      document.documentElement,
      selected_theme_name,
      selected_shell_name,
      selected_fx_name,
      selected_scale_name,
    );
    write_cookie_value(SITE_THEME_COOKIE_NAME, selected_theme_name);
    write_cookie_value(SITE_SHELL_COOKIE_NAME, selected_shell_name);
    write_cookie_value(SITE_FX_COOKIE_NAME, selected_fx_name);
    write_cookie_value(SITE_SCALE_COOKIE_NAME, selected_scale_name);
  };

  const commit_user_state = () => {
    const selected_text_name = get_safe_option(
      text_select_node instanceof HTMLSelectElement
        ? text_select_node.value
        : USER_TEXT_DEFAULT,
      user_text_options,
      USER_TEXT_DEFAULT,
    );
    const selected_measure_name = get_safe_option(
      measure_select_node instanceof HTMLSelectElement
        ? measure_select_node.value
        : USER_MEASURE_DEFAULT,
      user_measure_options,
      USER_MEASURE_DEFAULT,
    );

    apply_user_settings_state(
      document.documentElement,
      selected_text_name,
      selected_measure_name,
    );
    write_cookie_value(USER_TEXT_COOKIE_NAME, selected_text_name);
    write_cookie_value(USER_MEASURE_COOKIE_NAME, selected_measure_name);
  };

  bind_select_change(theme_select_node, commit_site_state);
  bind_select_change(shell_select_node, commit_site_state);
  bind_select_change(fx_select_node, commit_site_state);
  bind_select_change(scale_select_node, commit_site_state);
  bind_select_change(text_select_node, commit_user_state);
  bind_select_change(measure_select_node, commit_user_state);

  if (reset_node instanceof HTMLButtonElement) {
    reset_node.addEventListener("click", () => {
      for (const cookie_name of [
        SITE_THEME_COOKIE_NAME,
        SITE_SHELL_COOKIE_NAME,
        SITE_FX_COOKIE_NAME,
        SITE_SCALE_COOKIE_NAME,
        USER_TEXT_COOKIE_NAME,
        USER_MEASURE_COOKIE_NAME,
      ]) {
        delete_cookie_value(cookie_name);
      }

      apply_site_style_state(
        document.documentElement,
        SITE_THEME_DEFAULT,
        SITE_SHELL_DEFAULT,
        SITE_FX_DEFAULT,
        SITE_SCALE_DEFAULT,
      );
      apply_user_settings_state(
        document.documentElement,
        USER_TEXT_DEFAULT,
        USER_MEASURE_DEFAULT,
      );
      sync_side_menu_controls(
        SITE_THEME_DEFAULT,
        SITE_SHELL_DEFAULT,
        SITE_FX_DEFAULT,
        SITE_SCALE_DEFAULT,
        USER_TEXT_DEFAULT,
        USER_MEASURE_DEFAULT,
        true,
        "settings",
      );
    });
  }
};

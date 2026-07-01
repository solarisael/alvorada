import { describe, expect, test } from "bun:test";

import {
  COOKIE_MAX_AGE_SECONDS,
  LEGACY_HOME_FX_COOKIE_NAME,
  LEGACY_HOME_THEME_COOKIE_NAME,
  SITE_FX_DEFAULT,
  SITE_MENU_OPEN_COOKIE_NAME,
  SITE_MENU_OPEN_DEFAULT,
  SITE_MENU_PANEL_COOKIE_NAME,
  SITE_MENU_PANEL_DEFAULT,
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
  build_cookie_string,
  get_safe_option,
  has_site_root,
  legacy_theme_alias_map,
  normalize_legacy_fx_value,
  normalize_legacy_theme_value,
  normalize_theme_alias_value,
  parse_cookie_map,
  read_cookie_value,
  resolve_saved_menu_state,
  resolve_saved_style,
  resolve_saved_user_settings,
  site_menu_panel_options,
  site_theme_options,
  user_measure_options,
  user_text_options,
} from "../public/js/modules/side_menu.js";

describe("side_menu cookie parsing", () => {
  test("parse_cookie_map returns expected values", () => {
    const cookie_map = parse_cookie_map(
      "site_theme=gilded_arcane; site_fx=bold; site_shell=strong",
    );

    expect(cookie_map.site_theme).toBe("gilded_arcane");
    expect(cookie_map.site_fx).toBe("bold");
    expect(cookie_map.site_shell).toBe("strong");
  });

  test("read_cookie_value returns null when missing", () => {
    expect(read_cookie_value("missing_key", "site_fx=subtle")).toBeNull();
  });

  test("side menu and user preference cookie keys are stable", () => {
    expect(SITE_MENU_OPEN_COOKIE_NAME).toBe("site_menu_open");
    expect(SITE_MENU_OPEN_DEFAULT).toBe(false);
    expect(SITE_MENU_PANEL_COOKIE_NAME).toBe("site_menu_panel");
    expect(SITE_MENU_PANEL_DEFAULT).toBe("site");
    expect(USER_TEXT_COOKIE_NAME).toBe("user_text");
    expect(USER_TEXT_DEFAULT).toBe("normal");
    expect(USER_MEASURE_COOKIE_NAME).toBe("user_measure");
    expect(USER_MEASURE_DEFAULT).toBe("comfort");
  });

  test("build_cookie_string uses expected persistence attributes", () => {
    const cookie_string = build_cookie_string(
      SITE_THEME_COOKIE_NAME,
      "cosmic_overlay",
      COOKIE_MAX_AGE_SECONDS,
    );

    expect(cookie_string).toContain("site_theme=cosmic_overlay");
    expect(cookie_string).toContain("path=/");
    expect(cookie_string).toContain(`max-age=${COOKIE_MAX_AGE_SECONDS}`);
    expect(cookie_string).toContain("SameSite=Lax");
  });
});

describe("side_menu option safety", () => {
  test("get_safe_option accepts only allowed values", () => {
    expect(
      get_safe_option("solarisael", site_theme_options, SITE_THEME_DEFAULT),
    ).toBe("solarisael");
    expect(
      get_safe_option(
        "cosmic_overlay",
        site_theme_options,
        SITE_THEME_DEFAULT,
      ),
    ).toBe(SITE_THEME_DEFAULT);
  });

  test("legacy normalizers map old values", () => {
    expect(normalize_legacy_theme_value("site_theme_vibrant")).toBe(
      "solarisael",
    );
    expect(normalize_theme_alias_value("golden_mystical_tarot")).toBe(
      "solarisael",
    );
    expect(normalize_theme_alias_value("cosmic_themed")).toBe("solarisael");
    expect(normalize_legacy_fx_value("home_fx_bold")).toBe("bold");
    expect(normalize_legacy_theme_value("bad")).toBeNull();
    expect(normalize_theme_alias_value(42)).toBeNull();
    expect(normalize_legacy_fx_value(42)).toBeNull();
  });

  test("legacy_theme_alias_map contains expected dual aliases", () => {
    expect(legacy_theme_alias_map.astrology_themed).toBe("solarisael");
    expect(legacy_theme_alias_map.gothic_dark_girl).toBe("solarisael");
    expect(legacy_theme_alias_map.ritual).toBe("solarisael");
  });

  test("resolve_saved_style falls back on invalid cookie values", () => {
    const resolved_style = resolve_saved_style(
      "site_theme=nope; site_fx=not_real; site_shell=invalid",
    );

    expect(resolved_style.saved_theme_class).toBe(SITE_THEME_DEFAULT);
    expect(resolved_style.saved_fx_class).toBe(SITE_FX_DEFAULT);
    expect(resolved_style.saved_shell_class).toBe(SITE_SHELL_DEFAULT);
  });

  test("resolve_saved_style accepts valid cookie values", () => {
    const resolved_style = resolve_saved_style(
      "site_theme=solarisael; site_fx=subtle; site_shell=strong",
    );

    expect(resolved_style.saved_theme_class).toBe("solarisael");
    expect(resolved_style.saved_fx_class).toBe("subtle");
    expect(resolved_style.saved_shell_class).toBe("strong");
  });

  test("resolve_saved_style supports legacy cookies", () => {
    const resolved_style = resolve_saved_style(
      `${LEGACY_HOME_THEME_COOKIE_NAME}=site_theme_arcane; ${LEGACY_HOME_FX_COOKIE_NAME}=home_fx_bold; ${SITE_SHELL_COOKIE_NAME}=subtle`,
    );

    expect(resolved_style.saved_theme_class).toBe("solarisael");
    expect(resolved_style.saved_fx_class).toBe("bold");
    expect(resolved_style.saved_shell_class).toBe("subtle");
  });

  test("resolve_saved_style normalizes external alias values", () => {
    const resolved_style = resolve_saved_style(
      "site_theme=golden_mystical_tarot; site_fx=balanced; site_shell=medium",
    );

    expect(resolved_style.saved_theme_class).toBe("solarisael");
  });

  test("resolve_saved_user_settings accepts valid text and measure cookies", () => {
    const resolved_user_settings = resolve_saved_user_settings(
      "user_text=large; user_measure=wide",
    );

    expect(user_text_options.includes(resolved_user_settings.saved_text_class)).toBe(
      true,
    );
    expect(resolved_user_settings.saved_text_class).toBe("large");
    expect(
      user_measure_options.includes(resolved_user_settings.saved_measure_class),
    ).toBe(true);
    expect(resolved_user_settings.saved_measure_class).toBe("wide");
  });

  test("resolve_saved_user_settings falls back on invalid user cookies", () => {
    const resolved_user_settings = resolve_saved_user_settings(
      "user_text=tiny; user_measure=endless",
    );

    expect(resolved_user_settings.saved_text_class).toBe(USER_TEXT_DEFAULT);
    expect(resolved_user_settings.saved_measure_class).toBe(USER_MEASURE_DEFAULT);
  });

  test("resolve_saved_menu_state accepts valid open and panel cookies", () => {
    const open_state = resolve_saved_menu_state(
      "site_menu_open=true; site_menu_panel=user",
    );
    const closed_state = resolve_saved_menu_state(
      "site_menu_open=false; site_menu_panel=account",
    );

    expect(open_state.saved_menu_open).toBe(true);
    expect(site_menu_panel_options.includes(open_state.saved_menu_panel)).toBe(true);
    expect(open_state.saved_menu_panel).toBe("user");
    expect(closed_state.saved_menu_open).toBe(false);
    expect(closed_state.saved_menu_panel).toBe("account");
  });

  test("resolve_saved_menu_state falls back on invalid menu cookies", () => {
    const resolved_menu_state = resolve_saved_menu_state(
      "site_menu_open=maybe; site_menu_panel=preferences",
    );

    expect(resolved_menu_state.saved_menu_open).toBe(SITE_MENU_OPEN_DEFAULT);
    expect(resolved_menu_state.saved_menu_panel).toBe(SITE_MENU_PANEL_DEFAULT);
  });
});

describe("side_menu root state", () => {
  test("has_site_root rejects invalid nodes", () => {
    expect(has_site_root(null)).toBe(false);
    expect(has_site_root({})).toBe(false);
  });

  test("apply_site_style_state sets data attributes", () => {
    const attributes = {};
    const fake_root = {
      dataset: {},
      setAttribute: (name, value) => {
        attributes[name] = value;
      },
      removeAttribute: () => {},
    };

    apply_site_style_state(fake_root, "minimal_astral", "medium", "balanced");

    expect(attributes["data-site-theme"]).toBe("minimal_astral");
    expect(attributes["data-site-shell"]).toBe("medium");
    expect(attributes["data-site-fx"]).toBe("balanced");
  });

  test("apply_user_settings_state sets data attributes", () => {
    const attributes = {};
    const fake_root = {
      dataset: {},
      setAttribute: (name, value) => {
        attributes[name] = value;
      },
      removeAttribute: () => {},
    };

    apply_user_settings_state(fake_root, "large", "wide");

    expect(attributes["data-user-text"]).toBe("large");
    expect(attributes["data-user-measure"]).toBe("wide");
  });
});

import { describe, expect, test } from "bun:test";

import {
  COOKIE_MAX_AGE_SECONDS,
  LEGACY_HOME_FX_COOKIE_NAME,
  LEGACY_HOME_THEME_COOKIE_NAME,
  SITE_FX_COOKIE_NAME,
  SITE_FX_DEFAULT,
  SITE_SHELL_COOKIE_NAME,
  SITE_SHELL_DEFAULT,
  SITE_THEME_COOKIE_NAME,
  SITE_THEME_DEFAULT,
  apply_site_style_state,
  build_cookie_string,
  get_safe_option,
  has_site_root,
  normalize_legacy_fx_value,
  normalize_legacy_theme_value,
  parse_cookie_map,
  read_cookie_value,
  resolve_saved_style,
  site_fx_options,
  site_shell_options,
  site_theme_options,
} from "../public/js/modules/style_switcher.js";

describe("style_switcher cookie parsing", () => {
  test("parse_cookie_map returns expected values", () => {
    const cookie_map = parse_cookie_map(
      "site_theme=vibrant; site_fx=bold; site_shell=strong",
    );

    expect(cookie_map.site_theme).toBe("vibrant");
    expect(cookie_map.site_fx).toBe("bold");
    expect(cookie_map.site_shell).toBe("strong");
  });

  test("read_cookie_value returns null when missing", () => {
    expect(read_cookie_value("missing_key", "site_fx=subtle")).toBeNull();
  });

  test("build_cookie_string uses expected persistence attributes", () => {
    const cookie_string = build_cookie_string(
      SITE_THEME_COOKIE_NAME,
      "arcane",
      COOKIE_MAX_AGE_SECONDS,
    );

    expect(cookie_string).toContain("site_theme=arcane");
    expect(cookie_string).toContain("path=/");
    expect(cookie_string).toContain(`max-age=${COOKIE_MAX_AGE_SECONDS}`);
    expect(cookie_string).toContain("SameSite=Lax");
  });
});

describe("style_switcher option safety", () => {
  test("get_safe_option accepts only allowed values", () => {
    expect(
      get_safe_option("arcane", site_theme_options, SITE_THEME_DEFAULT),
    ).toBe("arcane");
    expect(
      get_safe_option("verdigris", site_theme_options, SITE_THEME_DEFAULT),
    ).toBe("verdigris");
    expect(
      get_safe_option(
        "totally_invalid",
        site_theme_options,
        SITE_THEME_DEFAULT,
      ),
    ).toBe(SITE_THEME_DEFAULT);
  });

  test("legacy normalizers map old values", () => {
    expect(normalize_legacy_theme_value("site_theme_vibrant")).toBe("vibrant");
    expect(normalize_legacy_fx_value("home_fx_bold")).toBe("bold");
    expect(normalize_legacy_theme_value("bad")).toBeNull();
    expect(normalize_legacy_fx_value("bad")).toBeNull();
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
      "site_theme=vibrant; site_fx=subtle; site_shell=strong",
    );

    expect(site_theme_options.includes(resolved_style.saved_theme_class)).toBe(
      true,
    );
    expect(site_fx_options.includes(resolved_style.saved_fx_class)).toBe(true);
    expect(site_shell_options.includes(resolved_style.saved_shell_class)).toBe(
      true,
    );
  });

  test("resolve_saved_style supports legacy cookies", () => {
    const resolved_style = resolve_saved_style(
      `${LEGACY_HOME_THEME_COOKIE_NAME}=site_theme_arcane; ${LEGACY_HOME_FX_COOKIE_NAME}=home_fx_bold; ${SITE_SHELL_COOKIE_NAME}=subtle`,
    );

    expect(resolved_style.saved_theme_class).toBe("arcane");
    expect(resolved_style.saved_fx_class).toBe("bold");
    expect(resolved_style.saved_shell_class).toBe("subtle");
  });
});

describe("style_switcher root state", () => {
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

    apply_site_style_state(fake_root, "ritual", "medium", "balanced");

    expect(attributes["data-site-theme"]).toBe("ritual");
    expect(attributes["data-site-shell"]).toBe("medium");
    expect(attributes["data-site-fx"]).toBe("balanced");
  });
});

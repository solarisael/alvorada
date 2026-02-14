import { describe, expect, test } from "bun:test";

import {
  parse_text_fx_intensity_value,
  normalize_text_fx_token,
  parse_combat_token_segments,
  resolve_text_fx_class,
  split_text_fx_tokens,
} from "../public/js/modules/text_effects.js";
import {
  normalize_text_fx_name,
  split_text_fx_markers,
  transform_text_fx_markers_in_tree,
} from "../src/utils/text_effects_markdown.js";

describe("text_effects runtime normalization", () => {
  test("normalizes legacy and canonical effect tokens", () => {
    expect(normalize_text_fx_token("glow")).toBe("glow");
    expect(normalize_text_fx_token("fx-glow")).toBe("glow");
    expect(normalize_text_fx_token("text_fx_glow")).toBe("glow");
    expect(normalize_text_fx_token("aura")).toBe("aura");
    expect(normalize_text_fx_token("terminal")).toBe("terminal");
    expect(normalize_text_fx_token("combat_feed")).toBe("combat_feed");
    expect(normalize_text_fx_token("game-screen")).toBe("game_screen");
    expect(normalize_text_fx_token("quest-log")).toBe("quest_log");
    expect(normalize_text_fx_token("system_warning")).toBe("system_warning");
    expect(normalize_text_fx_token("sigil-pulse")).toBe("sigil_pulse");
    expect(normalize_text_fx_token("cadence")).toBe("cadence");
    expect(normalize_text_fx_token("cadence-soft")).toBe("cadence_soft");
    expect(normalize_text_fx_token("cadence_childlike")).toBe(
      "cadence_childlike",
    );
    expect(normalize_text_fx_token("unknown")).toBeNull();
  });

  test("resolves effect class from token", () => {
    expect(resolve_text_fx_class("neon")).toBe("text_fx_neon");
    expect(resolve_text_fx_class("fx-neon")).toBe("text_fx_neon");
    expect(resolve_text_fx_class("whisper")).toBe("text_fx_whisper");
    expect(resolve_text_fx_class("terminal")).toBe("block_fx_terminal");
    expect(resolve_text_fx_class("combat_feed")).toBe("block_fx_combat_feed");
    expect(resolve_text_fx_class("stat_screen")).toBe("block_fx_stat_screen");
    expect(resolve_text_fx_class("quest_log")).toBe("block_fx_quest_log");
    expect(resolve_text_fx_class("map_ping")).toBe("block_fx_map_ping");
    expect(resolve_text_fx_class("sigil_pulse")).toBe("text_fx_sigil_pulse");
    expect(resolve_text_fx_class("cadence")).toBe("text_fx_cadence");
    expect(resolve_text_fx_class("cadence_oracular")).toBe(
      "text_fx_cadence_oracular",
    );
    expect(resolve_text_fx_class("bad-token")).toBeNull();
  });

  test("clamps marker intensity inputs", () => {
    expect(parse_text_fx_intensity_value("0.05")).toBe(0.2);
    expect(parse_text_fx_intensity_value("1.3")).toBe(1.3);
    expect(parse_text_fx_intensity_value("4")).toBe(3);
    expect(parse_text_fx_intensity_value("not-a-number")).toBeNull();
  });

  test("parses combat token segments", () => {
    expect(parse_combat_token_segments("CRIT dealt. BUFF gained.")).toEqual([
      {
        type: "token",
        value: "CRIT",
        token_class: "combat_token_crit",
      },
      { type: "text", value: " dealt. " },
      {
        type: "token",
        value: "BUFF",
        token_class: "combat_token_buff",
      },
      { type: "text", value: " gained." },
    ]);
  });

  test("parses higher-level combat token segments", () => {
    expect(
      parse_combat_token_segments("MEGA_CRIT spike. TRUE_DAMAGE lands."),
    ).toEqual([
      {
        type: "token",
        value: "MEGA_CRIT",
        token_class: "combat_token_mega_crit",
      },
      { type: "text", value: " spike. " },
      {
        type: "token",
        value: "TRUE_DAMAGE",
        token_class: "combat_token_true_damage",
      },
      { type: "text", value: " lands." },
    ]);
  });

  test("parses explicit bracketed combat tokens", () => {
    expect(parse_combat_token_segments("[CRIT] lands. [BUFF] pulses.")).toEqual(
      [
        {
          type: "token",
          value: "CRIT",
          token_class: "combat_token_crit",
          bracketed: true,
        },
        { type: "text", value: " lands. " },
        {
          type: "token",
          value: "BUFF",
          token_class: "combat_token_buff",
          bracketed: true,
        },
        { type: "text", value: " pulses." },
      ],
    );
  });

  test("splits token lists from data attributes", () => {
    expect(split_text_fx_tokens("glow, neon|flicker")).toEqual([
      "glow",
      "neon",
      "flicker",
    ]);
  });
});

describe("text_effects markdown marker processing", () => {
  test("normalizes marker effect aliases", () => {
    expect(normalize_text_fx_name("glow")).toBe("glow");
    expect(normalize_text_fx_name("fx_glow")).toBe("glow");
    expect(normalize_text_fx_name("text_fx_glow")).toBe("glow");
    expect(normalize_text_fx_name("aura")).toBe("aura");
    expect(normalize_text_fx_name("terminal")).toBe("terminal");
    expect(normalize_text_fx_name("game-screen")).toBe("game_screen");
    expect(normalize_text_fx_name("memory_fragment")).toBe("memory_fragment");
    expect(normalize_text_fx_name("admin-trace")).toBe("admin_trace");
    expect(normalize_text_fx_name("sigil-pulse")).toBe("sigil_pulse");
    expect(normalize_text_fx_name("cadence")).toBe("cadence");
    expect(normalize_text_fx_name("cadence-soft")).toBe("cadence_soft");
  });

  test("converts marker syntax to html node payload", () => {
    const nodes = split_text_fx_markers("before {{fx:glow}}sigil{{/fx}} after");

    expect(nodes).toEqual([
      { type: "text", value: "before " },
      {
        type: "html",
        value: '<span class="text_fx text_fx_glow">sigil</span>',
      },
      { type: "text", value: " after" },
    ]);
  });

  test("keeps unknown marker syntax as plain text", () => {
    const nodes = split_text_fx_markers("{{fx:unknown}}x{{/fx}}");

    expect(nodes).toEqual([{ type: "text", value: "{{fx:unknown}}x{{/fx}}" }]);
  });

  test("supports visual-only intensity marker", () => {
    const nodes = split_text_fx_markers("{{fx:glow:1.2}}sigil{{/fx}}");

    expect(nodes).toEqual([
      {
        type: "html",
        value:
          '<span class="text_fx text_fx_glow" data-text-fx-intensity="1.2" style="--text_fx_marker_intensity:1.2">sigil</span>',
      },
    ]);
  });

  test("supports visual and motion intensity marker", () => {
    const nodes = split_text_fx_markers("{{fx:flicker:1.2:0.7}}signal{{/fx}}");

    expect(nodes).toEqual([
      {
        type: "html",
        value:
          '<span class="text_fx text_fx_flicker" data-text-fx-intensity="1.2" data-text-fx-motion="0.7" style="--text_fx_marker_intensity:1.2;--text_fx_marker_motion:0.7">signal</span>',
      },
    ]);
  });

  test("supports mystical effect markers", () => {
    const nodes = split_text_fx_markers("{{fx:aura:1.4}}beacon{{/fx}}");

    expect(nodes).toEqual([
      {
        type: "html",
        value:
          '<span class="text_fx text_fx_aura" data-text-fx-intensity="1.4" style="--text_fx_marker_intensity:1.4">beacon</span>',
      },
    ]);
  });

  test("supports stacked text effect markers in left-to-right order", () => {
    const nodes = split_text_fx_markers(
      "{{fx:glow|flicker|shadow}}signal{{/fx}}",
    );

    expect(nodes).toEqual([
      {
        type: "html",
        value:
          '<span class="text_fx text_fx_glow text_fx_flicker text_fx_shadow">signal</span>',
      },
    ]);
  });

  test("supports stacked text effects with intensity values", () => {
    const nodes = split_text_fx_markers(
      "{{fx:glow|flicker:1.2:0.7}}signal{{/fx}}",
    );

    expect(nodes).toEqual([
      {
        type: "html",
        value:
          '<span class="text_fx text_fx_glow text_fx_flicker" data-text-fx-intensity="1.2" data-text-fx-motion="0.7" style="--text_fx_marker_intensity:1.2;--text_fx_marker_motion:0.7">signal</span>',
      },
    ]);
  });

  test("auto-sanitizes blacklisted stack combinations and warns once", () => {
    const warning_messages = [];
    const source_text =
      "{{fx:shake|float|glow}}signal{{/fx}} {{fx:shake|float|glow}}echo{{/fx}}";
    const nodes = split_text_fx_markers(source_text, {
      warn: (warning_message) => {
        warning_messages.push(warning_message);
      },
      warning_cache: new Set(),
    });

    expect(nodes).toEqual([
      {
        type: "html",
        value: '<span class="text_fx text_fx_shake text_fx_glow">signal</span>',
      },
      { type: "text", value: " " },
      {
        type: "html",
        value: '<span class="text_fx text_fx_shake text_fx_glow">echo</span>',
      },
    ]);

    expect(warning_messages).toEqual([
      "[text_fx] auto-sanitized marker 'shake|float|glow' -> 'shake|glow' (token 'float' dropped because 'shake+float' is blacklisted)",
    ]);
  });

  test("treats stack markers with only block effects as plain text", () => {
    const nodes = split_text_fx_markers(
      "{{fx:terminal|stat_screen}}boot{{/fx}}",
    );

    expect(nodes).toEqual([
      {
        type: "text",
        value: "{{fx:terminal|stat_screen}}boot{{/fx}}",
      },
    ]);
  });

  test("supports inline combat feed marker", () => {
    const nodes = split_text_fx_markers(
      "{{fx:combat_feed:1.2}}CRIT lands{{/fx}}",
    );

    expect(nodes).toEqual([
      {
        type: "html",
        value:
          '<span class="text_fx text_fx_combat_feed" data-text-fx-intensity="1.2" style="--text_fx_marker_intensity:1.2">CRIT lands</span>',
      },
    ]);
  });

  test("keeps combat_feed in stacks and forces it to the front", () => {
    const nodes = split_text_fx_markers(
      "{{fx:glitch|combat_feed|flicker:1.2:1.1}}[CRIT] lands{{/fx}}",
    );

    expect(nodes).toEqual([
      {
        type: "html",
        value:
          '<span class="text_fx text_fx_combat_feed text_fx_glitch text_fx_flicker" data-text-fx-intensity="1.2" data-text-fx-motion="1.1" style="--text_fx_marker_intensity:1.2;--text_fx_marker_motion:1.1">[CRIT] lands</span>',
      },
    ]);
  });

  test("drops non-inline block effects from mixed stacks while keeping combat_feed", () => {
    const warning_messages = [];
    const nodes = split_text_fx_markers(
      "{{fx:terminal|combat_feed|glow:1.1}}telemetry{{/fx}}",
      {
        warn: (warning_message) => {
          warning_messages.push(warning_message);
        },
        warning_cache: new Set(),
      },
    );

    expect(nodes).toEqual([
      {
        type: "html",
        value:
          '<span class="text_fx text_fx_combat_feed text_fx_glow" data-text-fx-intensity="1.1" style="--text_fx_marker_intensity:1.1">telemetry</span>',
      },
    ]);

    expect(warning_messages).toEqual([
      "[text_fx] auto-sanitized marker 'terminal|combat_feed|glow:1.1' -> 'combat_feed|glow' (block token 'terminal' is not allowed in stacks)",
    ]);
  });

  test("keeps block effects as plain text in inline markers", () => {
    const nodes = split_text_fx_markers("{{fx:terminal}}boot{{/fx}}");

    expect(nodes).toEqual([
      {
        type: "text",
        value: "{{fx:terminal}}boot{{/fx}}",
      },
    ]);
  });

  test("clamps marker intensity values in emitted html", () => {
    const nodes = split_text_fx_markers("{{fx:glow:9:0.01}}flare{{/fx}}");

    expect(nodes).toEqual([
      {
        type: "html",
        value:
          '<span class="text_fx text_fx_glow" data-text-fx-intensity="3" data-text-fx-motion="0.2" style="--text_fx_marker_intensity:3;--text_fx_marker_motion:0.2">flare</span>',
      },
    ]);
  });

  test("keeps invalid intensity marker syntax as plain text", () => {
    const nodes = split_text_fx_markers("{{fx:glow:abc}}x{{/fx}}");

    expect(nodes).toEqual([{ type: "text", value: "{{fx:glow:abc}}x{{/fx}}" }]);
  });

  test("transforms marker wrappers around inline markdown nodes", () => {
    const tree = {
      type: "paragraph",
      children: [
        { type: "text", value: "{{fx:cadence_childlike:1.1}}" },
        {
          type: "emphasis",
          children: [{ type: "text", value: "inner thought" }],
        },
        { type: "text", value: "{{/fx}}" },
      ],
    };

    transform_text_fx_markers_in_tree(tree);

    expect(tree.children).toEqual([
      {
        type: "html",
        value:
          '<span class="text_fx text_fx_cadence_childlike" data-text-fx-intensity="1.1" style="--text_fx_marker_intensity:1.1">',
      },
      {
        type: "emphasis",
        children: [{ type: "text", value: "inner thought" }],
      },
      { type: "html", value: "</span>" },
    ]);
  });

  test("transforms block marker wrappers around sibling markdown nodes", () => {
    const tree = {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [{ type: "text", value: "{{fx:stat_screen:1.1}}" }],
        },
        {
          type: "list",
          ordered: false,
          spread: false,
          children: [
            {
              type: "listItem",
              spread: false,
              checked: null,
              children: [
                {
                  type: "paragraph",
                  children: [{ type: "text", value: "HP: 100/100" }],
                },
              ],
            },
          ],
        },
        {
          type: "paragraph",
          children: [{ type: "text", value: "{{/fx}}" }],
        },
      ],
    };

    transform_text_fx_markers_in_tree(tree);

    expect(tree.children).toEqual([
      {
        type: "html",
        value:
          '<div class="block_fx block_fx_stat_screen" data-text-fx="stat_screen" data-text-fx-intensity="1.1" style="--block_fx_marker_intensity:1.1">',
      },
      {
        type: "list",
        ordered: false,
        spread: false,
        children: [
          {
            type: "listItem",
            spread: false,
            checked: null,
            children: [
              {
                type: "paragraph",
                children: [{ type: "text", value: "HP: 100/100" }],
              },
            ],
          },
        ],
      },
      { type: "html", value: "</div>" },
    ]);
  });

  test("transforms additional block effects", () => {
    const tree = {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [{ type: "text", value: "{{fx:quest_log:1.2:0.8}}" }],
        },
        {
          type: "paragraph",
          children: [{ type: "text", value: "Quest payload." }],
        },
        {
          type: "paragraph",
          children: [{ type: "text", value: "{{/fx}}" }],
        },
      ],
    };

    transform_text_fx_markers_in_tree(tree);

    expect(tree.children).toEqual([
      {
        type: "html",
        value:
          '<div class="block_fx block_fx_quest_log" data-text-fx="quest_log" data-text-fx-intensity="1.2" data-text-fx-motion="0.8" style="--block_fx_marker_intensity:1.2;--block_fx_marker_motion:0.8">',
      },
      {
        type: "paragraph",
        children: [{ type: "text", value: "Quest payload." }],
      },
      { type: "html", value: "</div>" },
    ]);
  });
});

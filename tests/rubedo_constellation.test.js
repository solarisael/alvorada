import { describe, expect, test } from "bun:test";

import { build_branch_label_text } from "../public/js/modules/rubedo/constellation_preview.js";
import {
  build_constellation_payload_from_json,
  empty_constellation_payload,
} from "../public/js/modules/rubedo/constellation_payload.js";
import { base_path_from_data_href } from "../public/js/modules/rubedo/constellation_runtime.js";

const book_fixture = {
  book_slug: "absurd-faith",
  title: "Absurd Faith",
  chapters: [
    {
      chapter_id: "af_000",
      chapter_slug: "000",
      timeline_position: 0,
      title: "Awakening",
      thread_keys: ["cinza", "suul"],
      branch_edges: [],
    },
    {
      chapter_id: "af_001",
      chapter_slug: "001",
      timeline_position: 1,
      title: "Cliff",
      thread_keys: ["cinza", "solarisael"],
      branch_edges: [{ to_chapter_id: "af_000", condition_label: "return" }],
    },
    {
      chapter_id: "af_002",
      chapter_slug: "002",
      timeline_position: 2,
      title: "Descent",
      thread_keys: ["suul"],
      branch_edges: [],
    },
  ],
};

describe("rubedo constellation payload", () => {
  test("returns a uniform empty payload for invalid book data", () => {
    expect(
      build_constellation_payload_from_json(null, "/solarisael", null),
    ).toEqual(empty_constellation_payload);
  });

  test("builds visible nodes, links, and edges from timeline JSON", () => {
    const payload = build_constellation_payload_from_json(
      book_fixture,
      "/solarisael",
      "001",
    );

    const suul_node = payload.nodes.find((node_entry) => {
      return node_entry.node_id === "af_000:suul";
    });
    const phantom_anchor = payload.nodes.find((node_entry) => {
      return node_entry.node_id === "af_002:cinza:phantom";
    });

    expect(payload.active_chapter_id).toBe("af_001");
    expect(payload.active_thread_key).toBe("cinza");
    expect(suul_node?.image_src).toBe("/solarisael/images/eyes/suul.jpg");
    expect(suul_node?.link?.hx_get).toBe("/solarisael/rubedo/absurd-faith/000");
    expect(phantom_anchor?.is_clickable).toBe(false);
    expect(payload.edges.trunk).toHaveLength(2);
    expect(payload.edges.connectors).toHaveLength(3);
    expect(payload.edges.branch).toEqual([
      {
        edge_key: "af_001:af_000",
        condition_label: "return",
        x1: 50,
        y1: 30,
        x2: 50,
        y2: 12,
      },
    ]);
  });
});

describe("rubedo constellation helpers", () => {
  test("derives base path from data endpoint href", () => {
    expect(
      base_path_from_data_href("/solarisael/rubedo/data/absurd-faith.json"),
    ).toBe("/solarisael");
  });

  test("formats branch labels without HTML concerns", () => {
    expect(
      build_branch_label_text([
        { to_chapter_id: "af_002", condition_label: "skip" },
        { to_chapter_id: "af_003" },
      ]),
    ).toBe("to af_002 (skip), to af_003");
  });
});

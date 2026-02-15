const rubedo_book_map = Object.freeze({
  "absurd-faith": Object.freeze({
    book_slug: "absurd-faith",
    title: "Absurd Faith",
    synopsis:
      "Canonical descent timeline with optional character-thread overlays.",
    chapters: Object.freeze([
      Object.freeze({
        chapter_id: "af_000",
        timeline_position: 0,
        title: "Awakening",
        scenes: Object.freeze([
          Object.freeze({
            thread_key: "cinza",
            thread_modifier: "core",
            scene_title: "Cinza Wakes",
            scene_lines: Object.freeze([
              "Morning light arrives as if the world is trying not to startle him.",
              "Cinza wakes in stone silence, carrying no memory but plenty of unease.",
            ]),
          }),
          Object.freeze({
            thread_key: "suul",
            thread_modifier: "core",
            scene_title: "Suul Watches",
            scene_lines: Object.freeze([
              "From far above, Suul sees the cave mouth breathe out a newborn traveler.",
              "The same moment feels less gentle, more like a delayed verdict.",
            ]),
          }),
        ]),
      }),
      Object.freeze({
        chapter_id: "af_001",
        timeline_position: 1,
        title: "Edge of the Cliff",
        scenes: Object.freeze([
          Object.freeze({
            thread_key: "cinza",
            thread_modifier: "core",
            scene_title: "Cinza at the Ledge",
            scene_lines: Object.freeze([
              "The world opens below in impossible scale, and panic mixes with awe.",
              "A flickering inner interface interrupts despair and points him toward motion.",
            ]),
          }),
          Object.freeze({
            thread_key: "cinza",
            thread_modifier: "memory",
            scene_title: "Cinza Memory Echo",
            scene_lines: Object.freeze([
              "A voice with no body calls him by a life he cannot remember.",
              "The same cliff now feels like a threshold, not a dead end.",
            ]),
          }),
          Object.freeze({
            thread_key: "alvorada",
            thread_modifier: "core",
            scene_title: "Alvorada Thread",
            scene_lines: Object.freeze([
              "Elsewhere in the same timeline pulse, Alvorada traces the collapse signatures.",
              "The mountain is not a place here; it is a warning mapped in light.",
            ]),
          }),
        ]),
      }),
      Object.freeze({
        chapter_id: "af_002",
        timeline_position: 2,
        title: "First Descent",
        scenes: Object.freeze([
          Object.freeze({
            thread_key: "cinza",
            thread_modifier: "core",
            scene_title: "Cinza Begins",
            scene_lines: Object.freeze([
              "Decision hardens into action; he starts down with trembling resolve.",
              "No certainty, no map, only the stubborn promise to try one last time.",
            ]),
          }),
          Object.freeze({
            thread_key: "suul",
            thread_modifier: "core",
            scene_title: "Suul Response",
            scene_lines: Object.freeze([
              "Suul marks the descent as a narrow opening in a hostile future.",
              "The same step is logged as both risk and miracle.",
            ]),
          }),
        ]),
      }),
    ]),
  }),
});

const rubedo_book_slugs = Object.freeze(Object.keys(rubedo_book_map));

export { rubedo_book_map, rubedo_book_slugs };

// Albedo ascending arc — the wash rises, stage by stage, from the first
// quiet settling after the dark (morning-dew, picking up from nigredo's
// cinder/dawn-edge) up toward the outward-reaching brightness (dawn-light)
// that is the threshold into citrinitas (the yellow/poetic stage).
// Mirror of the nigredo descent: nigredo falls to its threshold, albedo
// rises to its own.
export const ALBEDO_CONTAINERS = [
  {
    key: "morning-dew",
    label: "morning dew",
    states: ["calm", "rest", "relief", "tenderness"],
  },
  {
    key: "even-tide",
    label: "even tide",
    states: ["release", "forgiveness", "lightness"],
  },
  {
    key: "mirror-surface",
    label: "mirror surface",
    states: ["peace", "contentment", "steadiness", "resolve"],
  },
  {
    key: "clear-waters",
    label: "clear waters",
    states: ["clarity", "understanding", "acceptance"],
  },
  {
    key: "sunset-ocean",
    label: "sunset ocean",
    states: ["gratitude", "affection", "belonging"],
  },
  {
    key: "dawn-light",
    label: "dawn light",
    states: ["hope", "anticipation", "wonder"],
  },
];

export const ALBEDO_STATES = ALBEDO_CONTAINERS.flatMap(
  (container) => container.states,
);

export const ALBEDO_STATE_TO_CONTAINER = Object.fromEntries(
  ALBEDO_CONTAINERS.flatMap((container) =>
    container.states.map((state) => [state, container.key]),
  ),
);
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
    key: "clear-waters",
    label: "clear waters",
    states: ["clarity", "understanding", "acceptance"],
  },
  {
    key: "dawn-light",
    label: "dawn light",
    states: ["hope", "anticipation", "wonder"],
  },
  {
    key: "sunset-ocean",
    label: "sunset ocean",
    states: ["gratitude", "affection", "belonging"],
  },
  {
    key: "mirror-surface",
    label: "mirror surface",
    states: ["peace", "contentment", "steadiness", "resolve"],
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
export const NIGREDO_CONTAINERS = [
  {
    key: "hearth",
    label: "hearth",
    states: ["ache", "grief", "loneliness", "hunger"],
  },
  {
    key: "cinder",
    label: "cinder",
    states: ["numb", "exhaustion", "doubt"],
  },
  {
    key: "scorch",
    label: "scorch",
    states: ["shame", "guilt"],
  },
  {
    key: "smoke",
    label: "smoke",
    states: ["dread", "panic", "ruin"],
  },
  {
    key: "blaze",
    label: "blaze",
    states: ["rage", "spite"],
  },
  {
    key: "soot",
    label: "soot",
    states: ["rot", "envy"],
  },
];

export const NIGREDO_STATES = NIGREDO_CONTAINERS.flatMap(
  (container) => container.states,
);

export const NIGREDO_STATE_TO_CONTAINER = Object.fromEntries(
  NIGREDO_CONTAINERS.flatMap((container) =>
    container.states.map((state) => [state, container.key]),
  ),
);

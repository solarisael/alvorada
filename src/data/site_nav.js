export const SITE_NAV_ITEMS = [
  {
    label: "hearth",
    short_label: "hea",
    phase: "home",
    href: "/",
    description: "the door you always come back to.",
  },
  {
    label: "writing",
    short_label: "wri",
    phase: "writing",
    href: "writing",
    description: "the written body — four gates through the work.",
  },
  {
    label: "work",
    short_label: "work",
    phase: "work",
    href: "work",
    description: "tools, systems, and things built beyond this room.",
  },
  {
    label: "about",
    short_label: "about",
    phase: "about",
    href: "about",
    description: "the creature tending the hearth.",
  },
];

export const DESKTOP_NAV_LEFT = SITE_NAV_ITEMS.slice(0, 2);
export const DESKTOP_NAV_RIGHT = SITE_NAV_ITEMS.slice(2);

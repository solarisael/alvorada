export const SITE_NAV_ITEMS = [
  {
    label: "hearth",
    short_label: "hea",
    phase: "home",
    href: "/",
    description: "the door you always come back to.",
  },
  {
    label: "nigredo",
    short_label: "nig",
    phase: "nigredo",
    href: "nigredo",
    description: "the dissolving — everything unmade before it's remade.",
  },
  {
    label: "albedo",
    short_label: "alb",
    phase: "albedo",
    href: "albedo",
    description: "the washing clean — clarity surfacing from the wreck.",
  },
  {
    label: "citrinitas",
    short_label: "cit",
    phase: "citrinitas",
    href: "citrinitas",
    description: "the dawning gold — what's been earned starts to show.",
  },
  {
    label: "rubedo",
    short_label: "rub",
    phase: "rubedo",
    href: "rubedo",
    description: "the reddening — the finished work, alive and whole.",
  },
  {
    label: "codex",
    short_label: "cdx",
    phase: "codex",
    href: "codex",
    description: "the reference shelf — names, terms, and threads gathered.",
  },
];

export const DESKTOP_NAV_LEFT = SITE_NAV_ITEMS.slice(0, 3);
export const DESKTOP_NAV_RIGHT = SITE_NAV_ITEMS.slice(3);

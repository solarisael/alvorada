import { with_base } from "../utils/routes.js";

const CINZA_CARD_ORNAMENT_SRCS = Object.freeze({
  corner_tl: with_base("ornaments/cinza/card_corner_a.svg"),
  corner_tr: with_base("ornaments/cinza/card_corner_b.svg"),
  corner_bl: with_base("ornaments/cinza/card_corner_c.svg"),
  corner_br: with_base("ornaments/cinza/card_corner_d.svg"),
});

const CINZA_PHASE_CARD_ORNAMENT = Object.freeze({
  ...CINZA_CARD_ORNAMENT_SRCS,
  side_left: with_base("ornaments/cinza/card_side_flourish.svg"),
  side_right: with_base("ornaments/cinza/card_side_flourish.svg"),
  sigil: with_base("ornaments/cinza/sigil_eye.svg"),
});

export { CINZA_CARD_ORNAMENT_SRCS, CINZA_PHASE_CARD_ORNAMENT };

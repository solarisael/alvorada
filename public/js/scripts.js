import "./modules/side_menu.js";
import "../vendor/fx/js/index.js";
import "./modules/reading_plane_motion.js";
import "./modules/rubedo_constellation_webgl.js";
import "./modules/wikilink_popup.js";
import { install_node_disposal_lifecycle } from "./modules/node_disposal.js";
import { install_route_accessibility } from "./modules/route_accessibility.js";

install_node_disposal_lifecycle();
install_route_accessibility();

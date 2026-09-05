import { TEXT_FX_INTENSITY_MAX, TEXT_FX_INTENSITY_MIN } from "../contract.js";
import {
  resolve_text_fx_effects_with_stack_rules,
  split_text_fx_tokens,
} from "./normalization.js";
const text_fx_intensity_min = TEXT_FX_INTENSITY_MIN;
const text_fx_intensity_max = TEXT_FX_INTENSITY_MAX;

const parse_text_fx_intensity_value = (raw_value) => {
  if (raw_value == null) {
    return null;
  }

  const parsed_value = Number.parseFloat(String(raw_value));

  if (!Number.isFinite(parsed_value)) {
    return null;
  }

  return Math.min(
    text_fx_intensity_max,
    Math.max(text_fx_intensity_min, parsed_value),
  );
};

const text_fx_effect_attribute_name = (effect_name, channel_name) => {
  const dashed_effect_name = effect_name.replaceAll("_", "-");

  return `data-text-fx-${dashed_effect_name}-${channel_name}`;
};

const text_fx_effect_var_name = (effect_name, channel_name) => {
  return `--text_fx_${effect_name}_${channel_name}`;
};

const collect_text_fx_effects_from_node = (node_value) => {
  if (!(node_value instanceof HTMLElement)) {
    return [];
  }

  const class_tokens = Array.from(node_value.classList);
  const data_tokens = split_text_fx_tokens(node_value.dataset.textFx ?? "");

  return resolve_text_fx_effects_with_stack_rules([
    ...class_tokens,
    ...data_tokens,
  ]);
};

const apply_text_fx_effect_vars = (node_value, effect_names) => {
  for (const effect_name of effect_names) {
    const visual_intensity = parse_text_fx_intensity_value(
      node_value.getAttribute(
        text_fx_effect_attribute_name(effect_name, "intensity"),
      ),
    );
    const motion_intensity = parse_text_fx_intensity_value(
      node_value.getAttribute(
        text_fx_effect_attribute_name(effect_name, "motion"),
      ),
    );
    const speed_intensity = parse_text_fx_intensity_value(
      node_value.getAttribute(
        text_fx_effect_attribute_name(effect_name, "speed"),
      ),
    );
    const visual_var_name = text_fx_effect_var_name(effect_name, "intensity");
    const motion_var_name = text_fx_effect_var_name(effect_name, "motion");
    const speed_var_name = text_fx_effect_var_name(effect_name, "speed");

    if (visual_intensity == null) {
      node_value.style.removeProperty(visual_var_name);
    } else {
      node_value.style.setProperty(visual_var_name, String(visual_intensity));
    }

    if (motion_intensity == null) {
      node_value.style.removeProperty(motion_var_name);
    } else {
      node_value.style.setProperty(motion_var_name, String(motion_intensity));
    }

    if (speed_intensity == null) {
      node_value.style.removeProperty(speed_var_name);
    } else {
      node_value.style.setProperty(speed_var_name, String(speed_intensity));
    }
  }
};

const apply_text_fx_intensity_vars = (
  node_value,
  effect_names = collect_text_fx_effects_from_node(node_value),
) => {
  if (!(node_value instanceof HTMLElement)) {
    return;
  }

  const visual_intensity = parse_text_fx_intensity_value(
    node_value.dataset.textFxIntensity,
  );
  const motion_intensity = parse_text_fx_intensity_value(
    node_value.dataset.textFxMotion,
  );
  const speed_intensity = parse_text_fx_intensity_value(
    node_value.dataset.textFxSpeed,
  );

  if (visual_intensity == null) {
    node_value.style.removeProperty("--text_fx_marker_intensity");
    node_value.style.removeProperty("--block_fx_marker_intensity");
  } else {
    node_value.style.setProperty(
      "--text_fx_marker_intensity",
      String(visual_intensity),
    );
    node_value.style.setProperty(
      "--block_fx_marker_intensity",
      String(visual_intensity),
    );
  }

  if (motion_intensity == null) {
    node_value.style.removeProperty("--text_fx_marker_motion");
    node_value.style.removeProperty("--block_fx_marker_motion");
  } else {
    node_value.style.setProperty(
      "--text_fx_marker_motion",
      String(motion_intensity),
    );
    node_value.style.setProperty(
      "--block_fx_marker_motion",
      String(motion_intensity),
    );
  }

  if (speed_intensity == null) {
    node_value.style.removeProperty("--text_fx_marker_speed");
    node_value.style.removeProperty("--block_fx_marker_speed");
  } else {
    node_value.style.setProperty(
      "--text_fx_marker_speed",
      String(speed_intensity),
    );
    node_value.style.setProperty(
      "--block_fx_marker_speed",
      String(speed_intensity),
    );
  }

  apply_text_fx_effect_vars(node_value, effect_names);
};

export {
  parse_text_fx_intensity_value,
  collect_text_fx_effects_from_node,
  apply_text_fx_intensity_vars,
};

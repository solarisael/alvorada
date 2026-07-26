const SCRIPT_UNSAFE_CHARACTERS = /[<>&\u2028\u2029]/g;
const SCRIPT_ESCAPE_MAP = {
  "<": "\\u003C",
  ">": "\\u003E",
  "&": "\\u0026",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};

const serialize_json_for_script = (value) =>
  JSON.stringify(value).replace(
    SCRIPT_UNSAFE_CHARACTERS,
    (character) => SCRIPT_ESCAPE_MAP[character],
  );

export { serialize_json_for_script };
